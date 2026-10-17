@echo off
rem ============================================================
rem  Terminstart.bat - startet die Terminplanung im Browser
rem
rem  Doppelklick genuegt. Das Fenster muss waehrend der Arbeit
rem  geoeffnet bleiben (es ist der kleine Webserver).
rem  Beenden: Strg+C oder Fenster schliessen.
rem
rem  Zusatzargumente werden durchgereicht, z.B.:
rem     Terminstart.bat --port 9000
rem     Terminstart.bat --no-open
rem ============================================================
setlocal
title Terminplanung
cd /d "%~dp0"

echo.
echo   Terminplanung wird gestartet ...
echo.

rem ---- Python suchen -----------------------------------------
set "PY="
where python >nul 2>nul
if %errorlevel%==0 set "PY=python"
if defined PY goto :start_python
where py >nul 2>nul
if %errorlevel%==0 set "PY=py"
if defined PY goto :start_python
goto :start_node

rem ---- Start mit Python --------------------------------------
:start_python
"%PY%" "%~dp0tools\serve.py" %*
set "RC=%errorlevel%"
if not "%RC%"=="0" goto :fehler
goto :eof

rem ---- Start mit Node.js (falls kein Python da ist) ----------
:start_node
where npx >nul 2>nul
if not %errorlevel%==0 goto :keinpython
echo   Python wurde nicht gefunden - starte mit Node.js.
echo.
start "" "http://127.0.0.1:8777/"
npx --yes http-server -p 8777 -a 127.0.0.1 -c-1 "%~dp0"
goto :eof

rem ---- Fehlerfaelle ------------------------------------------
:fehler
echo.
echo   Der Start ist fehlgeschlagen (Code %RC%).
echo   Moegliche Ursachen:
echo     - Python ist nicht installiert
echo     - die Datei tools\serve.py fehlt
echo     - Port 8777 bis 8837 sind alle belegt
echo.
pause
goto :eof

:keinpython
echo.
echo   Weder Python noch Node.js wurden gefunden.
echo.
echo   Bitte Python installieren: https://www.python.org/downloads/
echo   Wichtig: beim Installieren "Add python.exe to PATH" ankreuzen.
echo.
echo   Ohne Installation: die Dateien auf GitHub Pages legen
echo   (Settings - Pages - Deploy from a branch) und die Adresse
echo   im Browser aufrufen.
echo.
pause
goto :eof
