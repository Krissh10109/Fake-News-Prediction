"""
Diagnostic script to identify ML pipeline issues
"""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import pandas as pd
import numpy as np

print("=" * 60)
print("ML PIPELINE DIAGNOSTIC REPORT")
print("=" * 60)

# 1. Dataset Analysis
print("\n1. DATASET ANALYSIS")
print("-" * 40)

fake = pd.read_csv("data/Fake.csv")
real = pd.read_csv("data/True.csv")

print(f"Fake.csv: {len(fake)} rows")
print(f"True.csv: {len(real)} rows")
print(f"Class balance ratio: {len(fake)/len(real):.2f}:1")

# Subject column analysis - KEY DATA LEAKAGE CHECK
print(f"\nFake subjects: {list(fake['subject'].unique())}")
print(f"Real subjects: {list(real['subject'].unique())}")

# Check if subjects are disjoint (DATA LEAKAGE!)
fake_subjects = set(fake['subject'].unique())
real_subjects = set(real['subject'].unique())
overlap = fake_subjects.intersection(real_subjects)
print(f"\n⚠️  Subject overlap: {overlap if overlap else 'NONE - POTENTIAL LEAKAGE!'}")

# Missing values
print(f"\nMissing values:")
print(f"  Fake: title={fake['title'].isna().sum()}, text={fake['text'].isna().sum()}")
print(f"  Real: title={real['title'].isna().sum()}, text={real['text'].isna().sum()}")

# 2. Model Testing
print("\n2. MODEL PREDICTION TEST")
print("-" * 40)

try:
    from model import predict_news
    
    test_cases = [
        ("OBVIOUS FAKE: Miracle cure! Doctors hate this!", "FAKE"),
        ("OBVIOUS REAL: Reuters reports quarterly earnings", "REAL"),
        ("TRUMP: Donald Trump announced new policy today", "??"),
        ("SHOCK: Celebrity reveals shocking secret!", "FAKE"),
        ("NEUTRAL: The weather forecast predicts rain", "??"),
    ]
    
    correct = 0
    total = 0
    for text, expected in test_cases:
        result = predict_news(text)
        match = "✓" if expected == "??" or result["label"] == expected else "✗"
        if expected != "??":
            total += 1
            if result["label"] == expected:
                correct += 1
        print(f"  {match} '{text[:40]}...'")
        print(f"      Predicted: {result['label']} ({result['confidence']:.2f})")
        print(f"      Expected:  {expected}")
        print(f"      Top features: {result['top_features'][:3]}")
        
    if total > 0:
        print(f"\nTest accuracy: {correct}/{total} ({100*correct/total:.0f}%)")
        
except Exception as e:
    print(f"Model error: {e}")

# 3. TF-IDF Configuration Check  
print("\n3. TF-IDF CONFIGURATION")
print("-" * 40)

try:
    import joblib
    vectorizer = joblib.load("model/vectorizer.pkl")
    print(f"Vocabulary size: {len(vectorizer.vocabulary_)}")
    print(f"ngram_range: {vectorizer.ngram_range}")
    print(f"min_df: {vectorizer.min_df}")
    print(f"max_df: {vectorizer.max_df}")
    print(f"max_features: {vectorizer.max_features}")
    print(f"stop_words: {vectorizer.stop_words}")
    
    # Check for subject-specific words in vocabulary
    subject_words = ['politicsnews', 'worldnews', 'politics', 'left-news', 'government news']
    leaky_words = [w for w in subject_words if w in vectorizer.vocabulary_]
    if leaky_words:
        print(f"\n⚠️  LEAKY WORDS IN VOCABULARY: {leaky_words}")
    else:
        print(f"\nNo obvious leaky subject words found")
        
except Exception as e:
    print(f"Vectorizer error: {e}")

# 4. Preprocessing Check
print("\n4. PREPROCESSING VERIFICATION")
print("-" * 40)

from preprocess import clean_text

test_texts = [
    "BREAKING NEWS: Trump says something! READ MORE at http://fake.com",
    "According to BBC News (reuters.com), the economy grew 3%",
]

for t in test_texts:
    cleaned = clean_text(t)
    print(f"Original: {t[:50]}...")
    print(f"Cleaned:  {cleaned[:50]}...")
    print()

print("\n" + "=" * 60)
print("DIAGNOSTIC COMPLETE")
print("=" * 60)
