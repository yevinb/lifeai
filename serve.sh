#!/bin/bash
# Local preview for LifeAI frontend (login + dashboard need Firebase; AI calls hit Render unless you run Backed locally)
cd "$(dirname "$0")"
PORT="${PORT:-8765}"
echo ""
echo "  LifeAI → http://localhost:$PORT"
echo "  Live site → https://smartlifeai.co.uk"
echo "  Stop: Ctrl+C"
echo ""
python3 -m http.server "$PORT" --bind 127.0.0.1
