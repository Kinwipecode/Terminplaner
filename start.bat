@echo off
rem ── Terminplanung lokal starten ──────────────────────────────
rem Startet einen kleinen Webserver im Projektordner und öffnet
rem die App im Browser. Der Server ist nötig, weil die App aus
rem JavaScript-Modulen besteht.
cd /d "%~dp0"
set PORT=8777
set URL=http://localhost:%PORT%/

where python >nul 2>nul
if %errorlevel%==0 (
  echo Terminplanung laeuft auf %URL%
  echo Beenden mit Strg+C
  start "" "%URL%"
  python -m http.server %PORT%
  goto :eof
)

where py >nul 2>nul
if %errorlevel%==0 (
  echo Terminplanung laeuft auf %URL%
  echo Beenden mit Strg+C
  start "" "%URL%"
  py -m http.server %PORT%
  goto :eof
)

where npx >nul 2>nul
if %errorlevel%==0 (
  echo Terminplanung laeuft auf %URL%
  echo Beenden mit Strg+C
  start "" "%URL%"
  npx --yes http-server -p %PORT% -c-1
  goto :eof
)

echo Python wurde nicht gefunden.
echo Bitte Python installieren (python.org) oder die Dateien auf GitHub Pages legen.
pause
