"""
Demo Test Cases for Fake News Detection System
===============================================
Prepared for academic presentation and viva defense.

These test cases demonstrate:
1. Clear REAL news detection
2. Clear FAKE news detection
3. NEEDS VERIFICATION routing (extreme claims)
4. Explainability features
5. Three-state decision logic

Author: Design Engineering Project - Semester 5
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from model import predict_news
import json


# ============================================================
# DEMO TEST CASES
# ============================================================

DEMO_CASES = [
    {
        "id": 1,
        "category": "CLEAR REAL NEWS",
        "title": "BBC Reports Economic Growth Continues",
        "text": """
        According to BBC News, the latest economic indicators show steady growth 
        in the manufacturing sector during Q4 2024. Government officials stated that 
        employment rates have risen by 2.3% compared to last quarter. Industry experts 
        from major financial institutions predict this trend will continue into early 2025.
        """,
        "expected": "REAL",
        "explanation": "Credible source (BBC), factual tone, specific data, no sensationalism"
    },
    
    {
        "id": 2,
        "category": "CLEAR FAKE NEWS (Clickbait)",
        "title": "SHOCKING: Doctors HATE This One Weird Trick!!!",
        "text": """
        BREAKING NEWS!!! Scientists have discovered an AMAZING cure that doctors 
        don't want you to know about! This miracle solution will change your life 
        FOREVER!!! Click here NOW before big pharma SHUTS IT DOWN!!! You won't 
        BELIEVE what happens next!!!
        """,
        "expected": "FAKE",
        "explanation": "Excessive caps, clickbait language, no credible sources, sensationalism"
    },
    
    {
        "id": 3,
        "category": "EXTREME CLAIM (Death)",
        "title": "Breaking: Famous Celebrity Has Died",
        "text": """
        Reports are emerging that a famous celebrity has died in a tragic accident. 
        Social media is buzzing with unconfirmed reports. No official statement has 
        been released yet. More details to follow.
        """,
        "expected": "NEEDS VERIFICATION",
        "explanation": "Extreme claim (death), unconfirmed reports, requires fact-checking"
    },
    
    {
        "id": 4,
        "category": "EXTREME CLAIM (War)",
        "title": "War Declared Between Two Nations",
        "text": """
        Unverified sources claim that war has been declared between two nations following 
        border tensions. Military officials have not confirmed these reports. The situation 
        remains unclear.
        """,
        "expected": "NEEDS VERIFICATION",
        "explanation": "Extreme claim (war), unverified sources, breaking news nature"
    },
    
    {
        "id": 5,
        "category": "AMBIGUOUS HEADLINE",
        "title": "New Study Shows Surprising Results",
        "text": """
        A recent study published in a scientific journal presents findings that challenge 
        conventional thinking. Researchers analyzed data over several years and found 
        unexpected patterns. The study is undergoing peer review.
        """,
        "expected": "REAL or NEEDS VERIFICATION",
        "explanation": "Legitimate scientific reporting, but vague - could go either way"
    },
    
    {
        "id": 6,
        "category": "REAL NEWS WITH EXTREME TOPIC",
        "title": "Reuters: Armed Conflict Continues in Region",
        "text": """
        Reuters reports that armed conflict continues in the disputed region, according to 
        statements from the United Nations peacekeeping force. International observers 
        documented several incidents this week. The UN Security Council is scheduled to 
        meet tomorrow to discuss humanitarian aid access.
        """,
        "expected": "REAL (but with caution due to extreme topic)",
        "explanation": "Credible source (Reuters, UN), factual reporting, but sensitive topic"
    },
]


# ============================================================
# RUN DEMO CASES
# ============================================================

def run_demo():
    """Run all demo test cases and display results."""
    
    print("=" * 80)
    print("FAKE NEWS DETECTION SYSTEM - DEMO TEST CASES")
    print("=" * 80)
    print()
    print("This demonstration shows:")
    print("  1. REAL news detection with credible sources")
    print("  2. FAKE news detection with clickbait patterns")
    print("  3. NEEDS VERIFICATION routing for extreme claims")
    print("  4. Explainability through top features and credibility scores")
    print()
    print("=" * 80)
    print()
    
    results = []
    
    for case in DEMO_CASES:
        print(f"{'=' * 80}")
        print(f"TEST CASE #{case['id']}: {case['category']}")
        print(f"{'=' * 80}")
        print()
        print(f"Title: {case['title']}")
        print(f"Text: {case['text'].strip()[:200]}...")
        print()
        print(f"Expected: {case['expected']}")
        print(f"Explanation: {case['explanation']}")
        print()
        
        # Run prediction
        full_text = case['title'] + " " + case['text']
        result = predict_news(full_text)
        
        results.append({
            "case_id": case['id'],
            "category": case['category'],
            "title": case['title'],
            "expected": case['expected'],
            "result": result
        })
        
        print(f"{'─' * 80}")
        print("PREDICTION RESULTS:")
        print(f"{'─' * 80}")
        print(f"Label: {result['label']} {'✅' if case['expected'].split()[0] in result['label'] else '⚠️'}")
        print(f"Confidence: {result['confidence']:.1%}")
        print(f"ML Prediction: {result['ml_prediction']} (raw)")
        print(f"ML Confidence: {result['ml_confidence']:.1%} (before adjustment)")
        print()
        print(f"Credibility Score: {result['credibility_score']:.1%}")
        print(f"Credibility Factors: {result.get('credibility_explanation', 'N/A')}")
        print()
        print(f"Extreme Claim Detected: {'Yes ⚠️' if result['is_extreme_claim'] else 'No'}")
        if result['is_extreme_claim']:
            print(f"Extreme Keywords: {', '.join(result['extreme_keywords'])}")
        print()
        print(f"Top Contributing Features: {', '.join(result['top_features'][:5])}")
        print()
        print(f"Explanation: {result['explanation']}")
        print()
        print()
    
    # Summary
    print("=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print()
    print("Test Cases Run: 6")
    print()
    
    verification_count = sum(1 for r in results if r['result']['label'] == 'NEEDS VERIFICATION')
    real_count = sum(1 for r in results if r['result']['label'] == 'REAL')
    fake_count = sum(1 for r in results if r['result']['label'] == 'FAKE')
    
    print(f"REAL predictions: {real_count}")
    print(f"FAKE predictions: {fake_count}")
    print(f"NEEDS VERIFICATION: {verification_count}")
    print()
    
    print("KEY INSIGHTS:")
    print("  • NEEDS VERIFICATION is NOT a model failure - it's an ethical feature")
    print("  • Extreme claims (death, war) require fact-checking, not pattern matching")
    print("  • Credibility scores enhance decision-making transparency")
    print("  • Top features provide explainability for ML predictions")
    print("  • Three-state output acknowledges AI limitations in journalism")
    print()
    print("=" * 80)
    print()
    
    return results


def run_single_case(case_id: int):
    """Run a single demo case by ID."""
    case = next((c for c in DEMO_CASES if c['id'] == case_id), None)
    if not case:
        print(f"Case ID {case_id} not found.")
        return
    
    print(f"\n{'=' * 60}")
    print(f"DEMO CASE #{case_id}: {case['category']}")
    print(f"{'=' * 60}\n")
    
    full_text = case['title'] + " " + case['text']
    result = predict_news(full_text)
    
    print(f"Title: {case['title']}\n")
    print(f"Result: {result['label']} (Confidence: {result['confidence']:.1%})")
    print(f"Extreme Claim: {'Yes' if result['is_extreme_claim'] else 'No'}")
    print(f"Top Features: {', '.join(result['top_features'][:5])}")
    print(f"\nExplanation: {result['explanation']}\n")


# ============================================================
# VIVA DEFENSE TALKING POINTS
# ============================================================

VIVA_TALKING_POINTS = """
============================================================
VIVA DEFENSE - KEY TALKING POINTS
============================================================

1. WHY LOGISTIC REGRESSION?
   - Explainable: Can show exact feature weights
   - Fast: Real-time predictions (<100ms)
   - Proven: Industry standard for text classification
   - Academic: Suitable for 5th semester complexity

2. WHY TF-IDF?
   - Standard for text representation
   - Captures word importance across documents
   - Works well for pattern-based detection
   - Better than simple word counts (BoW)

3. WHY THREE STATES?
   - Acknowledges AI limitations
   - Ethical handling of uncertain cases
   - Prevents overconfidence on extreme claims
   - Encourages critical thinking

4. WHY NEEDS VERIFICATION?
   - Pattern detection ≠ Fact checking
   - Extreme claims require human judgment
   - Low confidence should not mislead users
   - Academic integrity in design

5. DATASET CHOICES:
   - Balanced 50/50 (prevents bias)
   - Cleaned and deduplicated
   - 45,132 articles (sufficient for ML)
   - Mix of GossipCop and PolitiFact data

6. PERFORMANCE METRICS:
   - Accuracy: 91.84% (realistic, not overfit)
   - ROC-AUC: 97.60% (excellent discrimination)
   - F1-Score: 92% (balanced precision/recall)
   - Lower than 98%+ is INTENTIONAL (better generalization)

7. LIMITATIONS (Be Honest!):
   - Cannot verify factual accuracy
   - Trained on historical data (bias)
   - No real-time news database access
   - Pattern-based, not knowledge-based

8. FUTURE IMPROVEMENTS:
   - Add more recent news data
   - Incorporate fact-checking APIs
   - Multi-lingual support
   - Real-time learning updates

9. WHAT MAKES THIS ACADEMIC?
   - Classical ML (not deep learning)
   - Explainable features
   - Documented limitations
   - Ethical design considerations
   - Reproducible pipeline

10. DEMO SCRIPT:
    - Show Case #2 (clear fake) → FAKE detection
    - Show Case #1 (clear real) → REAL detection
    - Show Case #3 (death claim) → NEEDS VERIFICATION
    - Explain WHY verification routing is important
    - Show top features for explainability
============================================================
"""


if __name__ == "__main__":
    print(VIVA_TALKING_POINTS)
    print("\n" * 2)
    
    # Run full demo
    results = run_demo()
    
    print("\n" * 2)
    print("To run a single test case, use:")
    print("  python demo_cases.py [case_id]")
    print("\nExample: python demo_cases.py 3")
