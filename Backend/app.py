
"""
Fake News Detection API - Production Version
=============================================
FastAPI backend with TF-IDF + Logistic Regression model.

Endpoints:
- GET  /          - Root info
- GET  /health    - Health check
- GET  /model-info - Model metadata
- POST /predict   - Analyze news text (ML-based)
- POST /verify    - Deep verification (Claude API)

Author: Design Engineering Project - Semester 5
Version: 1.0
"""

import os
import logging
from datetime import datetime
from collections import deque
from uuid import uuid4

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))
except ImportError:
    pass  # python-dotenv not installed, use system env vars
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional

# Shared config (single source of truth)
try:
    from Backend.config import MODEL_VERSION, DATASET_NAME, MIN_TEXT_LENGTH
except ImportError:
    from config import MODEL_VERSION, DATASET_NAME, MIN_TEXT_LENGTH

# Unified ML prediction pipeline (lr_model.pkl + vectorizer.pkl + metadata features)
try:
    from Backend.model import predict_news, model_metadata
except ImportError:
    from model import predict_news, model_metadata

# Enhanced Hybrid Verifier (ML + Rules + Web Search — fallback)
try:
    from Backend.enhanced_hybrid_verifier import verify_with_enhanced_hybrid
    HYBRID_AVAILABLE = True
except ImportError:
    try:
        from enhanced_hybrid_verifier import verify_with_enhanced_hybrid
        HYBRID_AVAILABLE = True
    except ImportError:
        HYBRID_AVAILABLE = False

# Gemini Grounding + Fact Check API service
try:
    from Backend.verification_service import verification_service
except ImportError:
    try:
        from verification_service import verification_service
    except ImportError:
        verification_service = None

# Firestore persistence for live feed
try:
    from Backend.firestore_service import FirestoreService
    firestore_service = FirestoreService()
    print("[OK] Firestore service initialized")
except ImportError:
    try:
        from firestore_service import FirestoreService
        firestore_service = FirestoreService()
        print("[OK] Firestore service initialized")
    except Exception as _fs_err:
        firestore_service = None
        print(f"[!] Firestore unavailable: {_fs_err}")

# Wikipedia for fact-checking (pip install wikipedia)
try:
    import wikipedia
    wikipedia.set_lang("en")
    WIKIPEDIA_AVAILABLE = True
except ImportError:
    WIKIPEDIA_AVAILABLE = False

# --- Logging Configuration ---
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)s | %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# --- API Configuration ---
# MODEL_VERSION, DATASET_NAME, MIN_TEXT_LENGTH are imported from config.py

app = FastAPI(
    title="Fake News Detection API",
    version=MODEL_VERSION,
    description="Production API for fake news detection using TF-IDF and Logistic Regression"
)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Startup ---
@app.on_event("startup")
async def startup_event():
    """Validate model loads on startup."""
    try:
        info = model_metadata()
        if "error" in info:
            logger.warning(f"Model issue: {info['error']}")
        else:
            logger.info(f"Model loaded: {info.get('model_type', 'unknown')}")
            logger.info(f"Vocabulary size: {info.get('tfidf_vocab_size', 'unknown')}")
    except Exception as e:
        logger.warning(f"Model not loaded: {e}")


# --- Live Feed Cache (REST fallback) ---
LOCAL_FEED = deque(maxlen=100)


def _normalize_confidence(value) -> float:
    try:
        conf = float(value)
    except (TypeError, ValueError):
        return 0.0
    if conf > 1:
        conf = conf / 100.0
    return max(0.0, min(1.0, conf))


def _normalize_red_flags(flags) -> list:
    if not flags:
        return []
    normalized = []
    for f in flags:
        if isinstance(f, dict):
            normalized.append(f.get("description", str(f)))
        else:
            normalized.append(str(f))
    return normalized


def _build_feed_record(
    verdict: str,
    text: str,
    url: str | None,
    confidence: float | int | None,
    red_flags: list | None = None,
    grounded_evidence: str = "",
    verification_method: str = "",
) -> dict:
    return {
        "id": uuid4().hex,
        "verdict": verdict,
        "text": text,
        "url": url,
        "timestamp": datetime.utcnow().isoformat(),
        "confidence": _normalize_confidence(confidence),
        "red_flags": _normalize_red_flags(red_flags),
        "grounded_evidence": grounded_evidence or "",
        "verification_method": verification_method or "",
    }


def _record_live_feed(record: dict) -> None:
    LOCAL_FEED.appendleft(record)


def _map_recommendation_to_verdict(recommendation: str) -> str:
    rec = (recommendation or "").strip().lower()
    if rec in {"likely_real", "real", "true", "verified"}:
        return "REAL"
    if rec in {"likely_fake", "fake", "false", "misleading"}:
        return "FAKE"
    if rec in {"mixed", "questionable", "unverifiable", "needs_verification", "needs verification"}:
        return "NEEDS VERIFICATION"
    return recommendation or "NEEDS VERIFICATION"


# --- Wikipedia Fact-Check Utility ---
def check_wikipedia(keywords: list) -> dict:
    """
    Check Wikipedia for related information using top keywords.
    
    Args:
        keywords: List of keywords to search (top 2-3)
        
    Returns:
        dict with status and source
    """
    if not WIKIPEDIA_AVAILABLE:
        return {"status": "Wikipedia module not available", "source": None}
    
    if not keywords:
        return {"status": "No keywords to check", "source": None}
    
    search_query = " ".join(keywords[:3])
    
    try:
        results = wikipedia.search(search_query, results=3)
        if results:
            return {
                "status": "Related information found",
                "source": "Wikipedia",
                "topics_found": results[:2]
            }
        else:
            return {"status": "No reliable reference found", "source": "Wikipedia"}
    except wikipedia.exceptions.DisambiguationError:
        return {"status": "Related information found", "source": "Wikipedia"}
    except wikipedia.exceptions.PageError:
        return {"status": "No reliable reference found", "source": "Wikipedia"}
    except Exception as e:
        logger.warning(f"Wikipedia check failed: {e}")
        return {"status": "Check unavailable", "source": None, "error": str(e)}


# --- Request/Response Models ---
class NewsRequest(BaseModel):
    """Request body for prediction."""
    text: str = Field(
        ..., 
        min_length=1, 
        max_length=50000,
        description="News article or headline to analyze"
    )


class VerifyRequest(BaseModel):
    """Request body for deep verification."""
    text: str = Field(
        ..., 
        min_length=20, 
        max_length=100000,
        description="News article text to verify"
    )
    url: Optional[str] = Field(
        None,
        description="Optional URL of the article"
    )


# --- API Endpoints ---

@app.get("/")
def root():
    """Root endpoint with API info."""
    return {
        "name": "Fake News Detection API",
        "version": MODEL_VERSION,
        "status": "running",
        "endpoints": {
            "/health": "Health check",
            "/model-info": "Model metadata",
            "/predict": "Analyze news (POST)"
        }
    }


@app.get("/health")
def health_check():
    """
    Health check endpoint.
    
    Returns:
        status: "running" if API is operational
    """
    return {
        "status": "running"
    }


@app.get("/model-info")
def model_info():
    """
    Get model metadata.
    
    Returns:
        model: Model type
        vectorizer: Vectorizer type
        accuracy: Training accuracy
        version: Model version
        trained_on: Dataset name
    """
    info = model_metadata()
    info["version"] = MODEL_VERSION
    info["trained_on"] = DATASET_NAME
    return info


def predict_internal(text: str) -> dict:
    """
    Internal prediction function for use by other modules.
    Uses the unified pipeline from model.py (lr_model + vectorizer + metadata).
    
    Args:
        text: Article text to predict
        
    Returns:
        dict with prediction ("Real"/"Fake") and confidence (0-1)
    """
    result = predict_news(text)
    
    # Map three-state label back to simple Real/Fake for hybrid verifier
    ml_prediction = result.get("ml_prediction", "REAL")
    label = "Real" if ml_prediction == "REAL" else "Fake"
    
    return {
        "prediction": label,
        "confidence": result.get("ml_confidence", result.get("confidence", 0.5))
    }


@app.post("/predict")
async def predict(request: NewsRequest):
    """
    Predict if news is Real or Fake — AI-powered with Gemini grounding.

    Pipeline:
      1. ML pattern analysis (instant ~50ms) — catches writing-style red flags
      2. Gemini 2.5 Flash + Google Search grounding (~3-8s) — verifies facts
      3. Smart ensemble: AI verdict wins when confident, ML as safety net
      4. Falls back to ML-only with warning if Gemini unavailable

    Input:
        text: News article or headline (minimum 20 characters)

    Output:
        prediction: "Real" or "Fake"
        confidence: Probability percentage (0-100)
        label: REAL / FAKE / NEEDS VERIFICATION
        evidence_summary: AI explanation of verdict
        sources: Grounding sources with URLs
        claims_analysis: Individual claim verdicts
        red_flags: Detected issues
        explanation_keywords: Top ML contributing words
        source_credibility: Score + factors
        verification_method: "gemini_grounding" or "ml_only"
    """
    # --- Input Validation ---
    text = request.text.strip()

    if not text:
        logger.warning("Prediction rejected: Empty text")
        raise HTTPException(
            status_code=400,
            detail="Text cannot be empty"
        )

    if len(text) < MIN_TEXT_LENGTH:
        logger.warning(f"Prediction rejected: Text too short ({len(text)} chars)")
        raise HTTPException(
            status_code=400,
            detail=f"Text must be at least {MIN_TEXT_LENGTH} characters. Got {len(text)}."
        )

    try:
        # =============================================================
        # Step 1: Fast ML prediction (always runs — ~50ms)
        # =============================================================
        ml_result = predict_news(text)
        ml_prediction = "Real" if ml_result["ml_prediction"] == "REAL" else "Fake"
        ml_confidence = ml_result.get("ml_confidence", ml_result.get("confidence", 0.5))
        ml_confidence_pct = round(ml_confidence * 100, 2)
        top_keywords = ml_result.get("top_features", [])

        logger.info(
            f"ML prediction: {ml_prediction} | "
            f"Confidence: {ml_confidence_pct:.1f}% | "
            f"Text: {text[:50]}..."
        )

        # =============================================================
        # Step 2: Gemini AI Grounding (if available — ~3-8s)
        # =============================================================
        grounding_result = None
        if (
            verification_service is not None
            and verification_service.is_grounding_available
        ):
            logger.info("Running Gemini 2.5 Flash grounding for /predict…")
            try:
                grounding_result = await verification_service.verify_article(text)
                logger.info(
                    f"Grounding verdict: {grounding_result.get('verdict')} "
                    f"({grounding_result.get('confidence')}%)"
                )
            except Exception as grounding_err:
                logger.error(f"Grounding call failed: {grounding_err}")
                grounding_result = None

        # =============================================================
        # Step 3: Smart Ensemble — merge ML + AI results
        # =============================================================
        if grounding_result and grounding_result.get("grounding_available"):
            llm_conf = grounding_result.get("confidence", 0)
            llm_verdict = grounding_result.get("verdict", "NEEDS_VERIFICATION")

            # Decision: trust AI when it's confident, else fall back to ML
            if llm_conf >= 70:
                final_prediction = "Real" if llm_verdict == "REAL" else "Fake"
                final_label = llm_verdict
                final_confidence_pct = llm_conf
            else:
                final_prediction = ml_prediction
                final_label = ml_result.get("label", ml_prediction.upper())
                final_confidence_pct = ml_confidence_pct

            # Merge red flags (unique)
            ml_flags = ml_result.get("red_flags", [])
            llm_flags = grounding_result.get("red_flags", [])
            ml_flag_strs = []
            for f in ml_flags:
                if isinstance(f, dict):
                    ml_flag_strs.append(f.get("description", str(f)))
                else:
                    ml_flag_strs.append(str(f))
            all_flags = list(dict.fromkeys(ml_flag_strs + llm_flags))

            # Confidence level label
            if final_confidence_pct >= 80:
                reliability = "High confidence — AI verified"
            elif final_confidence_pct >= 60:
                reliability = "Moderate confidence"
            else:
                reliability = "Low confidence - manual verification recommended"

            # Build claims analysis from grounding evidence
            claims_analysis = [
                {
                    "claim": ev.get("claim", ""),
                    "status": ev.get("status", "unverified"),
                    "source": ev.get("source", ""),
                    "url": ev.get("url", ""),
                    "date": ev.get("date", ""),
                }
                for ev in grounding_result.get("evidence", [])
            ]

            response = {
                # Primary fields
                "prediction": final_prediction,
                "confidence": final_confidence_pct,
                "reliability": reliability,
                "label": final_label,
                "explanation_keywords": top_keywords,
                "model_version": MODEL_VERSION,
                # AI evidence & sources
                "evidence_summary": grounding_result.get("summary", ""),
                "sources": grounding_result.get("grounding_sources", []),
                "claims_analysis": claims_analysis,
                "red_flags": all_flags,
                # Source credibility
                "source_credibility": {
                    "score": final_confidence_pct / 100,
                    "factors": grounding_result.get("summary", f"AI confidence: {final_confidence_pct}%")
                },
                # Metadata
                "verification_method": "gemini_grounding",
                "note": "Verified using Gemini AI with real-time Google Search grounding.",
            }

            feed_record = _build_feed_record(
                verdict=final_label,
                text=text,
                url=None,
                confidence=final_confidence_pct,
                red_flags=all_flags,
                grounded_evidence=grounding_result.get("summary", ""),
                verification_method="gemini_grounding",
            )
            _record_live_feed(feed_record)

            logger.info(
                f"AI-grounded prediction: {final_prediction} "
                f"(confidence: {final_confidence_pct}%)"
            )

            # Save to Firestore for live feed
            if firestore_service:
                try:
                    await firestore_service.save_verification(
                        final_label,
                        text,
                        None,
                        confidence=feed_record["confidence"],
                        red_flags=feed_record["red_flags"],
                        grounded_evidence=feed_record["grounded_evidence"],
                        verification_method=feed_record["verification_method"],
                    )
                except Exception as fs_err:
                    logger.warning(f"Firestore save failed: {fs_err}")

            return response

        # =============================================================
        # Step 4: ML-only fallback (no Gemini API key)
        # =============================================================
        logger.warning("Gemini unavailable — returning ML-only prediction")

        if ml_confidence_pct >= 85:
            reliability = "High confidence"
        elif ml_confidence_pct >= 70:
            reliability = "Moderate confidence"
        else:
            reliability = "Low confidence - manual verification recommended"

        # Wikipedia fact-check for low confidence
        if ml_confidence_pct < 80 or reliability.startswith("Low"):
            fact_check = check_wikipedia(top_keywords)
            logger.info(f"Fact-check triggered: {fact_check.get('status')}")
        else:
            fact_check = {"status": "Not required (high confidence)"}

        feed_record = _build_feed_record(
            verdict=ml_result.get("label", ml_prediction.upper()),
            text=text,
            url=None,
            confidence=ml_confidence_pct,
            red_flags=ml_result.get("red_flags", []),
            grounded_evidence=ml_result.get("explanation", ""),
            verification_method="ml_only",
        )
        _record_live_feed(feed_record)

        if firestore_service:
            try:
                await firestore_service.save_verification(
                    feed_record["verdict"],
                    text,
                    None,
                    confidence=feed_record["confidence"],
                    red_flags=feed_record["red_flags"],
                    grounded_evidence=feed_record["grounded_evidence"],
                    verification_method=feed_record["verification_method"],
                )
            except Exception as fs_err:
                logger.warning(f"Firestore save failed: {fs_err}")

        return {
            # Primary fields
            "prediction": ml_prediction,
            "confidence": ml_confidence_pct,
            "reliability": reliability,
            "label": ml_result.get("label", ml_prediction.upper()),
            "explanation_keywords": top_keywords,
            "model_version": MODEL_VERSION,
            # No AI evidence available
            "evidence_summary": "",
            "sources": [],
            "claims_analysis": [],
            "red_flags": [],
            # Source credibility
            "source_credibility": {
                "score": ml_result.get("credibility_score", 0.5),
                "factors": ml_result.get("credibility_explanation", f"Model confidence: {ml_confidence_pct}%")
            },
            # Metadata
            "verification_method": "ml_only",
            "note": (
                "⚠️ AI verification unavailable. This result is based on ML pattern "
                "analysis only, which may not accurately assess factual claims. "
                "Add GEMINI_API_KEY to .env for real-time AI fact-checking."
            ),
            "fact_check": fact_check,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Prediction failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {str(e)}"
        )


# =============================================================================
# DEEP VERIFICATION ENDPOINT (Gemini Grounding + Fact Check API)
# =============================================================================

@app.post("/verify")
async def verify(request: VerifyRequest):
    """
    Deep verification using Gemini 2.5 Flash Google Search grounding.

    Pipeline:
      1. ML prediction via unified pipeline (fast, ~50ms)
      2. Gemini 2.5 Flash + Google Search grounding (real-time, 3-8s)
      3. Google Fact Check Tools API enrichment (optional)
      4. Smart ensemble: LLM verdict wins if confidence > 70, else ML
      5. Falls back to hybrid verifier → ML-only if no API keys

    Input:
        text: News article text to verify (minimum 20 characters)
        url:  Optional URL of the article

    Output:
        Comprehensive verification report with grounded evidence,
        backward-compatible with existing frontend.
    """
    # --- Input validation ---
    text = request.text.strip()
    if len(text) < 20:
        raise HTTPException(
            status_code=400,
            detail="Text must be at least 20 characters for verification."
        )

    logger.info(f"Starting verification ({len(text)} chars)")

    try:
        # =================================================================
        # Step 1: Fast ML prediction (always runs — ~50ms)
        # =================================================================
        prediction_result = predict_internal(text)
        ml_prediction = prediction_result["prediction"]   # "Real" / "Fake"
        ml_confidence = prediction_result["confidence"]    # 0.0–1.0

        # Also get the rich ML result for red_flags / explanation
        ml_rich = predict_news(text)

        logger.info(
            f"ML prediction: {ml_prediction} "
            f"(confidence: {ml_confidence:.1%})"
        )

        # =================================================================
        # Step 2: Try Gemini grounding (if API key present)
        # =================================================================
        grounding_result = None
        if (
            verification_service is not None
            and verification_service.is_grounding_available
        ):
            logger.info("Running Gemini 2.5 Flash grounding…")
            try:
                grounding_result = await verification_service.verify_article(
                    text, request.url
                )
                logger.info(
                    f"Grounding verdict: {grounding_result.get('verdict')} "
                    f"({grounding_result.get('confidence')}%)"
                )
            except Exception as grounding_err:
                logger.error(f"Grounding call failed: {grounding_err}")
                grounding_result = None

        # =================================================================
        # Step 3: Smart ensemble — merge ML + LLM results
        # =================================================================
        if grounding_result and grounding_result.get("grounding_available"):
            llm_conf = grounding_result.get("confidence", 0)
            llm_verdict = grounding_result.get("verdict", "NEEDS_VERIFICATION")

            # Decision logic: trust LLM when it's confident
            if llm_conf >= 70:
                final_verdict = llm_verdict
                final_confidence = llm_conf / 100
            else:
                # LLM uncertain → fall back to ML verdict
                final_verdict = ml_prediction.upper()
                final_confidence = ml_confidence

            # Merge red flags (unique)
            ml_flags = ml_rich.get("red_flags", [])
            llm_flags = grounding_result.get("red_flags", [])
            # Normalize: ml_flags may be dicts, llm_flags may be strings
            ml_flag_strs = []
            for f in ml_flags:
                if isinstance(f, dict):
                    ml_flag_strs.append(f.get("description", str(f)))
                else:
                    ml_flag_strs.append(str(f))
            all_flags = list(dict.fromkeys(ml_flag_strs + llm_flags))

            # Confidence level label
            if final_confidence >= 0.80:
                conf_level = "high"
            elif final_confidence >= 0.60:
                conf_level = "medium"
            else:
                conf_level = "low"

            final_result = {
                # --- Core assessment ---
                "overall_assessment": {
                    "credibility_score": round(final_confidence * 100),
                    "recommendation": final_verdict,
                    "confidence_level": conf_level,
                },
                # --- Grounded evidence from Gemini ---
                "claims_analysis": [
                    {
                        "claim": ev.get("claim", ""),
                        "status": ev.get("status", "unverified"),
                        "source": ev.get("source", ""),
                        "url": ev.get("url", ""),
                        "date": ev.get("date", ""),
                    }
                    for ev in grounding_result.get("evidence", [])
                ],
                "grounded_evidence": grounding_result.get("evidence", []),
                "grounding_sources": grounding_result.get(
                    "grounding_sources", []
                ),
                # --- Red flags (merged & unique) ---
                "red_flags": all_flags,
                # --- Evidence summary ---
                "evidence_summary": grounding_result.get("summary", ""),
                # --- ML analysis (backward compat for frontend) ---
                "ml_analysis": {
                    "prediction": ml_prediction,
                    "confidence": ml_confidence,
                    "explanation_keywords": ml_rich.get("top_features", []),
                    "is_extreme_claim": ml_rich.get("is_extreme_claim", False),
                    "label": ml_rich.get("label", ""),
                },
                # --- Metadata ---
                "verification_method": "gemini_grounding",
                "timestamp": grounding_result.get("timestamp", ""),
                "model_used": "gemini-2.5-flash",
                "error": False,
            }

            logger.info(
                f"Grounded verification complete — "
                f"verdict: {final_verdict} "
                f"(score: {final_confidence:.1%})"
            )

            feed_record = _build_feed_record(
                verdict=final_verdict,
                text=text,
                url=request.url,
                confidence=final_confidence,
                red_flags=all_flags,
                grounded_evidence=grounding_result.get("summary", ""),
                verification_method="gemini_grounding",
            )
            _record_live_feed(feed_record)

            # Save to Firestore for live feed
            if firestore_service:
                try:
                    await firestore_service.save_verification(
                        final_verdict,
                        text,
                        request.url,
                        confidence=feed_record["confidence"],
                        red_flags=feed_record["red_flags"],
                        grounded_evidence=feed_record["grounded_evidence"],
                        verification_method=feed_record["verification_method"],
                    )
                except Exception as fs_err:
                    logger.warning(f"Firestore save failed: {fs_err}")

            return final_result

        # =================================================================
        # Step 4: Fallback to hybrid verifier (ML + Rules + Web Search)
        # =================================================================
        if HYBRID_AVAILABLE:
            logger.info(
                "Grounding unavailable — falling back to hybrid verifier"
            )
            result = verify_with_enhanced_hybrid(
                article_text=text,
                ml_prediction=ml_prediction,
                ml_confidence=ml_confidence,
                url=request.url,
            )
            result["verification_method"] = "hybrid_ml_rules_web"
            logger.info(
                f"Hybrid verification complete — "
                f"score: {result.get('overall_assessment', {}).get('credibility_score', 'N/A')}"
            )

            hybrid_rec = result.get("overall_assessment", {}).get(
                "recommendation", ""
            )
            hybrid_verdict = _map_recommendation_to_verdict(hybrid_rec)
            hybrid_score = result.get("overall_assessment", {}).get(
                "credibility_score", 0
            )
            feed_record = _build_feed_record(
                verdict=hybrid_verdict,
                text=text,
                url=request.url,
                confidence=hybrid_score,
                red_flags=result.get("red_flags", []),
                grounded_evidence=result.get("evidence_summary", ""),
                verification_method="hybrid_ml_rules_web",
            )
            _record_live_feed(feed_record)

            # Save to Firestore for live feed
            if firestore_service:
                try:
                    await firestore_service.save_verification(
                        hybrid_verdict,
                        text,
                        request.url,
                        confidence=feed_record["confidence"],
                        red_flags=feed_record["red_flags"],
                        grounded_evidence=feed_record["grounded_evidence"],
                        verification_method=feed_record["verification_method"],
                    )
                except Exception as fs_err:
                    logger.warning(f"Firestore save failed: {fs_err}")

            return result

        # =================================================================
        # Step 5: Last resort — ML-only result
        # =================================================================
        logger.warning("No verifier available — returning ML-only result")
        ml_only_result = {
            "overall_assessment": {
                "credibility_score": ml_confidence,
                "recommendation": ml_prediction.upper(),
                "confidence_level": "low",
            },
            "claims_analysis": [],
            "red_flags": ["No external verification available"],
            "evidence_summary": (
                "ML-only analysis. "
                "Add GEMINI_API_KEY to .env for real-time verification."
            ),
            "ml_analysis": {
                "prediction": ml_prediction,
                "confidence": ml_confidence,
                "explanation_keywords": ml_rich.get("top_features", []),
            },
            "verification_method": "ml_only",
            "error": False,
        }

        feed_record = _build_feed_record(
            verdict=ml_prediction.upper(),
            text=text,
            url=request.url,
            confidence=ml_confidence,
            red_flags=ml_only_result.get("red_flags", []),
            grounded_evidence=ml_only_result.get("evidence_summary", ""),
            verification_method="ml_only",
        )
        _record_live_feed(feed_record)

        # Save to Firestore for live feed
        if firestore_service:
            try:
                await firestore_service.save_verification(
                    ml_prediction.upper(),
                    text,
                    request.url,
                    confidence=feed_record["confidence"],
                    red_flags=feed_record["red_flags"],
                    grounded_evidence=feed_record["grounded_evidence"],
                    verification_method=feed_record["verification_method"],
                )
            except Exception as fs_err:
                logger.warning(f"Firestore save failed: {fs_err}")

        return ml_only_result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Verification failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Verification failed: {str(e)}"
        )


@app.get("/verify/status")
def verify_status():
    """
    Check verification capabilities.
    
    Returns:
        Status of all verification methods (grounding, hybrid, ML).
    """
    grounding_available = (
        verification_service is not None
        and verification_service.is_grounding_available
    )
    factcheck_available = (
        verification_service is not None
        and verification_service.is_factcheck_available
    )
    
    return {
        "ai_available": grounding_available or HYBRID_AVAILABLE,
        "provider": (
            "gemini_grounding" if grounding_available
            else "hybrid_ml_rules_web" if HYBRID_AVAILABLE
            else "ml_only"
        ),
        "message": (
            "Gemini 2.5 Flash with Google Search grounding active" if grounding_available
            else "Enhanced verification active (ML + Rules + Web Search)" if HYBRID_AVAILABLE
            else "ML-only verification (add API keys for full grounding)"
        ),
        "features": [
            *([
                "Gemini 2.5 Flash real-time grounding",
                "Google Search citations",
            ] if grounding_available else []),
            *([
                "Google Fact Check Tools API",
            ] if factcheck_available else []),
            "Machine Learning classification",
            "Rule-based red flag detection",
            *([
                "Wikipedia verification",
                "DuckDuckGo news search",
                "Fact-checker database search"
            ] if HYBRID_AVAILABLE else []),
        ],
        "requires_api": not grounding_available,
        "cost": "Free (within Gemini daily limits)" if grounding_available else "Free"
    }


# =============================================================================
# LIVE FEED ENDPOINT (Firestore)
# =============================================================================

@app.get("/live-feed")
def live_feed(limit: int = 50):
    """Return the most recent verified articles (Firestore or local cache)."""
    limit = max(1, min(limit, 200))

    if firestore_service:
        try:
            return {
                "articles": firestore_service.get_live_feed(limit=limit),
                "source": "firestore",
            }
        except Exception as e:
            logger.error(f"Live feed failed: {e}")

    # Fallback: in-memory feed (works without Firestore)
    return {
        "articles": list(LOCAL_FEED)[:limit],
        "source": "memory",
    }