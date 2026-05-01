"""
Test predictions using the unified model pipeline.
Uses predict_news() from model.py (lr_model + vectorizer + metadata features).
"""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from model import predict_news

print("=" * 60)
print("MODEL VERIFICATION TEST (Unified Pipeline)")
print("=" * 60)
print("Using: lr_model.pkl + vectorizer.pkl + metadata features")
print("=" * 60)

# Test cases
print("\n" + "=" * 60)
print("TEST CASE 1: OBVIOUS FAKE NEWS")
print("=" * 60)
text1 = "BREAKING: Miracle cure for cancer discovered! Doctors hate this one weird trick! Share before its deleted!"
result1 = predict_news(text1)
print(f"Text: {text1[:60]}...")
print(f"Label: {result1['label']}")
print(f"ML Prediction: {result1['ml_prediction']}")
print(f"Confidence: {result1['confidence']*100:.1f}%")
print(f"Top Features: {result1['top_features']}")
print(f"Is Extreme Claim: {result1['is_extreme_claim']}")
print(f"Expected: FAKE or NEEDS VERIFICATION")
is_correct_1 = result1['label'] in ('FAKE', 'NEEDS VERIFICATION')
print(f"Result: {'[CORRECT]' if is_correct_1 else '[INCORRECT]'}")

print("\n" + "=" * 60)
print("TEST CASE 2: OBVIOUS REAL NEWS")
print("=" * 60)
text2 = "The Federal Reserve announced a quarter-point interest rate increase on Wednesday, citing ongoing inflation concerns and strong labor market data."
result2 = predict_news(text2)
print(f"Text: {text2[:60]}...")
print(f"Label: {result2['label']}")
print(f"ML Prediction: {result2['ml_prediction']}")
print(f"Confidence: {result2['confidence']*100:.1f}%")
print(f"Top Features: {result2['top_features']}")
print(f"Expected: REAL")
is_correct_2 = result2['label'] == 'REAL'
print(f"Result: {'[CORRECT]' if is_correct_2 else '[INCORRECT]'}")

print("\n" + "=" * 60)
print("TEST CASE 3: BORDERLINE CASE")
print("=" * 60)
text3 = "Scientists have discovered a new treatment that shows promise in early trials. More research is needed to confirm the results."
result3 = predict_news(text3)
print(f"Text: {text3[:60]}...")
print(f"Label: {result3['label']}")
print(f"ML Prediction: {result3['ml_prediction']}")
print(f"Confidence: {result3['confidence']*100:.1f}%")
print(f"Top Features: {result3['top_features']}")
print(f"Expected: REAL or NEEDS VERIFICATION (borderline)")
print(f"Note: Borderline case - any reasonable prediction is acceptable")

print("\n" + "=" * 60)
print("VERIFICATION COMPLETE")
print("=" * 60)
