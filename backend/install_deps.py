"""Helper script to install requirements and capture output."""
import subprocess
import sys
import os

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
REQ_FILE = os.path.join(BACKEND_DIR, 'requirements.txt')
LOG_FILE = os.path.join(BACKEND_DIR, 'install_log.txt')

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

results = []
for pkg in packages:
    print(f"Installing {pkg}...")
    r = subprocess.run(
        [sys.executable, "-m", "pip", "install", pkg],
        capture_output=True, text=True
    )
    status = "OK" if r.returncode == 0 else "FAIL"
    last_line = (r.stdout.strip().split('\n')[-1] if r.stdout.strip() else "") or r.stderr.strip().split('\n')[-1]
    results.append(f"{status}: {pkg} — {last_line}")
    print(f"  {status}: {last_line}")

with open(LOG_FILE, 'w') as f:
    f.write('\n'.join(results))

print("Done. Results in install_log.txt")
