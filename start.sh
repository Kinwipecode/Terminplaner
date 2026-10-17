#!/usr/bin/env bash
# ── Terminplanung lokal starten ─────────────────────────────────
# Startet einen kleinen Webserver im Projektordner und öffnet die App.
set -e
cd "$(dirname "$0")"
PORT="${PORT:-8777}"

if command -v python3 >/dev/null 2>&1; then exec python3 tools/serve.py --port "$PORT" "$@"
elif command -v python >/dev/null 2>&1; then exec python tools/serve.py --port "$PORT" "$@"
elif command -v npx >/dev/null 2>&1; then
  echo "Terminplanung läuft auf http://127.0.0.1:${PORT}/  (Beenden mit Strg+C)"
  ( sleep 1; (xdg-open "http://127.0.0.1:${PORT}/" || open "http://127.0.0.1:${PORT}/") >/dev/null 2>&1 || true ) &
  exec npx --yes http-server -p "$PORT" -a 127.0.0.1 -c-1
else
  echo "Bitte Python installieren oder die Dateien auf GitHub Pages legen."
  exit 1
fi
