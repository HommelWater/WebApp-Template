VENV_DIR="$(pwd)/venv"
cd "$(dirname "$0")"
python3 -m venv "$VENV_DIR"
source "$VENV_DIR/bin/activate"
pip install -q fastapi pyotp uvicorn python-multipart
uvicorn server:app --host 0.0.0.0 --port 8000 --reload