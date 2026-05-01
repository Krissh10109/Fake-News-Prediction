"""
Claude API Client for News Verification
========================================
Handles communication with Anthropic's Claude API for deep verification.
"""

import os
import json
import logging
from typing import Optional

# Try to import anthropic, handle if not installed
try:
    import anthropic
    ANTHROPIC_AVAILABLE = True
except ImportError:
    ANTHROPIC_AVAILABLE = False

# Try to import verification prompt
try:
    from Backend.verification_prompt import VERIFICATION_SYSTEM_PROMPT
except ImportError:
    try:
        from verification_prompt import VERIFICATION_SYSTEM_PROMPT
    except ImportError:
        # Fallback: define minimal prompt inline
        VERIFICATION_SYSTEM_PROMPT = "Analyze this news article and return JSON with credibility_score (0-100), recommendation (likely_real/likely_fake/mixed), and evidence_summary."

logger = logging.getLogger(__name__)

# Configuration
CLAUDE_MODEL = "claude-3-5-sonnet-20241022"  # Claude 3.5 Sonnet - fast, capable, cost-effective
MAX_TOKENS = 4096
TIMEOUT_SECONDS = 120


def get_client() -> Optional[anthropic.Anthropic]:
    """
    Get Anthropic client instance.
    
    Returns:
        Anthropic client or None if API key not set
    """
    if not ANTHROPIC_AVAILABLE:
        logger.error("anthropic package not installed. Run: pip install anthropic")
        return None
    
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        logger.warning("ANTHROPIC_API_KEY not set in environment")
        return None
    
    return anthropic.Anthropic(api_key=api_key)


def verify_article(article_text: str, article_url: Optional[str] = None) -> dict:
    """
    Send article to Claude for deep verification analysis.
    
    Args:
        article_text: The news article text to verify
        article_url: Optional URL of the article
        
    Returns:
        dict: Structured verification report or error response
    """
    # Check if anthropic is available
    if not ANTHROPIC_AVAILABLE:
        return {
            "error": True,
            "message": "Anthropic package not installed. Run: pip install anthropic",
            "fallback": True
        }
    
    # Get client
    client = get_client()
    if client is None:
        return {
            "error": True,
            "message": "ANTHROPIC_API_KEY not set. Please set your API key.",
            "fallback": True
        }
    
    # Build user message
    user_message = f"Analyze this news article for credibility:\n\n"
    if article_url:
        user_message += f"URL: {article_url}\n\n"
    user_message += f"ARTICLE:\n{article_text}"
    
    try:
        logger.info(f"Sending article to Claude for verification ({len(article_text)} chars)")
        
        # Make API call
        response = client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=MAX_TOKENS,
            system=VERIFICATION_SYSTEM_PROMPT,
            messages=[
                {"role": "user", "content": user_message}
            ]
        )
        
        # Extract response text
        response_text = response.content[0].text
        logger.info(f"Received response from Claude ({len(response_text)} chars)")
        
        # Parse JSON response
        # Try to extract JSON from response (Claude might wrap it in markdown)
        json_text = response_text.strip()
        
        # Remove markdown code blocks if present
        if json_text.startswith("```json"):
            json_text = json_text[7:]
        if json_text.startswith("```"):
            json_text = json_text[3:]
        if json_text.endswith("```"):
            json_text = json_text[:-3]
        json_text = json_text.strip()
        
        # Parse JSON
        result = json.loads(json_text)
        result["error"] = False
        result["model_used"] = CLAUDE_MODEL
        
        return result
        
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse Claude response as JSON: {e}")
        return {
            "error": True,
            "message": "Failed to parse verification response",
            "raw_response": response_text[:500] if 'response_text' in locals() else None,
            "fallback": True
        }
        
    except anthropic.APIConnectionError as e:
        logger.error(f"API connection error: {e}")
        return {
            "error": True,
            "message": "Failed to connect to Claude API",
            "fallback": True
        }
        
    except anthropic.RateLimitError as e:
        logger.error(f"Rate limit exceeded: {e}")
        return {
            "error": True,
            "message": "API rate limit exceeded. Please try again later.",
            "fallback": True
        }
        
    except anthropic.APIStatusError as e:
        logger.error(f"API error: {e.status_code} - {e.message}")
        return {
            "error": True,
            "message": f"API error: {e.message}",
            "fallback": True
        }
        
    except Exception as e:
        logger.error(f"Unexpected error during verification: {e}")
        return {
            "error": True,
            "message": f"Verification failed: {str(e)}",
            "fallback": True
        }


def get_api_status() -> dict:
    """
    Check if Claude API is configured and accessible.
    
    Returns:
        dict with status information
    """
    if not ANTHROPIC_AVAILABLE:
        return {
            "available": False,
            "reason": "anthropic package not installed"
        }
    
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        return {
            "available": False,
            "reason": "ANTHROPIC_API_KEY not set"
        }
    
    # Check if key looks valid (starts with sk-)
    if not api_key.startswith("sk-"):
        return {
            "available": False,
            "reason": "Invalid API key format"
        }
    
    return {
        "available": True,
        "model": CLAUDE_MODEL,
        "max_tokens": MAX_TOKENS
    }
