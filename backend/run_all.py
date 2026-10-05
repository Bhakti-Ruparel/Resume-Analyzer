"""
Master runner: install deps, run data_analysis, run train, verify.
Writes all output to run_log.txt.
"""
import subprocess
import sys
import os
import json

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
LOG_FILE = os.path.join(BACKEND_DIR, 'run_log.txt')

log_lines = []

def log(msg):
    print(msg)
    log_lines.append(msg)

def run(cmd, cwd=None, timeout=1200):
    """Run a command, return (returncode, stdout, stderr)."""
    r = subprocess.run(
        cmd,
        capture_output=True,
        text=True,
        cwd=cwd or BACKEND_DIR,
        timeout=timeout
    )
    return r.returncode, r.stdout, r.stderr

# -----------------------------------------------------------------------
# STEP 1: Install requirements
# -----------------------------------------------------------------------
log("="*60)
log("STEP 1: Installing requirements")
log("="*60)

packages = [
    "fastapi==0.115.0",
    "uvicorn[standard]==0.30.6",
    "pandas==2.2.3",
    "numpy==1.26.4",
    "scikit-learn==1.5.2",
    "gensim==4.3.3",
    "torch==2.4.1",
    "python-multipart==0.0.12",
    "PyPDF2==3.0.1",
    "python-docx==1.1.2",
]

all_ok = True
for pkg in packages:
    log(f"  Installing {pkg}...")
    rc, out, err = run([sys.executable, "-m", "pip", "install", pkg], timeout=300)
    last = (out.strip().split('\n')[-1] if out.strip() else err.strip().split('\n')[-1] if err.strip() else "no output")
    status = "OK" if rc == 0 else "FAIL"
    log(f"  {status}: {pkg} — {last}")
    if rc != 0:
        all_ok = False
        log(f"    STDERR: {err[-500:]}")

log(f"Install phase: {'ALL OK' if all_ok else 'SOME FAILED'}")

# -----------------------------------------------------------------------
# STEP 2: Syntax check
# -----------------------------------------------------------------------
log("\n" + "="*60)
log("STEP 2: Syntax check")
log("="*60)

rc, out, err = run([sys.executable, "-m", "py_compile",
                    "preprocessor.py", "data_analysis.py", "train.py", "main.py"])
log(f"py_compile returncode: {rc}")
if out: log(f"stdout: {out}")
if err: log(f"stderr: {err}")
log("Syntax OK" if rc == 0 else "SYNTAX ERRORS FOUND")

# -----------------------------------------------------------------------
# STEP 3: Data analysis
# -----------------------------------------------------------------------
log("\n" + "="*60)
log("STEP 3: Running data_analysis.py")
log("="*60)

rc, out, err = run([sys.executable, "data_analysis.py"], timeout=120)
log(f"data_analysis returncode: {rc}")
log(out[-2000:] if out else "(no stdout)")
if err: log(f"STDERR: {err[-1000:]}")

cache_path = os.path.join(BACKEND_DIR, 'analysis_cache.json')
if os.path.exists(cache_path):
    log("analysis_cache.json: CREATED")
    with open(cache_path) as f:
        data = json.load(f)
    log(f"  Keys: {list(data.keys())}")
    log(f"  dataset.total_rows: {data.get('dataset', {}).get('total_rows')}")
    log(f"  quality.usable_records: {data.get('quality', {}).get('usable_records')}")
else:
    log("analysis_cache.json: MISSING")

# -----------------------------------------------------------------------
# STEP 4: Training
# -----------------------------------------------------------------------
log("\n" + "="*60)
log("STEP 4: Running train.py (this may take several minutes)")
log("="*60)

rc, out, err = run([sys.executable, "train.py"], timeout=1200)
log(f"train.py returncode: {rc}")
log(out[-3000:] if out else "(no stdout)")
if err: log(f"STDERR: {err[-1000:]}")

models_dir = os.path.join(BACKEND_DIR, 'models')
for fname in ['lr_pipeline.pkl', 'svc_pipeline.pkl', 'w2v_model.bin',
              'pytorch_nn.pt', 'label_encoder.pkl', 'evaluation.json', 'error_analysis.json']:
    fpath = os.path.join(models_dir, fname)
    exists = os.path.exists(fpath)
    size = os.path.getsize(fpath) if exists else 0
    log(f"  {'OK' if exists else 'MISSING'}: {fname} ({size} bytes)")

eval_path = os.path.join(models_dir, 'evaluation.json')
if os.path.exists(eval_path):
    with open(eval_path) as f:
        ev = json.load(f)
    log(f"\nEvaluation summary:")
    for m in ev.get('models', []):
        log(f"  {m['name']}: macro_f1={m['macro_f1']}, accuracy={m['accuracy']}")
    log(f"  Best: {ev.get('best_model')}")

# -----------------------------------------------------------------------
# STEP 5: FastAPI import smoke test
# -----------------------------------------------------------------------
log("\n" + "="*60)
log("STEP 5: FastAPI import test")
log("="*60)

rc, out, err = run([sys.executable, "-c", "from main import app; print('FastAPI app imported OK')"])
log(f"import test returncode: {rc}")
log(out if out else "(no stdout)")
if err: log(f"STDERR: {err[-500:]}")

# -----------------------------------------------------------------------
# SAVE LOG
# -----------------------------------------------------------------------
with open(LOG_FILE, 'w', encoding='utf-8') as f:
    f.write('\n'.join(log_lines))

log(f"\nAll done. Log saved to {LOG_FILE}")
