"""
Text Preprocessing Module
--------------------------
Clean text while preserving named entities and phrase structure.
Used consistently in both training and inference pipelines.
"""

import re
import string


def clean_text(text: str) -> str:
    """
    Clean text for TF-IDF processing while preserving meaning.
    
    Removes:
    - URLs and links
    - HTML tags
    - Special characters (emojis, symbols)
    - Excessive whitespace
    
    Preserves:
    - Named entities (proper nouns like "Donald Trump")
    - Phrase structure (doesn't remove all punctuation)
    - Numbers in context (e.g., "COVID-19")
    
    Args:
        text: Raw input text
        
    Returns:
        Cleaned text ready for vectorization
    """
    # Remove URLs (they don't help with content authenticity)
    text = re.sub(r'https?://\S+|www\.\S+', ' ', text)
    
    # Remove HTML tags
    text = re.sub(r'<.*?>', ' ', text)
    
    # Remove brackets and their content (often metadata)
    text = re.sub(r'\[.*?\]', ' ', text)
    
    # Remove special characters but keep basic punctuation for phrase structure
    # Keep: period, comma, apostrophe, hyphen for readability
    text = re.sub(r'[^\w\s.,\'-]', ' ', text)
    
    # Normalize whitespace (including newlines, tabs)
    text = re.sub(r'\s+', ' ', text)
    
    # Convert to lowercase for consistency (TF-IDF will handle this)
    text = text.lower().strip()
    
    return text
