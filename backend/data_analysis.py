"""
data_analysis.py — Loads Resume.csv, performs data quality checks and EDA,
saves results to analysis_cache.json.
"""

import os
import json
import pandas as pd
from collections import Counter

# Path to CSV relative to this file's directory (backend/)
CSV_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'Resume.csv')
OUTPUT_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'analysis_cache.json')


def run_analysis():
    """
    Run full data analysis and save results to analysis_cache.json.
    Returns the analysis dict.
    """
    from preprocessor import preprocess, tokenize

    print("Loading dataset...")
    df = pd.read_csv(CSV_PATH)

    print(f"Dataset loaded: {len(df)} rows, columns: {list(df.columns)}")

    # -----------------------------------------------------------------------
    # DATA QUALITY CHECKS
    # -----------------------------------------------------------------------

    total_rows = len(df)

    # Missing Resume_str (NaN)
    missing_resumes = int(df['Resume_str'].isna().sum())

    # Empty strings (after stripping whitespace)
    empty_resumes = int((df['Resume_str'].fillna('').str.strip() == '').sum())

    # Duplicate rows (all columns)
    duplicate_rows = int(df.duplicated().sum())

    # Duplicate Resume_str texts
    duplicate_texts = int(df['Resume_str'].duplicated().sum())

    # Usable records: drop rows where Resume_str is missing or empty
    df_clean = df.dropna(subset=['Resume_str'])
    df_clean = df_clean[df_clean['Resume_str'].str.strip() != '']
    usable_records = int(len(df_clean))

    print(f"Quality: missing={missing_resumes}, empty={empty_resumes}, "
          f"dup_rows={duplicate_rows}, dup_texts={duplicate_texts}, "
          f"usable={usable_records}")

    # -----------------------------------------------------------------------
    # DATASET STATISTICS
    # -----------------------------------------------------------------------

    class_counts_series = df_clean['Category'].value_counts()
    class_names = sorted(df_clean['Category'].unique().tolist())
    class_counts = {k: int(v) for k, v in class_counts_series.items()}

    num_classes = len(class_names)
    smallest_class = class_counts_series.idxmin()
    largest_class = class_counts_series.idxmax()

    min_count = int(class_counts_series.min())
    max_count = int(class_counts_series.max())
    imbalance_ratio = round(max_count / min_count, 2) if min_count > 0 else 0.0

    # Word and character counts (on raw Resume_str)
    print("Computing word/char statistics...")
    df_clean = df_clean.copy()
    df_clean['word_count'] = df_clean['Resume_str'].apply(lambda x: len(str(x).split()))
    df_clean['char_count'] = df_clean['Resume_str'].apply(lambda x: len(str(x)))

    avg_words = round(df_clean['word_count'].mean(), 1)
    max_words = int(df_clean['word_count'].max())
    avg_chars = round(df_clean['char_count'].mean(), 1)
    max_chars = int(df_clean['char_count'].max())

    print(f"Words: avg={avg_words}, max={max_words}; Chars: avg={avg_chars}, max={max_chars}")
    print(f"Imbalance ratio: {imbalance_ratio}x (smallest={smallest_class}/{min_count}, "
          f"largest={largest_class}/{max_count})")

    # -----------------------------------------------------------------------
    # EDA — per-class word counts and top-20 words
    # -----------------------------------------------------------------------

    print("Running EDA (per-class analysis)...")
    word_count_by_class = {}
    top_words_by_class = {}

    for category in class_names:
        cat_df = df_clean[df_clean['Category'] == category]

        wc = cat_df['word_count']
        word_count_by_class[category] = {
            'min': int(wc.min()),
            'max': int(wc.max()),
            'mean': round(float(wc.mean()), 1),
            'count': int(len(cat_df))
        }

        # Top-20 words after preprocessing
        all_tokens = []
        for text in cat_df['Resume_str']:
            tokens = tokenize(str(text))
            all_tokens.extend(tokens)

        # Filter out very short tokens (stopwords often get removed by clean_text)
        counter = Counter(tok for tok in all_tokens if len(tok) > 2)
        top_20 = [{'word': w, 'count': c} for w, c in counter.most_common(20)]
        top_words_by_class[category] = top_20

        print(f"  {category}: {len(cat_df)} resumes, top word: "
              f"{top_20[0]['word'] if top_20 else 'N/A'}")

    # -----------------------------------------------------------------------
    # PREPROCESSING STEPS EXPLANATION
    # -----------------------------------------------------------------------

    preprocessing_steps = [
        {
            "step": "Lowercase Conversion",
            "reason": "Normalizes text so 'Python' and 'python' are treated as the same token, reducing vocabulary size.",
            "example_before": "Experienced Python Developer",
            "example_after": "experienced python developer"
        },
        {
            "step": "URL Removal",
            "reason": "URLs add noise and no semantic value to the resume content.",
            "example_before": "Portfolio: https://github.com/user/project",
            "example_after": "portfolio"
        },
        {
            "step": "Email Removal",
            "reason": "Email addresses are personal identifiers with no predictive signal for job category.",
            "example_before": "Contact: john.doe@company.com",
            "example_after": "contact"
        },
        {
            "step": "HTML Tag Removal",
            "reason": "Resume_str may contain residual HTML markup. Tags like <br> or <p> carry no semantic meaning.",
            "example_before": "<p>Experienced <b>engineer</b></p>",
            "example_after": "experienced engineer"
        },
        {
            "step": "Special Character Removal",
            "reason": "Punctuation, symbols, and numeric-heavy tokens add noise without contributing to category prediction.",
            "example_before": "Skills: C++, .NET, 5+ years experience!",
            "example_after": "skills c net 5 years experience"
        },
        {
            "step": "Whitespace Normalization",
            "reason": "Multiple spaces, tabs, and newlines are collapsed to a single space for consistent tokenization.",
            "example_before": "Python   Developer\n\nNew York",
            "example_after": "python developer new york"
        }
    ]

    # -----------------------------------------------------------------------
    # ASSEMBLE AND SAVE
    # -----------------------------------------------------------------------

    analysis = {
        "quality": {
            "missing_resumes": missing_resumes,
            "duplicate_rows": duplicate_rows,
            "duplicate_texts": duplicate_texts,
            "empty_resumes": empty_resumes,
            "usable_records": usable_records
        },
        "dataset": {
            "total_rows": total_rows,
            "num_classes": num_classes,
            "class_names": class_names,
            "class_counts": class_counts,
            "avg_words": avg_words,
            "max_words": max_words,
            "avg_chars": avg_chars,
            "max_chars": max_chars,
            "imbalance_ratio": imbalance_ratio,
            "smallest_class": smallest_class,
            "largest_class": largest_class
        },
        "eda": {
            "word_count_by_class": word_count_by_class,
            "top_words_by_class": top_words_by_class
        },
        "preprocessing_steps": preprocessing_steps
    }

    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(analysis, f, indent=2, ensure_ascii=False)

    print(f"\nAnalysis saved to {OUTPUT_PATH}")
    return analysis


if __name__ == '__main__':
    run_analysis()
