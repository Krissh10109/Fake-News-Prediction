"""
Google Gemini API Client for News Verification
Free alternative to Claude API
"""

import os
import json
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

# Try to import Google Generative AI
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False


class GeminiClient:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables")
        
        genai.configure(api_key=api_key)
        
        # Use Gemini 2.0 Flash Lite (available in current API)
        self.model = genai.GenerativeModel('models/gemini-2.0-flash-lite')
        
    def verify_article(self, article_text: str, article_url: str = None) -> Dict[str, Any]:
        """
        Verify news article using Gemini AI
        """
        system_prompt = self._get_verification_prompt()
        
        user_message = f"""
Article to verify:
{article_text}

{f'Source URL: {article_url}' if article_url else ''}

Please analyze this article and return a JSON response following the structure specified.
"""
        
        try:
            logger.info(f"Sending article to Gemini for verification ({len(article_text)} chars)")
            
            response = self.model.generate_content(
                [system_prompt, user_message],
                generation_config=genai.types.GenerationConfig(
                    temperature=0.3,
                    max_output_tokens=4000,
                )
            )
            
            result = self._parse_response(response.text)
            result["model_used"] = "gemini-2.0-flash-lite"
            logger.info(f"Gemini verification complete. Score: {result.get('overall_assessment', {}).get('credibility_score', 'N/A')}")
            return result
            
        except Exception as e:
            logger.error(f"Gemini API Error: {str(e)}")
            return self._get_error_response(str(e))
    
    def _get_verification_prompt(self) -> str:
        """Returns the comprehensive verification prompt"""
        return """You are a multi-source news verification agent. Analyze news articles for credibility.

ANALYSIS FRAMEWORK:

1. CLAIM EXTRACTION - Identify factual claims (dates, names, events, statistics)
2. CREDIBILITY ASSESSMENT - Check source reliability, contradictions, evidence
3. RED FLAG DETECTION - Sensational headlines, lack of sources, emotional manipulation
4. LINGUISTIC ANALYSIS - Writing quality, clickbait patterns, professionalism

OUTPUT FORMAT (strict JSON):
{
  "overall_assessment": {
    "credibility_score": 0-100,
    "recommendation": "likely_real" | "likely_fake" | "mixed" | "unverifiable",
    "confidence_level": "high" | "moderate" | "low"
  },
  "claims_analysis": [
    {
      "claim": "string",
      "claim_type": "factual" | "statistical" | "quote" | "event",
      "verification_status": "plausible" | "questionable" | "unverifiable",
      "confidence_score": 0-100,
      "reasoning": "explanation"
    }
  ],
  "red_flags": [
    {
      "type": "content" | "source" | "linguistic",
      "severity": "critical" | "high" | "moderate" | "low",
      "description": "string",
      "evidence": "string"
    }
  ],
  "linguistic_analysis": {
    "emotional_manipulation_score": 0-10,
    "clickbait_indicators": 0-10,
    "source_citation_quality": 0-10,
    "writing_professionalism": 0-10,
    "headline_body_consistency": 0-10
  },
  "evidence_summary": "2-3 paragraph explanation"
}

IMPORTANT: Return ONLY valid JSON, no additional text."""

    def _parse_response(self, response_text: str) -> Dict[str, Any]:
        """Parse JSON from Gemini response"""
        try:
            text = response_text.strip()
            if text.startswith("```json"):
                text = text[7:]
            if text.startswith("```"):
                text = text[3:]
            if text.endswith("```"):
                text = text[:-3]
            text = text.strip()
            
            result = json.loads(text)
            
            if "overall_assessment" not in result:
                return self._get_fallback_response(response_text)
            
            result["error"] = False
            return result
            
        except json.JSONDecodeError as e:
            logger.error(f"JSON Parse Error: {e}")
            return self._get_fallback_response(response_text)
    
    def _get_fallback_response(self, raw_text: str) -> Dict[str, Any]:
        """Generate fallback response when JSON parsing fails"""
        return {
            "error": False,
            "overall_assessment": {
                "credibility_score": 50,
                "recommendation": "unverifiable",
                "confidence_level": "low"
            },
            "claims_analysis": [],
            "red_flags": [
                {
                    "type": "source",
                    "severity": "moderate",
                    "description": "Analysis incomplete",
                    "evidence": "System returned unstructured data"
                }
            ],
            "linguistic_analysis": {
                "emotional_manipulation_score": 5,
                "clickbait_indicators": 5,
                "source_citation_quality": 5,
                "writing_professionalism": 5,
                "headline_body_consistency": 5
            },
            "evidence_summary": f"Analysis returned unstructured response: {raw_text[:300]}..."
        }
    
    def _get_error_response(self, error_message: str) -> Dict[str, Any]:
        """Generate error response"""
        return {
            "error": True,
            "message": error_message,
            "fallback": True,
            "overall_assessment": {
                "credibility_score": 0,
                "recommendation": "unverifiable",
                "confidence_level": "low"
            },
            "claims_analysis": [],
            "red_flags": [],
            "linguistic_analysis": {
                "emotional_manipulation_score": 0,
                "clickbait_indicators": 0,
                "source_citation_quality": 0,
                "writing_professionalism": 0,
                "headline_body_consistency": 0
            },
            "evidence_summary": f"Verification failed: {error_message}"
        }


def verify_with_gemini(article_text: str, article_url: str = None) -> Dict[str, Any]:
    """Quick verification function"""
    if not GEMINI_AVAILABLE:
        return {
            "error": True,
            "message": "google-generativeai package not installed",
            "fallback": True
        }
    
    try:
        client = GeminiClient()
        return client.verify_article(article_text, article_url)
    except ValueError as e:
        return {
            "error": True,
            "message": str(e),
            "fallback": True
        }


def get_gemini_status() -> Dict[str, Any]:
    """Check if Gemini API is configured"""
    if not GEMINI_AVAILABLE:
        return {
            "available": False,
            "reason": "google-generativeai package not installed"
        }
    
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return {
            "available": False,
            "reason": "GEMINI_API_KEY not set"
        }
    
    return {
        "available": True,
        "model": "gemini-2.0-flash-lite",
        "tier": "free"
    }
