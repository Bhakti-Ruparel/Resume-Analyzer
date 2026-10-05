"""
preprocessor.py — Text cleaning pipeline used identically by train.py and main.py.
Importable standalone with no side effects.
"""

import re
import string


def clean_text(text: str) -> str:
    """
    Clean raw resume text:
    - Lowercase
    - Remove URLs
    - Remove email addresses
    - Remove HTML tags
    - Remove special characters and punctuation
    - Normalize whitespace
    """
    if not isinstance(text, str):
        text = str(text)

    # Lowercase
    text = text.lower()

    # Remove URLs
    text = re.sub(r'https?://\S+|www\.\S+', ' ', text)

    # Remove email addresses
    text = re.sub(r'\S+@\S+', ' ', text)

    # Remove HTML tags
    text = re.sub(r'<[^>]+>', ' ', text)

    # Remove special characters, keeping only letters, digits, and spaces
    text = re.sub(r'[^a-z0-9\s]', ' ', text)

    # Normalize whitespace (collapse multiple spaces, strip leading/trailing)
    text = re.sub(r'\s+', ' ', text).strip()

    return text


def tokenize(text: str) -> list:
    """
    Tokenize cleaned text by splitting on whitespace.
    Returns a list of token strings.
    """
    cleaned = clean_text(text)
    if not cleaned:
        return []
    return cleaned.split()


def preprocess(text: str) -> str:
    """
    Preprocess text for TF-IDF: clean and return the cleaned string.
    """
    return clean_text(text)
