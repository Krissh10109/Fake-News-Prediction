"""
Fake News Detection - Training Pipeline (FIXED)
================================================
Clean implementation for 3rd-year Computer Engineering project.

Fixes Applied:
1. Uses ONLY text content (no subject/title leakage)
2. Proper stopword removal with NLTK
3. TF-IDF fitted only on training data
4. Simple Logistic Regression (interpretable)
5. Clear accuracy metrics and confusion matrix

Author: Design Engineering Project - Semester 5
"""

import os
import re
import json
import joblib
import pandas as pd
import numpy as np

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score, 
    classification_report, 
    confusion_matrix,
    precision_score,
    recall_score
)

# --- Configuration ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
MODEL_DIR = os.path.join(BASE_DIR, "model")
os.makedirs(MODEL_DIR, exist_ok=True)

# English stopwords (common words that don't add meaning)
STOPWORDS = {
    'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 
    'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself',
    'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them',
    'their', 'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'this',
    'that', 'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been',
    'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing',
    'a', 'an', 'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until',
    'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between',
    'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to',
    'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again',
    'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how',
    'all', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor',
    'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can',
    'will', 'just', 'don', 'should', 'now', 'd', 'll', 'm', 'o', 're', 've', 'y',
    'ain', 'aren', 'couldn', 'didn', 'doesn', 'hadn', 'hasn', 'haven', 'isn',
    'ma', 'mightn', 'mustn', 'needn', 'shan', 'shouldn', 'wasn', 'weren',
    'won', 'wouldn', 'said', 'says', 'would', 'could', 'also', 'one', 'two'
}


def clean_text(text: str) -> str:
    """
    Preprocess text for TF-IDF vectorization.
    
    Steps:
    1. Lowercase
    2. Remove URLs
    3. Remove punctuation and numbers
    4. Remove stopwords
    5. Normalize whitespace
    
    Args:
        text: Raw input text
        
    Returns:
        Cleaned text ready for vectorization
    """
    if not isinstance(text, str):
        return ""
    
    # Lowercase
    text = text.lower()
    
    # Remove URLs
    text = re.sub(r'https?://\S+|www\.\S+', ' ', text)
    
    # Remove HTML tags
    text = re.sub(r'<.*?>', ' ', text)
    
    # Remove punctuation and numbers (keep only letters and spaces)
    text = re.sub(r'[^a-z\s]', ' ', text)
    
    # Remove stopwords
    words = text.split()
    words = [w for w in words if w not in STOPWORDS and len(w) > 2]
    
    # Join and normalize whitespace
    text = ' '.join(words)
    text = re.sub(r'\s+', ' ', text).strip()
    
    return text


def load_data():
    """
    Load Fake and Real news datasets.
    
    IMPORTANT: Uses ONLY the 'text' column to avoid data leakage.
    The 'subject' and 'title' columns are intentionally excluded.
    
    Returns:
        DataFrame with 'text' and 'label' columns
    """
    print("=" * 60)
    print("LOADING DATASETS")
    print("=" * 60)
    
    # Load CSV files
    fake_path = os.path.join(DATA_DIR, "Fake.csv")
    real_path = os.path.join(DATA_DIR, "True.csv")
    
    fake = pd.read_csv(fake_path)
    real = pd.read_csv(real_path)
    
    print(f"Fake.csv: {len(fake)} articles")
    print(f"True.csv: {len(real)} articles")
    
    # Assign labels: 0 = Fake, 1 = Real
    fake['label'] = 0
    real['label'] = 1
    
    # ⚠️ CRITICAL: Use ONLY 'text' column (NOT subject or title)
    # This prevents data leakage from subject column patterns
    fake_clean = fake[['text', 'label']].copy()
    real_clean = real[['text', 'label']].copy()
    
    # Combine datasets
    df = pd.concat([fake_clean, real_clean], ignore_index=True)
    
    # Shuffle dataset
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)
    
    # Remove missing values
    df = df.dropna(subset=['text'])
    
    # Remove very short texts (less than 50 characters)
    df = df[df['text'].str.len() >= 50]
    
    # Remove duplicates
    df = df.drop_duplicates(subset=['text'])
    
    print(f"\nAfter cleaning: {len(df)} articles")
    print(f"  - Fake: {(df['label'] == 0).sum()}")
    print(f"  - Real: {(df['label'] == 1).sum()}")
    
    return df


def train_model():
    """
    Main training function.
    
    Pipeline:
    1. Load data
    2. Preprocess text
    3. Split into train/test (80/20)
    4. TF-IDF vectorization (fit on train only)
    5. Train Logistic Regression
    6. Evaluate and print metrics
    7. Save model and vectorizer
    """
    print("\n" + "=" * 60)
    print("FAKE NEWS DETECTION - MODEL TRAINING")
    print("=" * 60)
    
    # Step 1: Load data
    df = load_data()
    
    # Step 2: Preprocess text
    print("\n" + "=" * 60)
    print("PREPROCESSING TEXT")
    print("=" * 60)
    print("Cleaning text (lowercase, remove punctuation, stopwords)...")
    
    df['clean_text'] = df['text'].apply(clean_text)
    
    # Remove empty texts after cleaning
    df = df[df['clean_text'].str.len() > 10]
    print(f"After preprocessing: {len(df)} articles")
    
    # Step 3: Train/Test Split (80/20)
    print("\n" + "=" * 60)
    print("SPLITTING DATA")
    print("=" * 60)
    
    X = df['clean_text']
    y = df['label']
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=0.2,
        random_state=42,
        stratify=y  # Maintain class balance
    )
    
    print(f"Training set: {len(X_train)} samples")
    print(f"Test set: {len(X_test)} samples")
    print(f"Train class distribution: Fake={sum(y_train==0)}, Real={sum(y_train==1)}")
    
    # Step 4: TF-IDF Vectorization
    print("\n" + "=" * 60)
    print("TF-IDF VECTORIZATION")
    print("=" * 60)
    
    tfidf = TfidfVectorizer(
        max_df=0.7,           # Ignore terms in >70% of documents
        min_df=5,             # Ignore terms in <5 documents
        max_features=15000,   # Top 15,000 features
        ngram_range=(1, 2),   # Unigrams and bigrams
        lowercase=True,       # Already lowercased, but be safe
    )
    
    # ⚠️ CRITICAL: Fit ONLY on training data (prevents test leakage)
    X_train_tfidf = tfidf.fit_transform(X_train)
    X_test_tfidf = tfidf.transform(X_test)
    
    print(f"Vocabulary size: {len(tfidf.vocabulary_)}")
    print(f"Feature matrix shape: {X_train_tfidf.shape}")
    
    # Step 5: Train Logistic Regression
    print("\n" + "=" * 60)
    print("TRAINING MODEL")
    print("=" * 60)
    
    model = LogisticRegression(
        max_iter=1000,
        class_weight='balanced',  # Handle class imbalance
        random_state=42,
        solver='lbfgs',
        C=1.0,
    )
    
    print("Training Logistic Regression classifier...")
    model.fit(X_train_tfidf, y_train)
    print("Training complete!")
    
    # Step 6: Evaluate Model
    print("\n" + "=" * 60)
    print("MODEL EVALUATION")
    print("=" * 60)
    
    # Predictions
    y_pred = model.predict(X_test_tfidf)
    y_proba = model.predict_proba(X_test_tfidf)
    
    # Metrics
    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred)
    recall = recall_score(y_test, y_pred)
    
    print(f"\n✅ ACCURACY: {accuracy:.4f} ({accuracy*100:.2f}%)")
    print(f"✅ PRECISION: {precision:.4f}")
    print(f"✅ RECALL: {recall:.4f}")
    
    # Confusion Matrix
    print("\n📊 CONFUSION MATRIX:")
    cm = confusion_matrix(y_test, y_pred)
    print(f"                 Predicted")
    print(f"                 FAKE    REAL")
    print(f"Actual FAKE     {cm[0,0]:5d}   {cm[0,1]:5d}")
    print(f"Actual REAL     {cm[1,0]:5d}   {cm[1,1]:5d}")
    print(f"\nTrue Negatives (TN): {cm[0,0]} - Correctly identified FAKE")
    print(f"False Positives (FP): {cm[0,1]} - FAKE predicted as REAL")
    print(f"False Negatives (FN): {cm[1,0]} - REAL predicted as FAKE")
    print(f"True Positives (TP): {cm[1,1]} - Correctly identified REAL")
    
    # Classification Report
    print("\n📋 CLASSIFICATION REPORT:")
    print(classification_report(y_test, y_pred, target_names=['FAKE', 'REAL']))
    
    # Step 7: Save Model and Vectorizer
    print("\n" + "=" * 60)
    print("SAVING MODEL ARTIFACTS")
    print("=" * 60)
    
    model_path = os.path.join(MODEL_DIR, "model.pkl")
    tfidf_path = os.path.join(MODEL_DIR, "tfidf.pkl")
    config_path = os.path.join(MODEL_DIR, "config.json")
    
    # Save model
    joblib.dump(model, model_path)
    print(f"✅ Model saved: {model_path}")
    
    # Save vectorizer
    joblib.dump(tfidf, tfidf_path)
    print(f"✅ Vectorizer saved: {tfidf_path}")
    
    # Save configuration
    config = {
        "accuracy": float(accuracy),
        "precision": float(precision),
        "recall": float(recall),
        "vocabulary_size": len(tfidf.vocabulary_),
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "model_type": "LogisticRegression",
        "tfidf_config": {
            "max_df": 0.7,
            "min_df": 5,
            "max_features": 15000,
            "ngram_range": [1, 2]
        }
    }
    
    with open(config_path, 'w') as f:
        json.dump(config, f, indent=2)
    print(f"✅ Config saved: {config_path}")
    
    print("\n" + "=" * 60)
    print("TRAINING COMPLETE!")
    print("=" * 60)
    
    return accuracy


if __name__ == "__main__":
    train_model()
