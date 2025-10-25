#!/bin/bash

# Cleanup script to kill processes on required ports before starting dev server

echo "🧹 Cleaning up ports..."

# Kill processes on required ports
ports=(5173 5001 5002 8100)

for port in "${ports[@]}"; do
  echo "Checking port $port..."
  pids=$(lsof -ti:$port 2>/dev/null)
  if [ ! -z "$pids" ]; then
    echo "Killing processes on port $port: $pids"
    echo "$pids" | xargs kill -9 2>/dev/null
  fi
done

echo "✅ Port cleanup complete"
