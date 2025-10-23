#!/usr/bin/env bash
set -euo pipefail

# Ensure .env exists (copy example if missing)
if [ ! -f "$(pwd)/backend/.env" ]; then
  if [ -f "$(pwd)/backend/.env.example" ]; then
    echo "No backend/.env found — copying .env.example to backend/.env (edit it to add real values)"
    cp "$(pwd)/backend/.env.example" "$(pwd)/backend/.env"
  else
    echo "No backend/.env or .env.example found; continuing without .env"
  fi
fi

# Use the venv python if present, otherwise fallback to system python
PYTHON_BIN="$(pwd)/backend/.venv/bin/python"
if [ ! -x "$PYTHON_BIN" ]; then
  echo "Virtualenv python not found at $PYTHON_BIN — trying system python"
  PYTHON_BIN="python"
fi

echo "Starting backend with $PYTHON_BIN (loading backend/.env if present)"
# Change into backend so dotenv run will load backend/.env
cd "$(pwd)/backend"
# Run the backend directly; our code calls load_dotenv() and will pick up backend/.env
"$PYTHON_BIN" app.py
