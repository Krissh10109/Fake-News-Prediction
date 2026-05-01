"""
FakeNewsNet Dataset Preparation Script
=======================================
Combines multiple fake news datasets, cleans and balances them for ML training.

Author: Design Engineering Project - Semester 5
Dataset Sources:
- Existing Fake.csv and True.csv
- FakeNewsNet: GossipCop and PolitiFact datasets
"""

import os
import pandas as pd
import numpy as np
from pathlib import Path
import hashlib


def load_existing_data():
    """Load the existing Fake.csv and True.csv datasets."""
    print("\n[1/7] Loading existing datasets...")
    
    data_dir = Path(__file__).parent / "data"
    
    # Load existing datasets
    fake_df = pd.read_csv(data_dir / "Fake.csv")
    true_df = pd.read_csv(data_dir / "True.csv")
    
    # Add label column
    fake_df['label'] = 'fake'
    true_df['label'] = 'real'
    
    # Standardize columns
    fake_df = fake_df[['title', 'text', 'label']]
    true_df = true_df[['title', 'text', 'label']]
    
    print(f"   Loaded {len(fake_df)} fake articles")
    print(f"   Loaded {len(true_df)} real articles")
    
    return pd.concat([fake_df, true_df], ignore_index=True)


def load_fakenewsnet_metadata():
    """
    Load FakeNewsNet CSV files (only metadata).
    These files contain URLs and titles but not full article text.
    We'll extract what we can for additional diversity.
    """
    print("\n[2/7] Loading FakeNewsNet metadata...")
    
    data_dir = Path(__file__).parent / "data"
    datasets = []
    
    files_info = [
        ('gossipcop_fake.csv', 'fake'),
        ('gossipcop_real.csv', 'real'),
        ('politifact_fake.csv', 'fake'),
        ('politifact_real.csv', 'real')
    ]
    
    for filename, label in files_info:
        filepath = data_dir / filename
        if filepath.exists():
            try:
                df = pd.read_csv(filepath)
                if 'title' in df.columns:
                    df = df[['title']].copy()
                    df['label'] = label
                    df['text'] = df['title']  # Use title as text (limited info)
                    datasets.append(df)
                    print(f"   Loaded {len(df)} entries from {filename}")
            except Exception as e:
                print(f"   Warning: Could not load {filename}: {e}")
    
    if datasets:
        return pd.concat(datasets, ignore_index=True)
    else:
        print("   No FakeNewsNet metadata loaded")
        return pd.DataFrame(columns=['title', 'text', 'label'])


def clean_dataset(df):
    """
    Clean the dataset by:
    1. Removing duplicates
    2. Removing extremely short articles
    3. Removing corrupted/empty text
    4. Standardizing text format
    """
    print(f"\n[3/7] Cleaning dataset...")
    print(f"   Initial size: {len(df)} articles")
    
    # Remove rows with missing title or text
    df = df.dropna(subset=['title', 'text'])
    print(f"   After removing NaN: {len(df)} articles")
    
    # Convert to string and strip whitespace
    df['title'] = df['title'].astype(str).str.strip()
    df['text'] = df['text'].astype(str).str.strip()
    
    # Remove empty strings
    df = df[(df['title'] != '') & (df['text'] != '')]
    print(f"   After removing empty: {len(df)} articles")
    
    # Create combined text for duplicate detection
    df['combined'] = df['title'] + ' ' + df['text']
    
    # Remove extremely short articles (less than 50 characters)
    df = df[df['combined'].str.len() >= 50]
    print(f"   After removing too short: {len(df)} articles")
    
    # Remove duplicates based on text similarity (using hash)
    df['text_hash'] = df['combined'].apply(lambda x: hashlib.md5(x.encode()).hexdigest())
    initial_len = len(df)
    df = df.drop_duplicates(subset=['text_hash'], keep='first')
    duplicates_removed = initial_len - len(df)
    print(f"   Removed {duplicates_removed} duplicate articles")
    print(f"   After deduplication: {len(df)} articles")
    
    # Drop temporary columns
    df = df.drop(['combined', 'text_hash'], axis=1)
    
    return df


def balance_dataset(df, strategy='undersample', target_per_class=None):
    """
    Balance the dataset between real and fake classes.
    
    Args:
        df: DataFrame with 'label' column
        strategy: 'undersample' or 'match'
        target_per_class: Optional target count per class
    """
    print(f"\n[4/7] Balancing dataset (strategy: {strategy})...")
    
    # Count current distribution
    label_counts = df['label'].value_counts()
    print(f"   Current distribution:")
    for label, count in label_counts.items():
        print(f"     {label}: {count}")
    
    if strategy == 'undersample':
        # Undersample to match the minority class
        min_count = label_counts.min()
        if target_per_class is not None:
            min_count = min(min_count, target_per_class)
        
        balanced_dfs = []
        for label in df['label'].unique():
            label_df = df[df['label'] == label]
            sampled = label_df.sample(n=min_count, random_state=42)
            balanced_dfs.append(sampled)
        
        df_balanced = pd.concat(balanced_dfs, ignore_index=True)
        
    elif strategy == 'match':
        # Match to specific target per class
        if target_per_class is None:
            target_per_class = 20000  # Default
        
        balanced_dfs = []
        for label in df['label'].unique():
            label_df = df[df['label'] == label]
            if len(label_df) >= target_per_class:
                sampled = label_df.sample(n=target_per_class, random_state=42)
            else:
                sampled = label_df
            balanced_dfs.append(sampled)
        
        df_balanced = pd.concat(balanced_dfs, ignore_index=True)
    
    # Shuffle the balanced dataset
    df_balanced = df_balanced.sample(frac=1, random_state=42).reset_index(drop=True)
    
    # Print final distribution
    final_counts = df_balanced['label'].value_counts()
    print(f"   Balanced distribution:")
    for label, count in final_counts.items():
        print(f"     {label}: {count}")
    
    return df_balanced


def quality_check(df):
    """Perform quality checks on the final dataset."""
    print(f"\n[5/7] Quality checks...")
    
    # Check for nulls
    null_counts = df.isnull().sum()
    print(f"   Null values: {null_counts.sum()}")
    
    # Check text lengths
    df['text_length'] = df['text'].str.len()
    print(f"   Text length stats:")
    print(f"     Min: {df['text_length'].min()}")
    print(f"     Mean: {df['text_length'].mean():.0f}")
    print(f"     Max: {df['text_length'].max()}")
    
    # Check label distribution
    print(f"   Label distribution:")
    print(df['label'].value_counts())
    
    # Sample a few articles
    print(f"\n   Sample fake article:")
    fake_sample = df[df['label'] == 'fake'].iloc[0]
    print(f"     Title: {fake_sample['title'][:100]}...")
    print(f"     Text: {fake_sample['text'][:200]}...")
    
    print(f"\n   Sample real article:")
    real_sample = df[df['label'] == 'real'].iloc[0]
    print(f"     Title: {real_sample['title'][:100]}...")
    print(f"     Text: {real_sample['text'][:200]}...")
    
    df = df.drop('text_length', axis=1)
    
    return df


def save_dataset(df, filename='final_dataset.csv'):
    """Save the final cleaned and balanced dataset."""
    print(f"\n[6/7] Saving dataset...")
    
    data_dir = Path(__file__).parent / "data"
    output_path = data_dir / filename
    
    df.to_csv(output_path, index=False)
    print(f"   Saved {len(df)} articles to {output_path}")
    print(f"   File size: {output_path.stat().st_size / (1024*1024):.2f} MB")
    
    return output_path


def create_train_test_split(df):
    """Create separate train and test CSV files."""
    print(f"\n[7/7] Creating train/test split (80/20)...")
    
    from sklearn.model_selection import train_test_split
    
    train_df, test_df = train_test_split(
        df, 
        test_size=0.2, 
        stratify=df['label'],
        random_state=42
    )
    
    data_dir = Path(__file__).parent / "data"
    
    train_path = data_dir / 'train_dataset.csv'
    test_path = data_dir / 'test_dataset.csv'
    
    train_df.to_csv(train_path, index=False)
    test_df.to_csv(test_path, index=False)
    
    print(f"   Train set: {len(train_df)} articles ({len(train_df[train_df['label']=='fake'])} fake, {len(train_df[train_df['label']=='real'])} real)")
    print(f"   Test set: {len(test_df)} articles ({len(test_df[test_df['label']=='fake'])} fake, {len(test_df[test_df['label']=='real'])} real)")
    
    return train_path, test_path


def main():
    """Main execution pipeline."""
    print("="*60)
    print("FakeNewsNet Dataset Preparation")
    print("="*60)
    
    # Load existing data
    df_existing = load_existing_data()
    
    # Load FakeNewsNet metadata (optional - may have limited text)
    df_fakenewsnet = load_fakenewsnet_metadata()
    
    # Combine all datasets
    if len(df_fakenewsnet) > 0:
        df_combined = pd.concat([df_existing, df_fakenewsnet], ignore_index=True)
        print(f"\n   Combined dataset size: {len(df_combined)}")
    else:
        df_combined = df_existing
        print(f"\n   Using only existing datasets: {len(df_combined)}")
    
    # Clean the dataset
    df_clean = clean_dataset(df_combined)
    
    # Balance the dataset
    # Use undersample strategy to ensure equal classes
    df_balanced = balance_dataset(df_clean, strategy='undersample')
    
    # Quality check
    df_final = quality_check(df_balanced)
    
    # Save final dataset
    output_path = save_dataset(df_final)
    
    # Create train/test split
    train_path, test_path = create_train_test_split(df_final)
    
    print("\n" + "="*60)
    print("✅ Dataset preparation complete!")
    print("="*60)
    print(f"\nOutput files:")
    print(f"  - Final dataset: {output_path}")
    print(f"  - Training set: {train_path}")
    print(f"  - Test set: {test_path}")
    print(f"\nDataset is ready for TF-IDF + Logistic Regression training!")
    print("\nNext step: Run train_model.py to train the model")
    

if __name__ == "__main__":
    main()
