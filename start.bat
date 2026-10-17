@echo off
rem ── Terminplanung lokal starten ──────────────────────────────
rem Startet einen kleinen Webserver im Projektordner und öffnet
rem die App im Browser. Der Server ist nötig, weil die App aus
rem JavaScript-Modulen besteht.
rem Macht dasselbe wie Terminstart.bat - beide Namen funktionieren.
call "%~dp0Terminstart.bat" %*

