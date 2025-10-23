echo "Starting backend with $PYTHON_BIN (loading backend/.env if present)"
#!/usr/bin/env bash
set -euo pipefail

# start-backend.sh: create/use a virtualenv in backend/.venv, install requirements
# if missing, then run app.py with the venv python. Safe to run multiple times.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR"
VENV_DIR="$BACKEND_DIR/.venv"
PYTHON_BIN="$VENV_DIR/bin/python"

# Ensure .env exists (copy example if missing)
if [ ! -f "$BACKEND_DIR/.env" ]; then
  if [ -f "$BACKEND_DIR/.env.example" ]; then
    echo "No backend/.env found — copying .env.example to backend/.env (edit it to add real values)"
    cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
  else
    echo "No backend/.env or .env.example found; continuing without .env"
  fi
fi

echo "Backend dir: $BACKEND_DIR"

# Create virtualenv if missing
if [ ! -x "$PYTHON_BIN" ]; then
  if command -v python3 >/dev/null 2>&1; then
    echo "Creating virtualenv in $VENV_DIR using python3"
    python3 -m venv "$VENV_DIR"
  else
    echo "python3 not found in PATH. Please install Python 3.8+ or create $VENV_DIR manually." >&2
    exit 1
  fi
fi

# Use venv pip to install requirements unless SKIP_PIP is set
if [ "${SKIP_PIP:-0}" != "1" ]; then
  echo "Installing backend Python requirements into venv (this may take a moment)"
  "$PYTHON_BIN" -m pip install --upgrade pip setuptools wheel
  "$PYTHON_BIN" -m pip install -r "$BACKEND_DIR/requirements.txt"
fi

echo "Starting backend with $PYTHON_BIN (loading $BACKEND_DIR/.env if present)"
cd "$BACKEND_DIR"
exec "$PYTHON_BIN" app.py
