#!/usr/bin/env bash
set -euo pipefail

# Kill any processes listening on known dev ports so we can start cleanly
PORTS=(5001 8100 5173)
echo "Checking ports: ${PORTS[*]}"
for p in "${PORTS[@]}"; do
  PIDS=$(lsof -ti TCP:${p} -sTCP:LISTEN || true)
  if [ -n "$PIDS" ]; then
    echo "Killing processes on port $p: $PIDS"
    # try polite kill first
    kill $PIDS || true
    sleep 0.5
    # force kill if still present
    PIDS2=$(lsof -ti TCP:${p} -sTCP:LISTEN || true)
    if [ -n "$PIDS2" ]; then
      echo "Force killing: $PIDS2"
      kill -9 $PIDS2 || true
    fi
  fi
done

echo "Starting dev services via concurrently"
exec concurrently "npm:dev:backend" "npm:dev:frontend" "npm:dev:lab"
