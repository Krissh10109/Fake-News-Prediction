"""
Fake News Detection - Inference Module
=======================================
This module handles real-time prediction and explainability.

Key Features:
1. Three-state output: REAL / FAKE / NEEDS VERIFICATION
2. Confidence-based routing for uncertain cases
3. TF-IDF-based explainability (top contributing words)
4. Source credibility heuristics
5. Extreme claim detection (death, war, disaster)

Design Philosophy:
- Keep it simple and explainable
- Avoid overconfidence on extreme claims
- Route uncertain cases to human verification
- Provide transparent reasoning

Author: Design Engineering Project - Semester 5
"""

import os
import json
from functools import lru_cache
from typing import Dict, Tuple, List

import joblib
import numpy as np
from scipy.sparse import csr_matrix, hstack

from preprocess import clean_text

# Import shared constants from config
try:
    from Backend.config import (
        TRUSTED_SOURCES, EXTREME_CLAIM_KEYWORDS,
        CONFIDENCE_THRESHOLD_HIGH, CONFIDENCE_THRESHOLD_LOW
    )
except ImportError:
    from config import (
        TRUSTED_SOURCES, EXTREME_CLAIM_KEYWORDS,
        CONFIDENCE_THRESHOLD_HIGH, CONFIDENCE_THRESHOLD_LOW
    )


# --- Configuration ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "model")


def _expected_metadata_feature_names() -> List[str]:
    # MUST match both train_model.py and extract_metadata_features() ordering
    return [
        "caps_ratio",
        "exclamation_ratio",
        "question_ratio",
        "has_url",
        "trusted_source",
        "length_score",
    ]

# ============================================================
# PIPELINE FROZEN FOR ACADEMIC STABILITY (Dec 2025)
# ============================================================
# Thresholds and constants are now imported from config.py.
# DO NOT adjust without extensive testing and documentation.
# ============================================================


# --- Model Loading ---
@lru_cache(maxsize=1)
def _load_artifacts() -> Dict:
    """
    Load trained model and vectorizer from disk.
    Uses caching to avoid reloading on every request.
    
    Returns:
        Dictionary containing model, vectorizer, and config
    """
    required_files = {
        "model": os.path.join(MODEL_DIR, "lr_model.pkl"),
        "vectorizer": os.path.join(MODEL_DIR, "vectorizer.pkl"),
        "config": os.path.join(MODEL_DIR, "config.json"),
    }
    
    # Check for missing files
    missing = [name for name, path in required_files.items() 
               if not os.path.exists(path)]
    
    if missing:
        raise FileNotFoundError(
            f"Missing model artifacts: {', '.join(missing)}. "
            "Run 'python train_model.py' to train the model first."
        )
    
    # Load artifacts
    artifacts = {
        "model": joblib.load(required_files["model"]),
        "vectorizer": joblib.load(required_files["vectorizer"]),
    }
    
    # Load config
    with open(required_files["config"], 'r') as f:
        artifacts["config"] = json.load(f)

    # --- Consistency checks (training vs inference) ---
    config = artifacts.get("config", {})
    cfg_feature_names = config.get("feature_names")
    expected_feature_names = _expected_metadata_feature_names()
    if cfg_feature_names and cfg_feature_names != expected_feature_names:
        raise RuntimeError(
            "Metadata feature ordering mismatch between training and inference. "
            f"config.json has {cfg_feature_names}, expected {expected_feature_names}."
        )

    # Validate TF-IDF dimension matches saved vocab size (if present)
    tfidf_vocab_size = config.get("tfidf_vocab_size")
    if isinstance(tfidf_vocab_size, int):
        actual_vocab_size = len(artifacts["vectorizer"].vocabulary_)
        if actual_vocab_size != tfidf_vocab_size:
            raise RuntimeError(
                "Vectorizer vocabulary size mismatch. "
                f"config.json={tfidf_vocab_size}, actual={actual_vocab_size}."
            )
    
    return artifacts


# --- Feature Engineering (MUST MATCH TRAINING) ---
def extract_metadata_features(text: str) -> Dict[str, float]:
    """
    Extract metadata features (same as training).
    This function MUST match the one in train_model.py exactly.
    
    Args:
        text: Original raw text
        
    Returns:
        Dictionary of metadata features
    """
    text_lower = text.lower()
    text_len = len(text)
    word_count = len(text.split())
    
    caps_ratio = sum(1 for c in text if c.isupper()) / max(text_len, 1)
    exclamation_ratio = text.count("!") / max(word_count, 1)
    question_ratio = text.count("?") / max(word_count, 1)
    has_url = 1.0 if ("http" in text_lower or "www." in text_lower) else 0.0
    trusted_source = 1.0 if any(src in text_lower for src in TRUSTED_SOURCES) else 0.0
    length_score = min(word_count / 50.0, 1.0)
    
    return {
        "caps_ratio": float(caps_ratio),
        "exclamation_ratio": float(exclamation_ratio),
        "question_ratio": float(question_ratio),
        "has_url": has_url,
        "trusted_source": trusted_source,
        "length_score": length_score,
    }


def build_feature_vector(text: str) -> csr_matrix:
    """
    Build combined feature vector for inference.
    Uses same preprocessing and feature engineering as training.
    
    Args:
        text: Raw input text
        
    Returns:
        Sparse feature matrix ready for model prediction
    """
    artifacts = _load_artifacts()
    
    # Step 1: Clean text (same as training)
    cleaned = clean_text(text)
    
    # Step 2: TF-IDF features
    tfidf_features = artifacts["vectorizer"].transform([cleaned])
    
    # Step 3: Metadata features
    metadata = extract_metadata_features(text)

    # Ensure metadata key order matches training
    expected_keys = _expected_metadata_feature_names()
    if list(metadata.keys()) != expected_keys:
        raise RuntimeError(
            "Metadata feature dict key order changed. "
            f"got={list(metadata.keys())}, expected={expected_keys}."
        )
    metadata_array = np.array([[
        metadata["caps_ratio"],
        metadata["exclamation_ratio"],
        metadata["question_ratio"],
        metadata["has_url"],
        metadata["trusted_source"],
        metadata["length_score"]
    ]], dtype=np.float32)
    
    metadata_features = csr_matrix(metadata_array)
    
    # Step 4: Combine (same order as training)
    combined = hstack([tfidf_features, metadata_features], format='csr')

    # Basic shape sanity checks
    if combined.shape[1] != tfidf_features.shape[1] + metadata_features.shape[1]:
        raise RuntimeError(
            "Combined feature dimension mismatch. "
            f"combined={combined.shape[1]}, tfidf={tfidf_features.shape[1]}, metadata={metadata_features.shape[1]}"
        )
    
    return combined


# --- Source Credibility Scoring ---
def compute_credibility_score(text: str) -> Tuple[float, str]:
    """
    Simple rule-based credibility scoring.
    This is a heuristic layer, NOT replacing ML prediction.
    
    Scoring factors:
    - Trusted domain reference: +0.3
    - Contains URL: +0.1
    - Excessive caps: -0.2
    - Excessive exclamation: -0.2
    - Very short: -0.1
    
    Args:
        text: Raw input text
        
    Returns:
        Tuple of (credibility_score, explanation)
    """
    text_lower = text.lower()
    score = 0.5  # Neutral baseline
    factors = []
    
    # Positive factors
    if any(src in text_lower for src in TRUSTED_SOURCES):
        score += 0.3
        factors.append("references trusted source")
    
    if "http" in text_lower or "www." in text_lower:
        score += 0.1
        factors.append("contains URL")
    
    # Negative factors (sensationalism indicators)
    caps_ratio = sum(1 for c in text if c.isupper()) / max(len(text), 1)
    if caps_ratio > 0.3:
        score -= 0.2
        factors.append("excessive capitalization")
    
    if text.count("!") > 3:
        score -= 0.2
        factors.append("excessive exclamation marks")
    
    if len(text.split()) < 10:
        score -= 0.1
        factors.append("very short text")
    
    # Clamp to [0, 1]
    score = max(0.0, min(1.0, score))
    
    explanation = "; ".join(factors) if factors else "neutral indicators"
    
    return score, explanation


# --- Extreme Claim Detection ---
def detect_extreme_claim(text: str) -> Tuple[bool, List[str]]:
    """
    Detect if text contains extreme claims that need extra caution.
    
    Extreme claims include:
    - Death/assassination
    - Arrest/imprisonment
    - War/attack
    - Disaster/pandemic
    
    Args:
        text: Input text
        
    Returns:
        Tuple of (is_extreme, matched_keywords)
    """
    text_lower = text.lower()
    matched = []
    
    for keyword in EXTREME_CLAIM_KEYWORDS:
        if keyword in text_lower:
            matched.append(keyword)
    
    return len(matched) > 0, matched


# --- Explainability ---
def extract_top_features(text: str, prediction: int, top_n: int = 5) -> List[str]:
    """
    Extract top TF-IDF features that influenced the prediction.
    
    For Logistic Regression:
    - Positive coefficients push toward class 1 (REAL)
    - Negative coefficients push toward class 0 (FAKE)
    
    Args:
        text: Cleaned text
        prediction: Model prediction (0 or 1)
        top_n: Number of top features to return
        
    Returns:
        List of top contributing words/phrases
    """
    try:
        artifacts = _load_artifacts()
        model = artifacts["model"]
        vectorizer = artifacts["vectorizer"]
        
        # Get model coefficients
        # CalibratedClassifierCV wraps the base estimator
        if hasattr(model, 'calibrated_classifiers_'):
            # Get first calibrated classifier
            base_model = model.calibrated_classifiers_[0].estimator
            coef = base_model.coef_[0]
        else:
            return []
        
        # Get feature names
        feature_names = vectorizer.get_feature_names_out()
        
        # Get TF-IDF features for this text
        cleaned = clean_text(text)
        tfidf_vector = vectorizer.transform([cleaned])
        
        # Get non-zero features (words present in this text)
        nonzero_indices = tfidf_vector.nonzero()[1]
        
        # Get coefficients for these features
        feature_scores = []
        for idx in nonzero_indices:
            if idx < len(feature_names):  # Ensure we're in TF-IDF range
                word = feature_names[idx]
                weight = coef[idx]
                tfidf_score = tfidf_vector[0, idx]
                combined_score = weight * tfidf_score
                feature_scores.append((word, combined_score))
        
        # Sort by absolute contribution
        feature_scores.sort(key=lambda x: abs(x[1]), reverse=True)
        
        # Return top features
        top_features = [word for word, score in feature_scores[:top_n]]
        
        return top_features
    
    except Exception as e:
        print(f"Explainability extraction failed: {e}")
        return []


# --- Main Prediction Function ---
def predict_news(text: str) -> Dict:
    """
    Main prediction function with three-state output and explainability.
    
    ============================================================
    ACADEMIC LIMITATIONS & DESIGN PHILOSOPHY
    ============================================================
    This system is a PATTERN-BASED CREDIBILITY ESTIMATOR, not a fact-checker.
    
    What it DOES:
    - Analyzes linguistic patterns, writing style, and structure
    - Detects sensationalism, clickbait, and misleading language
    - Provides transparency through explainable features
    - Routes uncertain/extreme cases to human verification
    
    What it DOES NOT do:
    - Verify factual accuracy of claims
    - Access real-time fact-checking databases
    - Understand context, sarcasm, or satire
    - Replace human judgment and critical thinking
    
    DATASET BIAS:
    - Trained on historical news from specific time period
    - May not generalize to all news domains equally
    - Performance varies across topics and writing styles
    
    ETHICAL DESIGN:
    - Three-state output acknowledges uncertainty
    - Extreme claims trigger mandatory verification
    - Confidence penalties prevent overconfidence
    - Explainability promotes user understanding
    
    FOR VIVA DEFENSE:
    "This is a supervised learning classifier trained on labeled data.
    It estimates credibility based on learned patterns, similar to
    spam detection. It does NOT fact-check claims or access external
    knowledge. The NEEDS VERIFICATION state is a critical feature that
    acknowledges the limits of pattern-based AI in journalism."
    ============================================================
    
    Output States:
    1. REAL: High confidence the news follows authentic journalism patterns
    2. FAKE: High confidence the news exhibits misleading/clickbait patterns
    3. NEEDS VERIFICATION: Low confidence, extreme claim, or ethical routing
    
    Args:
        text: Raw news text to analyze
        
    Returns:
        Dictionary containing:
        - label: REAL / FAKE / NEEDS VERIFICATION
        - confidence: Adjusted confidence score (0-1)
        - ml_prediction: Raw ML prediction (0 or 1)
        - credibility_score: Source credibility heuristic
        - explanation: Human-readable reasoning
        - top_features: Key words that influenced prediction
        - is_extreme_claim: Whether text contains extreme keywords
        - extreme_keywords: List of matched extreme keywords
    """
    # Input validation
    if not text or len(text.strip()) < 5:
        return {
            "label": "NEEDS VERIFICATION",
            "confidence": 0.0,
            "explanation": "Text too short to analyze reliably.",
            "top_features": [],
            "credibility_score": 0.0,
            "is_extreme_claim": False,
        }
    
    # Load model
    artifacts = _load_artifacts()
    model = artifacts["model"]
    
    # Build features
    X = build_feature_vector(text)
    
    # Get ML prediction and probabilities
    ml_prediction = int(model.predict(X)[0])
    ml_probabilities = model.predict_proba(X)[0]
    ml_confidence = float(ml_probabilities[ml_prediction])
    
    # Compute source credibility
    credibility_score, credibility_explanation = compute_credibility_score(text)
    
    # Detect extreme claims
    is_extreme, extreme_keywords = detect_extreme_claim(text)
    
    # Adjust confidence for extreme claims
    # IMPORTANT: This is an INFERENCE-TIME adjustment, not retraining
    # It implements ethical AI principles by reducing overconfidence on sensitive topics
    adjusted_confidence = ml_confidence
    confidence_penalty_applied = False
    
    if is_extreme:
        # Apply confidence penalty for extreme claims
        # Rationale: Pattern-based detection cannot verify factual claims
        adjusted_confidence *= 0.65  # 35% confidence reduction for safety
        confidence_penalty_applied = True
    
    # Extract top features for explainability
    top_features = extract_top_features(text, ml_prediction, top_n=5)
    
    # ============================================================
    # THREE-STATE DECISION LOGIC (FROZEN FOR ACADEMIC STABILITY)
    # ============================================================
    # This logic routes predictions into REAL/FAKE/NEEDS VERIFICATION
    # based on confidence and ethical considerations.
    #
    # NEEDS VERIFICATION exists because:
    # 1. ML models estimate patterns, not factual truth
    # 2. Extreme claims require fact-checking, not pattern matching
    # 3. Low confidence predictions should not mislead users
    # 4. Academic integrity requires acknowledging limitations
    # ============================================================
    
    # Priority 1: Extreme claims with low-to-moderate confidence
    if is_extreme and adjusted_confidence < 0.80:
        label = "NEEDS VERIFICATION"
        explanation = f"Contains extreme claim ({', '.join(extreme_keywords[:2])}). This system cannot verify factual accuracy. Manual fact-checking required."
    
    # Priority 2: Very low confidence (regardless of content)
    elif adjusted_confidence < CONFIDENCE_THRESHOLD_LOW:
        label = "NEEDS VERIFICATION"
        explanation = "Low confidence prediction. Linguistic patterns are unclear. Verify through multiple trusted sources."
    
    # Priority 3: High confidence predictions
    elif adjusted_confidence >= CONFIDENCE_THRESHOLD_HIGH:
        label = "REAL" if ml_prediction == 1 else "FAKE"
        if is_extreme:
            explanation = f"High confidence {label.lower()} news pattern, but contains extreme claim. Always verify breaking news through official sources."
        else:
            explanation = f"High confidence {label.lower()} news based on linguistic and stylistic patterns."
    
    # Priority 4: Medium confidence (borderline cases)
    else:
        # For medium confidence, favor REAL news to avoid false censorship
        # but still indicate uncertainty
        if ml_prediction == 1:  # REAL prediction
            label = "REAL"
            explanation = f"Moderate confidence real news. Linguistic patterns suggest authenticity, but additional fact-checking recommended."
        else:  # FAKE prediction
            # For FAKE, be more cautious - prefer NEEDS VERIFICATION
            if adjusted_confidence > 0.65:
                label = "FAKE"
                explanation = f"Moderate confidence fake news. Sensationalist patterns detected, but verify before dismissing."
            else:
                label = "NEEDS VERIFICATION"
                explanation = "Borderline confidence. Some questionable patterns detected, but not conclusive. Cross-check sources."
    
    # Build response
    response = {
        "label": label,
        "confidence": round(adjusted_confidence, 3),
        "ml_prediction": "REAL" if ml_prediction == 1 else "FAKE",
        "ml_confidence": round(ml_confidence, 3),
        "credibility_score": round(credibility_score, 3),
        "credibility_explanation": credibility_explanation,
        "explanation": explanation,
        "top_features": top_features,
        "is_extreme_claim": is_extreme,
        "extreme_keywords": extreme_keywords[:3] if is_extreme else [],
    }

    return response


# --- Utility Functions ---
def model_metadata() -> Dict:
    """
    Get metadata about loaded model.
    
    Returns:
        Dictionary with model information
    """
    try:
        artifacts = _load_artifacts()
        config = artifacts["config"]
        
        return {
            "model_type": "Logistic Regression (Calibrated)",
            "tfidf_vocab_size": config.get("tfidf_vocab_size", "unknown"),
            "metadata_features": config.get("feature_names", []),
            "confidence_thresholds": {
                "high": CONFIDENCE_THRESHOLD_HIGH,
                "low": CONFIDENCE_THRESHOLD_LOW,
            }
        }
    except Exception as e:
        return {"error": str(e)}
