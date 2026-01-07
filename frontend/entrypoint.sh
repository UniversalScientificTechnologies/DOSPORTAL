#!/bin/sh

# Etrypoint for frontend dockerfile

set -e

cd /app/frontend

if [ ! -d node_modules ] || [ -z "$(ls -A node_modules 2>/dev/null)" ]; then
  echo "[frontend] Installing dependencies..."
  npm install
fi

echo "[frontend] Starting dev server..."
exec npm run dev -- --host 0.0.0.0 --port 5173
