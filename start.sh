#!/usr/bin/env bash
# ── Terminplanung lokal starten ─────────────────────────────────
# Startet einen kleinen Webserver im Projektordner und öffnet die App.
set -e
cd "$(dirname "$0")"
PORT="${PORT:-8777}"
URL="http://localhost:${PORT}/"

open_browser() {
  if command -v xdg-open >/dev/null 2>&1; then xdg-open "$URL" >/dev/null 2>&1 || true
  elif command -v open >/dev/null 2>&1; then open "$URL" || true
  fi
}

echo "Terminplanung läuft auf $URL  (Beenden mit Strg+C)"
open_browser &
if command -v python3 >/dev/null 2>&1; then exec python3 -m http.server "$PORT"
elif command -v python >/dev/null 2>&1; then exec python -m http.server "$PORT"
elif command -v npx >/dev/null 2>&1; then exec npx --yes http-server -p "$PORT" -c-1
else echo "Bitte Python installieren oder die Dateien auf GitHub Pages legen."; exit 1
fi
