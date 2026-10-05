"""
main.py — FastAPI application for ResumeForge ML Intelligence Platform.
Serves all API endpoints consumed by the frontend.
"""

import os
import sys
import json
import pickle
import subprocess
import numpy as np
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Ensure backend dir is on path
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from preprocessor import preprocess, tokenize

# Paths
MODELS_DIR = os.path.join(BACKEND_DIR, 'models')
ANALYSIS_CACHE = os.path.join(BACKEND_DIR, 'analysis_cache.json')
EVALUATION_JSON = os.path.join(MODELS_DIR, 'evaluation.json')
ERROR_ANALYSIS_JSON = os.path.join(MODELS_DIR, 'error_analysis.json')

# -----------------------------------------------------------------------
# FASTAPI APP
# -----------------------------------------------------------------------

app = FastAPI(title="ResumeForge API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------------------------------------------------
# LAZY-LOADED CACHES
# -----------------------------------------------------------------------

_analysis_cache: Optional[dict] = None
_evaluation: Optional[dict] = None
_error_analysis: Optional[dict] = None
_lr_pipeline = None
_svc_pipeline = None
_le = None
_w2v_model = None
_nn_model = None
_nn_classes: Optional[int] = None


def _load_json(path: str) -> Optional[dict]:
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return None


def get_analysis_cache() -> dict:
    global _analysis_cache
    if _analysis_cache is None:
        _analysis_cache = _load_json(ANALYSIS_CACHE)
    if _analysis_cache is None:
        raise HTTPException(status_code=503, detail="not_trained",
                            headers={"X-Message": "Run POST /api/train first"})
    return _analysis_cache


def get_evaluation() -> dict:
    global _evaluation
    if _evaluation is None:
        _evaluation = _load_json(EVALUATION_JSON)
    if _evaluation is None:
        raise HTTPException(status_code=503, detail="not_trained",
                            headers={"X-Message": "Run POST /api/train first"})
    return _evaluation


def get_error_analysis() -> dict:
    global _error_analysis
    if _error_analysis is None:
        _error_analysis = _load_json(ERROR_ANALYSIS_JSON)
    if _error_analysis is None:
        raise HTTPException(status_code=503, detail="not_trained",
                            headers={"X-Message": "Run POST /api/train first"})
    return _error_analysis


def load_prediction_models():
    """Lazily load all models needed for prediction."""
    global _lr_pipeline, _svc_pipeline, _le, _w2v_model, _nn_model, _nn_classes

    lr_path = os.path.join(MODELS_DIR, 'lr_pipeline.pkl')
    svc_path = os.path.join(MODELS_DIR, 'svc_pipeline.pkl')
    le_path = os.path.join(MODELS_DIR, 'label_encoder.pkl')
    w2v_path = os.path.join(MODELS_DIR, 'w2v_model.bin')
    nn_path = os.path.join(MODELS_DIR, 'pytorch_nn.pt')

    missing = [p for p in [lr_path, svc_path, le_path] if not os.path.exists(p)]
    if missing:
        raise HTTPException(status_code=503, detail="not_trained",
                            headers={"X-Message": "Run POST /api/train first"})

    if _le is None:
        with open(le_path, 'rb') as f:
            _le = pickle.load(f)

    if _lr_pipeline is None:
        with open(lr_path, 'rb') as f:
            _lr_pipeline = pickle.load(f)

    if _svc_pipeline is None:
        with open(svc_path, 'rb') as f:
            _svc_pipeline = pickle.load(f)

    # Word2Vec (optional — may not be loaded for basic prediction)
    if _w2v_model is None and os.path.exists(w2v_path):
        from gensim.models import Word2Vec
        _w2v_model = Word2Vec.load(w2v_path)

    # PyTorch NN (optional)
    if _nn_model is None and os.path.exists(nn_path):
        import torch
        import torch.nn as nn

        _nn_classes = len(_le.classes_)

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

        model = ResumeClassifier(input_size=100, num_classes=_nn_classes)
        model.load_state_dict(torch.load(nn_path, map_location='cpu', weights_only=True))
        model.eval()
        _nn_model = model


def get_doc_vector_for_predict(text: str) -> np.ndarray:
    """Average word vectors for tokens present in the W2V vocabulary."""
    if _w2v_model is None:
        return np.zeros(100, dtype=np.float32)
    tokens = tokenize(text)
    vectors = [_w2v_model.wv[tok] for tok in tokens if tok in _w2v_model.wv]
    if vectors:
        return np.mean(vectors, axis=0).astype(np.float32)
    return np.zeros(_w2v_model.vector_size, dtype=np.float32)


# -----------------------------------------------------------------------
# DETERMINE BEST MODEL KEY
# -----------------------------------------------------------------------

def get_best_model_key() -> str:
    """Return 'lr', 'svc', or 'nn' for the best model."""
    try:
        ev = get_evaluation()
        return ev.get('best_model_key', 'lr')
    except Exception:
        return 'lr'


# -----------------------------------------------------------------------
# HELPER: PREDICT WITH GIVEN TEXT
# -----------------------------------------------------------------------

def _predict_text(text: str) -> dict:
    load_prediction_models()
    import torch

    cleaned = preprocess(text)
    best_key = get_best_model_key()

    if best_key == 'lr':
        probs = _lr_pipeline.predict_proba([cleaned])[0]
        classes = _le.classes_
        pred_idx = int(np.argmax(probs))
        confidence = float(probs[pred_idx])
        all_scores = {cls: round(float(p), 4) for cls, p in zip(classes, probs)}
    elif best_key == 'svc':
        dec = _svc_pipeline.decision_function([cleaned])[0]
        # Softmax normalization for approximate probabilities
        e = np.exp(dec - np.max(dec))
        probs = e / e.sum()
        classes = _le.classes_
        pred_idx = int(np.argmax(probs))
        confidence = float(probs[pred_idx])
        all_scores = {cls: round(float(p), 4) for cls, p in zip(classes, probs)}
    else:
        # Neural network
        vec = get_doc_vector_for_predict(cleaned)
        with torch.no_grad():
            tensor = torch.tensor(vec, dtype=torch.float32).unsqueeze(0)
            logits = _nn_model(tensor)
            probs_t = torch.softmax(logits, dim=1)[0].numpy()
        classes = _le.classes_
        pred_idx = int(np.argmax(probs_t))
        confidence = float(probs_t[pred_idx])
        all_scores = {cls: round(float(p), 4) for cls, p in zip(classes, probs_t)}

    return {
        "category": classes[pred_idx],
        "confidence": round(confidence, 4),
        "all_scores": all_scores
    }


# -----------------------------------------------------------------------
# ENDPOINTS
# -----------------------------------------------------------------------

@app.get("/api/health")
def health():
    trained = (
        os.path.exists(os.path.join(MODELS_DIR, 'lr_pipeline.pkl')) and
        os.path.exists(os.path.join(MODELS_DIR, 'evaluation.json'))
    )
    analysis_ready = os.path.exists(ANALYSIS_CACHE)
    return {"status": "ok", "trained": trained, "analysis_ready": analysis_ready}


@app.get("/api/problem")
def problem():
    return {
        "title": "Multiclass Resume Classification",
        "description": (
            "Given the raw text of a resume, classify it into one of 24 occupational categories. "
            "The task is a supervised multiclass text classification problem."
        ),
        "task_type": "Multiclass Text Classification",
        "input": "Unstructured Resume Text (Resume_str)",
        "output": "24 Occupational Categories",
        "primary_metric": "Macro-F1",
        "metric_rationale": (
            "Macro-F1 gives equal weight to every class regardless of its size. "
            "Because the dataset is imbalanced (up to 5.45x ratio between largest and smallest class), "
            "accuracy would be misleadingly high by over-predicting frequent classes. "
            "Macro-F1 penalises poor performance on minority classes equally."
        ),
        "num_classes": 24,
        "categories": [
            "ACCOUNTANT", "ADVOCATE", "AGRICULTURE", "APPAREL", "ARTS",
            "AUTOMOBILE", "AVIATION", "BANKING", "BPO", "BUSINESS-DEVELOPMENT",
            "CHEF", "CONSTRUCTION", "CONSULTANT", "DESIGNER", "DIGITAL-MEDIA",
            "ENGINEERING", "FINANCE", "FITNESS", "HEALTHCARE", "HR",
            "INFORMATION-TECHNOLOGY", "PUBLIC-RELATIONS", "SALES", "TEACHER"
        ],
        "example": {
            "input": "Experienced Python developer with AWS and machine learning expertise...",
            "output": "INFORMATION-TECHNOLOGY"
        }
    }


@app.get("/api/dataset/summary")
def dataset_summary():
    cache = get_analysis_cache()
    return cache['dataset']


@app.get("/api/data-quality")
def data_quality():
    cache = get_analysis_cache()
    return cache['quality']


@app.get("/api/eda")
def eda():
    cache = get_analysis_cache()
    return cache['eda']


@app.get("/api/preprocessing")
def preprocessing():
    cache = get_analysis_cache()
    return cache['preprocessing_steps']


@app.get("/api/features")
def features():
    return {
        "tfidf": {
            "name": "TF-IDF (Term Frequency–Inverse Document Frequency)",
            "max_features": 50000,
            "ngram_range": [1, 2],
            "sublinear_tf": True,
            "why_chosen": (
                "TF-IDF is a strong baseline for text classification. It captures word importance "
                "relative to the corpus, not just frequency. Using bigrams (ngram_range=(1,2)) "
                "captures common phrases like 'machine learning' or 'project management'. "
                "sublinear_tf=True dampens the effect of very frequent terms. "
                "It is interpretable, fast to train, and works well with linear classifiers."
            ),
            "pros": [
                "Fast to compute",
                "Handles large vocabularies efficiently",
                "Interpretable feature weights",
                "Strong baseline for text classification"
            ],
            "cons": [
                "Ignores word order beyond bigrams",
                "No semantic similarity between words",
                "High-dimensional sparse representation"
            ]
        },
        "word2vec": {
            "name": "Word2Vec (Skip-gram / CBOW)",
            "vector_size": 100,
            "window": 5,
            "min_count": 2,
            "why_chosen": (
                "Word2Vec learns dense semantic representations where similar words have similar vectors. "
                "Unlike TF-IDF, it captures semantic relationships ('engineer' is close to 'developer'). "
                "We train it on the resume corpus itself so the embeddings reflect domain vocabulary. "
                "Document vectors are computed as the mean of their word vectors, giving a fixed-size "
                "representation suitable for neural network input."
            ),
            "document_vector_method": (
                "Mean pooling: average all word vectors for tokens present in the W2V vocabulary. "
                "Out-of-vocabulary tokens are skipped. If no tokens are in vocabulary, a zero vector is used."
            ),
            "pros": [
                "Dense semantic representations",
                "Captures word similarity and relationships",
                "Lower-dimensional than TF-IDF",
                "Works well with neural network architectures"
            ],
            "cons": [
                "Requires sufficient training data",
                "Mean pooling loses word order",
                "Less interpretable than TF-IDF weights"
            ]
        },
        "neural_network": {
            "name": "PyTorch Feedforward Neural Network",
            "architecture": "Linear(100,256) → ReLU → Dropout(0.3) → Linear(256,128) → ReLU → Dropout(0.3) → Linear(128,24)",
            "input_size": 100,
            "hidden_layers": [256, 128],
            "output_size": 24,
            "dropout": 0.3,
            "optimizer": "Adam (lr=1e-3)",
            "loss": "CrossEntropyLoss",
            "epochs": 30,
            "why_chosen": (
                "A feedforward NN can learn non-linear decision boundaries over the Word2Vec embeddings, "
                "potentially capturing patterns that linear classifiers miss. "
                "Dropout regularization prevents overfitting on the moderately-sized dataset."
            )
        }
    }


@app.get("/api/models")
def models():
    return {
        "models": [
            {
                "id": "lr",
                "name": "TF-IDF + Logistic Regression",
                "family": "Linear Classifier",
                "feature_repr": "TF-IDF",
                "hyperparams": {
                    "C": 5.0,
                    "max_iter": 1000,
                    "class_weight": "balanced",
                    "solver": "lbfgs",
                    "multi_class": "auto",
                    "tfidf_max_features": 50000,
                    "ngram_range": "(1,2)",
                    "sublinear_tf": True
                },
                "rationale": (
                    "Logistic Regression with TF-IDF is the canonical strong baseline for text classification. "
                    "class_weight='balanced' corrects for class imbalance. "
                    "C=5.0 provides moderate regularization. "
                    "It outputs calibrated probabilities via predict_proba, enabling confidence scores."
                ),
                "pros": ["Probabilistic output", "Fast training", "Interpretable coefficients", "Handles imbalance via class_weight"],
                "cons": ["Linear decision boundary", "Ignores semantics between words"]
            },
            {
                "id": "svc",
                "name": "TF-IDF + LinearSVC",
                "family": "Support Vector Machine",
                "feature_repr": "TF-IDF",
                "hyperparams": {
                    "C": 1.0,
                    "max_iter": 2000,
                    "class_weight": "balanced",
                    "tfidf_max_features": 50000,
                    "ngram_range": "(1,2)",
                    "sublinear_tf": True
                },
                "rationale": (
                    "LinearSVC often outperforms Logistic Regression on text classification due to its "
                    "hinge loss objective maximizing margin between classes. "
                    "It is fast on high-dimensional sparse TF-IDF features. "
                    "class_weight='balanced' handles the imbalanced class distribution."
                ),
                "pros": ["Often higher accuracy than LR on text", "Margin maximization", "Fast on sparse features"],
                "cons": ["No probabilistic output natively", "Less interpretable than LR"]
            },
            {
                "id": "nn",
                "name": "Word2Vec + PyTorch Neural Network",
                "family": "Deep Learning",
                "feature_repr": "Word2Vec (mean pooling)",
                "hyperparams": {
                    "w2v_vector_size": 100,
                    "w2v_window": 5,
                    "w2v_min_count": 2,
                    "architecture": "Linear(100,256)→ReLU→Dropout(0.3)→Linear(256,128)→ReLU→Dropout(0.3)→Linear(128,24)",
                    "optimizer": "Adam",
                    "lr": 0.001,
                    "epochs": 30,
                    "batch_size": 64,
                    "dropout": 0.3
                },
                "rationale": (
                    "Word2Vec captures semantic relationships between resume terms. "
                    "The neural network can learn non-linear combinations of these semantic features. "
                    "This approach tests whether semantic embeddings + deep learning can outperform "
                    "sparse statistical representations with linear models."
                ),
                "pros": ["Semantic feature representation", "Non-linear decision boundaries", "Generalization via dropout"],
                "cons": ["Longer training time", "Mean pooling loses word order", "May underperform TF-IDF on small datasets"]
            }
        ]
    }


@app.get("/api/evaluation")
def evaluation():
    return get_evaluation()


@app.get("/api/errors")
def errors():
    return get_error_analysis()


@app.get("/api/pipeline")
def pipeline():
    return {
        "title": "Final Production Pipeline",
        "description": "The complete 9-step process from raw resume text to predicted category.",
        "stages": [
            {
                "step": 1,
                "name": "Raw Resume Input",
                "description": "Accept resume as plain text, PDF, DOCX, or TXT file.",
                "details": "Supports multi-format upload; text is extracted from PDF/DOCX before processing."
            },
            {
                "step": 2,
                "name": "Text Extraction",
                "description": "Extract plain text content from the resume.",
                "details": "PDF: PyPDF2 reads page text. DOCX: python-docx reads paragraphs. TXT: direct read."
            },
            {
                "step": 3,
                "name": "Text Cleaning",
                "description": "Remove URLs, emails, HTML tags, special characters. Lowercase. Normalize whitespace.",
                "details": "Identical to training pipeline via preprocessor.clean_text()."
            },
            {
                "step": 4,
                "name": "Feature Extraction",
                "description": "Transform cleaned text using the trained TF-IDF vectorizer.",
                "details": "The sklearn Pipeline applies the same fitted TF-IDF transformer used during training."
            },
            {
                "step": 5,
                "name": "Model Inference",
                "description": "The best-performing model predicts class probabilities.",
                "details": "The classifier component of the sklearn Pipeline produces a probability distribution over 24 classes."
            },
            {
                "step": 6,
                "name": "Label Decoding",
                "description": "Convert numeric prediction back to human-readable category name.",
                "details": "LabelEncoder.inverse_transform() maps the integer index to the original category string."
            },
            {
                "step": 7,
                "name": "Confidence Scoring",
                "description": "Extract the probability assigned to the predicted class.",
                "details": "Confidence = max(predict_proba output). Values close to 1.0 indicate high certainty."
            },
            {
                "step": 8,
                "name": "All-Scores Distribution",
                "description": "Return probability scores for all 24 categories.",
                "details": "Enables the frontend to visualize which categories were considered and their relative likelihoods."
            },
            {
                "step": 9,
                "name": "JSON Response",
                "description": "Return {category, confidence, all_scores} to the client.",
                "details": "The API response is consumed by the frontend to display the prediction result."
            }
        ]
    }


# -----------------------------------------------------------------------
# TRAIN ENDPOINT
# -----------------------------------------------------------------------

_training_status = {"running": False, "last_result": None}


@app.post("/api/train")
def train(background_tasks: BackgroundTasks):
    """
    Trigger data analysis and model training.
    Returns immediately with status='started'; training runs in background.
    """
    if _training_status["running"]:
        return {"status": "already_running", "message": "Training is already in progress."}

    def _run():
        _training_status["running"] = True
        global _analysis_cache, _evaluation, _error_analysis
        try:
            # Run data analysis first
            from data_analysis import run_analysis
            run_analysis()
            _analysis_cache = None  # Force reload

            # Run train.py as subprocess
            result = subprocess.run(
                [sys.executable, os.path.join(BACKEND_DIR, 'train.py')],
                capture_output=True,
                text=True,
                cwd=BACKEND_DIR
            )
            _evaluation = None  # Force reload
            _error_analysis = None

            if result.returncode == 0:
                _training_status["last_result"] = {"success": True, "output": result.stdout[-2000:]}
            else:
                _training_status["last_result"] = {
                    "success": False,
                    "error": result.stderr[-2000:],
                    "output": result.stdout[-2000:]
                }
        except Exception as e:
            _training_status["last_result"] = {"success": False, "error": str(e)}
        finally:
            _training_status["running"] = False

    background_tasks.add_task(_run)
    return {"status": "started", "message": "Training started in background. Poll /api/health for progress."}


# -----------------------------------------------------------------------
# PREDICT ENDPOINTS
# -----------------------------------------------------------------------

class PredictRequest(BaseModel):
    text: str


@app.post("/api/predict")
def predict(req: PredictRequest):
    """Predict resume category from plain text."""
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")
    return _predict_text(req.text)


@app.post("/api/predict/upload")
async def predict_upload(file: UploadFile = File(...)):
    """
    Predict resume category from uploaded file.
    Supports .pdf, .docx, .txt
    """
    filename = file.filename or ""
    content = await file.read()

    text = ""
    if filename.lower().endswith('.pdf'):
        try:
            import io
            from PyPDF2 import PdfReader
            reader = PdfReader(io.BytesIO(content))
            text = "\n".join(page.extract_text() or "" for page in reader.pages)
        except Exception as e:
            raise HTTPException(status_code=422, detail=f"Failed to read PDF: {e}")

    elif filename.lower().endswith('.docx'):
        try:
            import io
            from docx import Document
            doc = Document(io.BytesIO(content))
            text = "\n".join(p.text for p in doc.paragraphs)
        except Exception as e:
            raise HTTPException(status_code=422, detail=f"Failed to read DOCX: {e}")

    elif filename.lower().endswith('.txt'):
        try:
            text = content.decode('utf-8', errors='replace')
        except Exception as e:
            raise HTTPException(status_code=422, detail=f"Failed to read TXT: {e}")

    else:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type: '{filename}'. Supported: .pdf, .docx, .txt"
        )

    if not text.strip():
        raise HTTPException(status_code=422, detail="No text could be extracted from the file.")

    return _predict_text(text)


# -----------------------------------------------------------------------
# STARTUP
# -----------------------------------------------------------------------

@app.on_event("startup")
async def startup_event():
    """Pre-warm caches if artifacts exist."""
    global _analysis_cache, _evaluation, _error_analysis
    if os.path.exists(ANALYSIS_CACHE):
        _analysis_cache = _load_json(ANALYSIS_CACHE)
    if os.path.exists(EVALUATION_JSON):
        _evaluation = _load_json(EVALUATION_JSON)
    if os.path.exists(ERROR_ANALYSIS_JSON):
        _error_analysis = _load_json(ERROR_ANALYSIS_JSON)


if __name__ == '__main__':
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
