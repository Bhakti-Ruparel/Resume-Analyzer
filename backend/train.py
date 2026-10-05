"""
train.py — Standalone training script. Run once to train all 3 models.
Saves artifacts to backend/models/.
"""

import os
import sys
import json
import pickle
import numpy as np
import pandas as pd
from pathlib import Path

# Ensure backend dir is on path so we can import preprocessor
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from preprocessor import preprocess, tokenize

# Paths
CSV_PATH = os.path.join(BACKEND_DIR, '..', 'Resume.csv')
MODELS_DIR = os.path.join(BACKEND_DIR, 'models')

os.makedirs(MODELS_DIR, exist_ok=True)

print("=" * 60)
print("ResumeForge — Model Training Script")
print("=" * 60)

# -----------------------------------------------------------------------
# 1. LOAD AND PREPROCESS DATA
# -----------------------------------------------------------------------

print("\n[1/6] Loading dataset...")
df = pd.read_csv(CSV_PATH)
print(f"  Loaded {len(df)} rows")

# Drop missing/empty Resume_str
df = df.dropna(subset=['Resume_str'])
df = df[df['Resume_str'].str.strip() != '']
print(f"  After cleaning: {len(df)} rows")

print("\n[2/6] Preprocessing text...")
df['processed_text'] = df['Resume_str'].apply(lambda x: preprocess(str(x)))
df = df[df['processed_text'].str.strip() != '']
print(f"  After removing empty preprocessed rows: {len(df)} rows")

# -----------------------------------------------------------------------
# 2. ENCODE LABELS AND SPLIT
# -----------------------------------------------------------------------

from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import f1_score, accuracy_score, classification_report, confusion_matrix

print("\n[3/6] Encoding labels and splitting 80/20 stratified...")
le = LabelEncoder()
y = le.fit_transform(df['Category'])
X = df['processed_text'].values
class_names = list(le.classes_)
print(f"  Classes ({len(class_names)}): {class_names}")

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
print(f"  Train: {len(X_train)}, Test: {len(X_test)}")

# Save label encoder
le_path = os.path.join(MODELS_DIR, 'label_encoder.pkl')
with open(le_path, 'wb') as f:
    pickle.dump(le, f)
print(f"  Saved label_encoder.pkl")

# -----------------------------------------------------------------------
# 3. MODEL A — TF-IDF + Logistic Regression
# -----------------------------------------------------------------------

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.svm import LinearSVC
from sklearn.pipeline import Pipeline

print("\n[4/6] Training Model A: TF-IDF + Logistic Regression...")
lr_pipeline = Pipeline([
    ('tfidf', TfidfVectorizer(
        max_features=50000,
        ngram_range=(1, 2),
        sublinear_tf=True
    )),
    ('clf', LogisticRegression(
        max_iter=1000,
        class_weight='balanced',
        C=5.0,
        solver='lbfgs',
        random_state=42
    ))
])

lr_pipeline.fit(X_train, y_train)
y_pred_lr = lr_pipeline.predict(X_test)

lr_macro_f1 = f1_score(y_test, y_pred_lr, average='macro')
lr_weighted_f1 = f1_score(y_test, y_pred_lr, average='weighted')
lr_accuracy = accuracy_score(y_test, y_pred_lr)
lr_per_class_f1 = dict(zip(
    class_names,
    [round(float(v), 4) for v in f1_score(y_test, y_pred_lr, average=None)]
))
lr_cm = confusion_matrix(y_test, y_pred_lr).tolist()

print(f"  Macro-F1: {lr_macro_f1:.4f}, Accuracy: {lr_accuracy:.4f}")

# Save
lr_path = os.path.join(MODELS_DIR, 'lr_pipeline.pkl')
with open(lr_path, 'wb') as f:
    pickle.dump(lr_pipeline, f)
print(f"  Saved lr_pipeline.pkl")

# -----------------------------------------------------------------------
# 4. MODEL B — TF-IDF + LinearSVC
# -----------------------------------------------------------------------

print("\n[5/6] Training Model B: TF-IDF + LinearSVC...")
svc_pipeline = Pipeline([
    ('tfidf', TfidfVectorizer(
        max_features=50000,
        ngram_range=(1, 2),
        sublinear_tf=True
    )),
    ('clf', LinearSVC(
        max_iter=2000,
        class_weight='balanced',
        C=1.0,
        random_state=42
    ))
])

svc_pipeline.fit(X_train, y_train)
y_pred_svc = svc_pipeline.predict(X_test)

svc_macro_f1 = f1_score(y_test, y_pred_svc, average='macro')
svc_weighted_f1 = f1_score(y_test, y_pred_svc, average='weighted')
svc_accuracy = accuracy_score(y_test, y_pred_svc)
svc_per_class_f1 = dict(zip(
    class_names,
    [round(float(v), 4) for v in f1_score(y_test, y_pred_svc, average=None)]
))
svc_cm = confusion_matrix(y_test, y_pred_svc).tolist()

print(f"  Macro-F1: {svc_macro_f1:.4f}, Accuracy: {svc_accuracy:.4f}")

# Save
svc_path = os.path.join(MODELS_DIR, 'svc_pipeline.pkl')
with open(svc_path, 'wb') as f:
    pickle.dump(svc_pipeline, f)
print(f"  Saved svc_pipeline.pkl")

# -----------------------------------------------------------------------
# 5. MODEL C — Word2Vec + PyTorch Neural Network
# -----------------------------------------------------------------------

print("\n[6/6] Training Model C: Word2Vec + PyTorch Neural Network...")

# Tokenize corpus
print("  Tokenizing corpus for Word2Vec...")
tokenized_corpus = [tokenize(text) for text in X_train]

# Train Word2Vec
from gensim.models import Word2Vec

print("  Training Word2Vec model...")
w2v_model = Word2Vec(
    sentences=tokenized_corpus,
    vector_size=100,
    window=5,
    min_count=2,
    workers=4,
    seed=42
)

w2v_path = os.path.join(MODELS_DIR, 'w2v_model.bin')
w2v_model.save(w2v_path)
print(f"  Saved w2v_model.bin")


def get_doc_vector(text: str, model: Word2Vec) -> np.ndarray:
    """Average word vectors for tokens present in the vocabulary."""
    tokens = tokenize(text)
    vectors = []
    for token in tokens:
        if token in model.wv:
            vectors.append(model.wv[token])
    if vectors:
        return np.mean(vectors, axis=0).astype(np.float32)
    else:
        return np.zeros(model.vector_size, dtype=np.float32)


print("  Building document vectors...")
X_train_vec = np.array([get_doc_vector(t, w2v_model) for t in X_train], dtype=np.float32)
X_test_vec = np.array([get_doc_vector(t, w2v_model) for t in X_test], dtype=np.float32)

# PyTorch Neural Network
import torch
import torch.nn as nn
from torch.utils.data import TensorDataset, DataLoader

num_classes = len(class_names)

class ResumeClassifier(nn.Module):
    def __init__(self, input_size=100, num_classes=24):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(input_size, 256),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(256, 128),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(128, num_classes)
        )

    def forward(self, x):
        return self.net(x)


device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f"  Using device: {device}")

model_nn = ResumeClassifier(input_size=100, num_classes=num_classes).to(device)

# Prepare tensors
X_train_tensor = torch.tensor(X_train_vec, dtype=torch.float32)
y_train_tensor = torch.tensor(y_train, dtype=torch.long)
X_test_tensor = torch.tensor(X_test_vec, dtype=torch.float32)
y_test_tensor = torch.tensor(y_test, dtype=torch.long)

train_dataset = TensorDataset(X_train_tensor, y_train_tensor)
train_loader = DataLoader(train_dataset, batch_size=64, shuffle=True)

criterion = nn.CrossEntropyLoss()
optimizer = torch.optim.Adam(model_nn.parameters(), lr=1e-3)

print("  Training neural network (30 epochs)...")
model_nn.train()
for epoch in range(30):
    total_loss = 0.0
    for X_batch, y_batch in train_loader:
        X_batch, y_batch = X_batch.to(device), y_batch.to(device)
        optimizer.zero_grad()
        outputs = model_nn(X_batch)
        loss = criterion(outputs, y_batch)
        loss.backward()
        optimizer.step()
        total_loss += loss.item()
    if (epoch + 1) % 5 == 0:
        avg_loss = total_loss / len(train_loader)
        print(f"    Epoch {epoch+1:2d}/30 — loss: {avg_loss:.4f}")

# Evaluate neural network
model_nn.eval()
with torch.no_grad():
    X_test_gpu = X_test_tensor.to(device)
    logits = model_nn(X_test_gpu)
    probs = torch.softmax(logits, dim=1).cpu().numpy()
    y_pred_nn = np.argmax(probs, axis=1)

nn_macro_f1 = f1_score(y_test, y_pred_nn, average='macro')
nn_weighted_f1 = f1_score(y_test, y_pred_nn, average='weighted')
nn_accuracy = accuracy_score(y_test, y_pred_nn)
nn_per_class_f1 = dict(zip(
    class_names,
    [round(float(v), 4) for v in f1_score(y_test, y_pred_nn, average=None)]
))
nn_cm = confusion_matrix(y_test, y_pred_nn).tolist()

print(f"  Macro-F1: {nn_macro_f1:.4f}, Accuracy: {nn_accuracy:.4f}")

# Save PyTorch state dict
nn_path = os.path.join(MODELS_DIR, 'pytorch_nn.pt')
torch.save(model_nn.state_dict(), nn_path)
print(f"  Saved pytorch_nn.pt")

# -----------------------------------------------------------------------
# 6. DETERMINE BEST MODEL AND SAVE EVALUATION
# -----------------------------------------------------------------------

models_eval = [
    {
        "name": "TF-IDF + Logistic Regression",
        "key": "lr",
        "macro_f1": round(lr_macro_f1, 4),
        "weighted_f1": round(lr_weighted_f1, 4),
        "accuracy": round(lr_accuracy, 4),
        "per_class_f1": lr_per_class_f1,
        "confusion_matrix": lr_cm,
        "class_names": class_names
    },
    {
        "name": "TF-IDF + LinearSVC",
        "key": "svc",
        "macro_f1": round(svc_macro_f1, 4),
        "weighted_f1": round(svc_weighted_f1, 4),
        "accuracy": round(svc_accuracy, 4),
        "per_class_f1": svc_per_class_f1,
        "confusion_matrix": svc_cm,
        "class_names": class_names
    },
    {
        "name": "Word2Vec + PyTorch Neural Network",
        "key": "nn",
        "macro_f1": round(nn_macro_f1, 4),
        "weighted_f1": round(nn_weighted_f1, 4),
        "accuracy": round(nn_accuracy, 4),
        "per_class_f1": nn_per_class_f1,
        "confusion_matrix": nn_cm,
        "class_names": class_names
    }
]

# Best model by macro-F1
best_model_entry = max(models_eval, key=lambda m: m['macro_f1'])
best_model_key = best_model_entry['key']
print(f"\nBest model: {best_model_entry['name']} (Macro-F1: {best_model_entry['macro_f1']})")

evaluation = {
    "models": models_eval,
    "best_model": best_model_entry['name'],
    "best_model_key": best_model_key,
    "training_notes": (
        "All models trained on 80/20 stratified split. "
        "TF-IDF models use sklearn Pipeline for clean preprocessing+model serialization. "
        "Word2Vec trained on training corpus only to prevent data leakage. "
        "PyTorch NN trained for 30 epochs with Adam optimizer (lr=1e-3) and CrossEntropyLoss. "
        "Primary metric is Macro-F1 due to class imbalance."
    )
}

eval_path = os.path.join(MODELS_DIR, 'evaluation.json')
with open(eval_path, 'w') as f:
    json.dump(evaluation, f, indent=2)
print(f"Saved evaluation.json")

# -----------------------------------------------------------------------
# 7. ERROR ANALYSIS (best model on test set)
# -----------------------------------------------------------------------

print("\nRunning error analysis on best model...")

# Get predictions and confidences for the best model
if best_model_key == 'lr':
    # LR supports predict_proba
    best_probs = lr_pipeline.predict_proba(X_test)
    best_preds = y_pred_lr
elif best_model_key == 'svc':
    # LinearSVC doesn't support predict_proba directly; use decision_function
    from sklearn.preprocessing import MinMaxScaler
    dec_func = svc_pipeline.decision_function(X_test)
    # Normalize to approximate probabilities using softmax
    def softmax(x):
        e_x = np.exp(x - np.max(x, axis=1, keepdims=True))
        return e_x / e_x.sum(axis=1, keepdims=True)
    best_probs = softmax(dec_func)
    best_preds = y_pred_svc
else:
    best_probs = probs  # from nn evaluation above
    best_preds = y_pred_nn

# Collect misclassified samples
errors = []
test_indices = list(range(len(X_test)))
for i in test_indices:
    true_label_idx = y_test[i]
    pred_label_idx = best_preds[i]
    if true_label_idx != pred_label_idx:
        confidence = float(best_probs[i][pred_label_idx])
        errors.append({
            "true_label": class_names[true_label_idx],
            "predicted_label": class_names[pred_label_idx],
            "resume_snippet": X_test[i][:200],
            "confidence": round(confidence, 4)
        })
        if len(errors) >= 50:
            break

# Top-10 confusion pairs
from collections import Counter as _Counter
confusion_counter = _Counter()
for i in range(len(X_test)):
    if y_test[i] != best_preds[i]:
        pair = (class_names[y_test[i]], class_names[best_preds[i]])
        confusion_counter[pair] += 1

confusion_pairs = [
    {"true": pair[0], "pred": pair[1], "count": count}
    for pair, count in confusion_counter.most_common(10)
]

error_analysis = {
    "errors": errors,
    "confusion_pairs": confusion_pairs
}

error_path = os.path.join(MODELS_DIR, 'error_analysis.json')
with open(error_path, 'w') as f:
    json.dump(error_analysis, f, indent=2, ensure_ascii=False)
print(f"Saved error_analysis.json ({len(errors)} errors, {len(confusion_pairs)} top confusion pairs)")

# -----------------------------------------------------------------------
# SUMMARY
# -----------------------------------------------------------------------

print("\n" + "=" * 60)
print("Training Complete!")
print("=" * 60)
for m in models_eval:
    print(f"  {m['name']}: Macro-F1={m['macro_f1']}, Accuracy={m['accuracy']}")
print(f"\nBest model: {best_model_entry['name']}")
print("\nArtifacts saved:")
for fname in ['lr_pipeline.pkl', 'svc_pipeline.pkl', 'w2v_model.bin', 'pytorch_nn.pt',
              'label_encoder.pkl', 'evaluation.json', 'error_analysis.json']:
    fpath = os.path.join(MODELS_DIR, fname)
    exists = os.path.exists(fpath)
    print(f"  {'✓' if exists else '✗'} {fname}")
