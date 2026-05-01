"""
VeriPulse Verification Service
==============================
Real-time article verification using:
  1. Gemini 2.5 Flash with native Google Search grounding (real-time citations)
  2. Google Fact Check Tools API v1alpha1 (official fact-checker database)

Graceful degradation:
  - If GEMINI_API_KEY is set   → full grounding with real-time web search
  - If FACTCHECK_API_KEY is set → enrichment with official fact-check database
  - If neither is set          → returns NEEDS_VERIFICATION (ML fallback upstream)

Uses the new `google.genai` SDK (2026) — not the deprecated `google.generativeai`.

Usage:
    from verification_service import verification_service
    result = await verification_service.verify_article("article text...", url="https://...")
"""

import os
import re
import json
import asyncio
import logging
from datetime import datetime, timezone
from typing import Optional

from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Prompt template for Gemini grounding
# ---------------------------------------------------------------------------
_VERIFICATION_PROMPT = """You are VeriPulse AI — a world-class, unbiased fact-checker.

Article URL: {url}

Article text:
{text}

Instructions:
1. Extract the 3-5 most important *verifiable* claims from this article.
2. Use real-time Google Search to verify each claim against authoritative sources
   (Reuters, AP News, BBC, official government sites, PubMed, etc.).
3. Cross-check against known fact-checker verdicts (Snopes, PolitiFact, FactCheck.org).
4. Assess overall credibility considering writing style, source quality, and claim accuracy.

Return ONLY valid JSON — no markdown fences, no commentary, just the JSON object:
{{
  "verdict": "REAL | FAKE | NEEDS_VERIFICATION",
  "confidence": 0-100,
  "claims": ["claim 1 text", "claim 2 text"],
  "evidence": [
    {{
      "claim": "the specific claim being checked",
      "status": "confirmed | debunked | unverified",
      "source": "BBC News / Reuters / etc.",
      "url": "https://...",
      "date": "YYYY-MM-DD"
    }}
  ],
  "red_flags": ["list of any issues found"],
  "grounding_sources": ["https://source1.com", "https://source2.com"],
  "summary": "One-paragraph explanation of the verdict"
}}

Verdict rules:
- "REAL": Multiple credible sources confirm the core claims (confidence 70-100)
- "FAKE": Core claims are debunked or contradict reliable sources (confidence 70-100)
- "NEEDS_VERIFICATION": Insufficient evidence to confirm or deny (confidence below 70)
"""


class VerificationService:
    """
    Real-time article verification using Google's grounding tools.

    Uses the new `google.genai` SDK (2026) for Gemini 2.5 Flash with
    native Google Search grounding, and `googleapiclient` for the
    Fact Check Tools API.
    """

    def __init__(self):
        self.gemini_key: Optional[str] = os.getenv("GEMINI_API_KEY")
        self.factcheck_key: Optional[str] = os.getenv("FACTCHECK_API_KEY")
        self._client = None
        self._factcheck_service = None

        # --- Gemini 2.5 Flash via new google.genai SDK ---
        if self.gemini_key:
            try:
                from google import genai

                self._client = genai.Client(api_key=self.gemini_key)
                logger.info(
                    "✓ Gemini client initialized (google.genai SDK)"
                )
            except Exception as e:
                logger.warning(f"✗ Gemini initialization failed: {e}")
                self._client = None
        else:
            logger.info(
                "GEMINI_API_KEY not set — grounding disabled, ML fallback active"
            )

        # --- Google Fact Check Tools API ---
        if self.factcheck_key:
            try:
                from googleapiclient.discovery import build

                self._factcheck_service = build(
                    "factchecktools",
                    "v1alpha1",
                    developerKey=self.factcheck_key,
                )
                logger.info("✓ Google Fact Check Tools API initialized")
            except Exception as e:
                logger.warning(f"✗ Fact Check API initialization failed: {e}")
                self._factcheck_service = None
        else:
            logger.info(
                "FACTCHECK_API_KEY not set — fact-check enrichment disabled"
            )

    # ------------------------------------------------------------------
    # Public properties
    # ------------------------------------------------------------------
    @property
    def is_grounding_available(self) -> bool:
        """True if Gemini client is loaded and ready."""
        return self._client is not None

    @property
    def is_factcheck_available(self) -> bool:
        """True if Google Fact Check Tools API is ready."""
        return self._factcheck_service is not None

    # ------------------------------------------------------------------
    # Main entry point
    # ------------------------------------------------------------------
    async def verify_article(
        self, text: str, url: Optional[str] = None
    ) -> dict:
        """
        Verify an article using Gemini grounding + Fact Check API.

        Args:
            text: Article text (first 12 000 chars are used)
            url:  Optional URL of the source article

        Returns:
            dict with verdict, confidence, claims, evidence, red_flags,
            grounding_sources, summary, and metadata fields.
        """
        if not self._client:
            return self._fallback_result()

        try:
            result = await self._ground_with_gemini(text, url)

            # Enrich with official fact-checker database
            if self._factcheck_service and result.get("claims"):
                await self._enrich_with_factcheck(result)

            # Attach metadata
            result["verification_method"] = "gemini_grounding"
            result["timestamp"] = datetime.now(timezone.utc).isoformat()
            result["grounding_available"] = True
            return result

        except Exception as e:
            logger.error(f"Grounding verification failed: {e}")
            fallback = self._fallback_result()
            fallback["grounding_error"] = str(e)
            return fallback

    # ------------------------------------------------------------------
    # Gemini grounding call (new google.genai SDK)
    # ------------------------------------------------------------------
    async def _ground_with_gemini(
        self, text: str, url: Optional[str] = None
    ) -> dict:
        """
        Call Gemini 2.5 Flash with Google Search grounding enabled.

        Uses the new `google.genai` SDK which supports GoogleSearch as a
        native tool for real-time web grounding.
        """
        from google.genai import types

        prompt = _VERIFICATION_PROMPT.format(
            url=url or "Not provided",
            text=text[:12_000],
        )

        # Build config with Google Search grounding tool
        config = types.GenerateContentConfig(
            tools=[
                types.Tool(
                    google_search=types.GoogleSearch()
                )
            ],
            temperature=0.1,
            max_output_tokens=2048,
        )

        # google.genai client is synchronous — run in thread
        response = await asyncio.to_thread(
            self._client.models.generate_content,
            model="gemini-2.5-flash",
            contents=prompt,
            config=config,
        )

        # Parse grounding response
        raw_text = response.text
        logger.info(f"Gemini response received ({len(raw_text)} chars)")

        result = self._parse_json_response(raw_text)
        self._sanitize_result(result)
        return result

    # ------------------------------------------------------------------
    # Fact Check API enrichment
    # ------------------------------------------------------------------
    async def _enrich_with_factcheck(self, result: dict) -> None:
        """Cross-check top claims via Google Fact Check Tools API."""

        try:
            from googleapiclient.errors import HttpError
        except ImportError:
            return

        for claim_text in result.get("claims", [])[:3]:
            try:
                request = self._factcheck_service.claims().search(
                    query=claim_text, languageCode="en"
                )
                response = await asyncio.to_thread(request.execute)

                for fc_claim in response.get("claims", []):
                    review = fc_claim.get("claimReview", [{}])[0]
                    result["evidence"].append(
                        {
                            "claim": claim_text,
                            "status": "factchecked",
                            "source": review.get("publisher", {}).get(
                                "name", "Unknown"
                            ),
                            "url": review.get("url", ""),
                            "rating": review.get("textualRating", ""),
                            "date": review.get("reviewDate", ""),
                        }
                    )
                    logger.info(
                        f"Fact Check match: {claim_text[:60]}..."
                    )
            except HttpError as e:
                logger.warning(f"Fact Check API HTTP error: {e}")
            except Exception as e:
                logger.warning(f"Fact Check lookup failed: {e}")

    # ------------------------------------------------------------------
    # Standalone fact-check query (no Gemini needed)
    # ------------------------------------------------------------------
    async def factcheck_only(self, query: str) -> list:
        """
        Direct Fact Check API lookup — useful for quick claim checks.

        Returns a list of fact-check results or an empty list.
        """
        if not self._factcheck_service:
            return []

        try:
            request = self._factcheck_service.claims().search(
                query=query, languageCode="en"
            )
            response = await asyncio.to_thread(request.execute)

            results = []
            for claim in response.get("claims", []):
                for review in claim.get("claimReview", []):
                    results.append(
                        {
                            "claim": claim.get("text", ""),
                            "claimant": claim.get("claimant", "Unknown"),
                            "rating": review.get("textualRating", ""),
                            "publisher": review.get("publisher", {}).get(
                                "name", ""
                            ),
                            "url": review.get("url", ""),
                            "date": review.get("reviewDate", ""),
                        }
                    )
            return results
        except Exception as e:
            logger.warning(f"Fact Check API query failed: {e}")
            return []

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------
    @staticmethod
    def _parse_json_response(raw: str) -> dict:
        """
        Extract JSON from Gemini's response text.

        Handles Gemini grounding quirks:
          - Duplicated JSON blocks separated by ```json fences
          - Truncated grounding_sources URLs
          - Trailing commas before ] or }
          - Control characters (newlines) inside string values
        """
        text = raw.strip()
        logger.info(f"Parsing Gemini response ({len(text)} chars)")

        # Helper: try parsing with strict=False (allows control chars)
        def _try_parse(s: str) -> dict | None:
            try:
                return json.loads(s, strict=False)
            except (json.JSONDecodeError, ValueError):
                return None

        # Helper: fix trailing commas
        def _fix_commas(s: str) -> str:
            return re.sub(r",\s*([}\]])", r"\1", s)

        # Helper: repair truncated JSON by closing unclosed structures
        def _repair_json(s: str) -> dict | None:
            # Remove any trailing partial string (unclosed quote)
            # Find last properly closed structure
            s = s.rstrip()
            # If we're inside a string, close it
            # Count unescaped quotes
            in_str = False
            for i, c in enumerate(s):
                if c == '\\' and in_str:
                    continue  # skip escaped char
                if c == '"':
                    in_str = not in_str
            if in_str:
                s += '"'  # close the string

            # Close any open brackets/braces
            open_stack = []
            in_str = False
            escape_next = False
            for c in s:
                if escape_next:
                    escape_next = False
                    continue
                if c == '\\' and in_str:
                    escape_next = True
                    continue
                if c == '"':
                    in_str = not in_str
                    continue
                if in_str:
                    continue
                if c in '{[':
                    open_stack.append(c)
                elif c == '}' and open_stack and open_stack[-1] == '{':
                    open_stack.pop()
                elif c == ']' and open_stack and open_stack[-1] == '[':
                    open_stack.pop()

            # Close in reverse order
            closers = {'{': '}', '[': ']'}
            for opener in reversed(open_stack):
                s += closers.get(opener, '')

            return _try_parse(_fix_commas(s))

        # --- Strategy 1: Strip fences and try direct parse ---
        clean = re.sub(r"^```(?:json)?\s*", "", text)
        clean = re.sub(r"\s*```\s*$", "", clean).strip()
        result = _try_parse(clean)
        if result is not None:
            return result
        result = _try_parse(_fix_commas(clean))
        if result is not None:
            return result

        # --- Strategy 2: Split on ```json fences, try each block ---
        # Gemini with grounding often duplicates: ```json{...}```json{...}
        blocks = re.split(r"```(?:json)?\s*", text)
        for block in blocks:
            block = block.strip().rstrip("`").strip()
            if not block or not block.startswith("{"):
                continue
            # Try direct parse
            result = _try_parse(_fix_commas(block))
            if result is not None:
                return result
            # Try repair (handles truncated URLs)
            result = _repair_json(block)
            if result is not None:
                logger.info("Parsed Gemini JSON after repair (truncated block)")
                return result

        # --- Strategy 3: Find first { and try repair ---
        start = text.find("{")
        if start != -1:
            # Find where the second ```json starts (if duplicated)
            second_fence = text.find("```json", start)
            if second_fence == -1:
                second_fence = text.find("```\n{", start)
            end = second_fence if second_fence > start else len(text)
            block = text[start:end].strip().rstrip("`").strip()
            result = _repair_json(block)
            if result is not None:
                logger.info("Parsed Gemini JSON after block extraction + repair")
                return result

        # --- Strategy 4: Last resort fallback ---
        logger.warning(
            f"Could not parse Gemini JSON ({len(text)} chars). "
            f"First 300 chars: {text[:300]}"
        )
        return {
            "verdict": "NEEDS_VERIFICATION",
            "confidence": 50,
            "claims": [],
            "evidence": [],
            "red_flags": ["Gemini returned unparseable response"],
            "grounding_sources": [],
            "summary": text[:500],
        }

    @staticmethod
    def _sanitize_result(result: dict) -> None:
        """Ensure all expected fields exist and are within valid ranges."""
        result.setdefault("verdict", "NEEDS_VERIFICATION")
        result.setdefault("confidence", 50)
        result.setdefault("claims", [])
        result.setdefault("evidence", [])
        result.setdefault("red_flags", [])
        result.setdefault("grounding_sources", [])
        result.setdefault("summary", "")

        # Clamp confidence to [0, 100]
        result["confidence"] = max(0, min(100, int(result["confidence"])))

        # Normalize verdict
        valid = {"REAL", "FAKE", "NEEDS_VERIFICATION"}
        if result["verdict"] not in valid:
            result["verdict"] = "NEEDS_VERIFICATION"

    @staticmethod
    def _fallback_result() -> dict:
        """Safe fallback when grounding is unavailable."""
        return {
            "verdict": "NEEDS_VERIFICATION",
            "confidence": 50,
            "claims": [],
            "evidence": [],
            "red_flags": [
                "LLM grounding unavailable — falling back to ML-only analysis"
            ],
            "grounding_sources": [],
            "summary": (
                "Gemini grounding not available. "
                "Analysis based on ML model only."
            ),
            "verification_method": "ml_fallback",
            "grounding_available": False,
            "note": (
                "Set GEMINI_API_KEY in .env for real-time "
                "Google Search grounding"
            ),
        }


# ---------------------------------------------------------------------------
# Singleton — imported by app.py
# ---------------------------------------------------------------------------
verification_service = VerificationService()
