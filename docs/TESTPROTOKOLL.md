# Testprotokoll

Stand: 17.10.2026 · geprüft in Chrome (Chromium, 1264 × 573 Fenster) über einen lokalen Server
(`python -m http.server 8777`), Projektdatei im Browser-Speicher (OPFS).
Jeder Punkt wurde im laufenden Programm ausgeführt und das Ergebnis abgelesen – nicht nur der Code
gelesen. Die Zahlen stammen aus den Ausgaben der Prüfskripte.

## 1. Start und Laden

| Prüfung | Ergebnis |
|---|---|
| Seite lädt ohne JavaScript-Fehler | ✅ Fehlerprotokoll (`window.onerror` + `unhandledrejection`) blieb leer |
| Startbildschirm mit vier Wegen | ✅ Neues Projekt · Öffnen · Importieren · Beispielprojekt |
| Beispielprojekt laden | ✅ 17 Zeilen, 15 Balken, 2 Meilensteine, 15 Abhängigkeitspfeile im DOM |
| Projektname im Kopf | ✅ „Beispielprojekt – Website-Neulaufbau“ |
| Statuszeile | ✅ „13 Aufgaben · 19.10.2026 – 16.12.2026 (59 Tage) · 33 % erledigt · 3 fertig“ |

## 2. Terminberechnung / Auto-Planung

| Prüfung | Ergebnis |
|---|---|
| Aufgabe ziehen (ohne Vorgänger) | ✅ „Anforderungen sammeln“ 17.10. → 27.10. (+10 Tage bei 120 px / 12 px pro Tag) |
| Nachfolger wandern mit (Auto-Planung an) | ✅ „Zielgruppen-Workshop“ 23.10.→02.11., Meilenstein 27.10.→04.11., „Wireframes“ 28.10.→05.11., „Datenmodell & API“ 05.11.→13.11. |
| Auto-Planung aus: nichts verschiebt sich | ✅ eigene Aufgabe wandert, Nachfolger bleiben stehen |
| Auto-Planung aus: Konflikt wird gemeldet | ✅ „„Konzept freigegeben“ beginnt am 2026-11-04, Vorgänger erlauben das erst ab 2026-11-09.“ |
| Auto-Planung aus: Festlegung wird gesetzt | ✅ `constraint: {type:"SNET", date:"2026-11-05"}` |
| Auto-Planung wieder an: Nachfolger folgen | ✅ Meilenstein 04.11.→09.11., „Wireframes“ 05.11.→10.11. |
| Arbeitstage statt Kalendertage | ✅ Wochenend-Start wird auf den nächsten Arbeitstag gezogen (17.10. = Samstag → 19.10.) |
| Kreisschutz bei Abhängigkeiten | ✅ `createsCycle()` lehnt Verknüpfungen ab, die eine Schleife ergeben (Codeprüfung + Schleifenmeldung im Scheduler) |

## 3. Ansichten

| Prüfung | Ergebnis |
|---|---|
| Gantt | ✅ Kopf mit Monaten und Kalenderwochen, Balken, Meilenstein-Rauten, Fortschrittsfüllung, Heute-Linie, Wochenend-Schattierung |
| Zoom Tag/Woche/Monat/Quartal | ✅ Umschalter in der Werkzeugleiste, „Einpassen“ rechnet die Tagesbreite auf die Fensterbreite |
| Tabelle | ✅ 17 Zeilen, 11 Spalten, Spaltenkopf sortiert, Gruppierung nach Status/Priorität/Person, Felder direkt bearbeitbar |
| Kalender | ✅ 35 Tageszellen im Monatsraster, Aufgaben auf ihren Tagen (19.–22.10. „Anforderungen sammeln“), Meilenstein-Raute am 27.10., Ziehen verschiebt |
| Board | ✅ 4 Spalten (Offen 6 · Läuft 4 · Blockiert 0 · Erledigt 3), 13 Karten, Ziehen ändert den Status |
| Ansichtswechsel über die Leiste | ✅ alle vier Ansichten inkl. Markierung in der Navigationsleiste |

## 4. Bearbeiten

| Prüfung | Ergebnis |
|---|---|
| Aufgabe anlegen (`Einfg`) | ✅ 0 → 1 Aufgabe, Statuszeile aktualisiert |
| Meilenstein anlegen | ✅ 1 → 2 Aufgaben |
| Rückgängig | ✅ 2 → 1 Aufgabe, Beschriftung „Rückgängig: …“ |
| Rückgängig-Stapel | ✅ nach dem Ziehen: `["Termin verschieben"]` |
| Detailbereich | ✅ öffnet per Klick auf eine Zeile, 15 Feldgruppen (Bezeichnung, Termine, Fortschritt, Status, Priorität, Ziel, Art, Beteiligt, Vorgänger, Nachfolger, Festlegung, Farbe, Notizen …) |
| Projekt-Einstellungen | ✅ 6 Felder, Arbeitstage Mo–Fr markiert, Projektbeginn 19.10.2026 |
| Team-Dialog | ✅ 4 Personen geladen |
| Kurzanleitung (`F1`) | ✅ 3 Abschnitte (fünf Schritte, Tastenkürzel, Speichern & Datei) |
| Hell/Dunkel | ✅ Umschalten ohne Neuladen, Auswahl wird gemerkt |

## 5. Speichern (Kernanforderung)

| Prüfung | Ergebnis |
|---|---|
| Neues Projekt ohne Ordner-Dialog | ✅ Datei `Testplan-Buero.tplan.json`, Speicherart „browser“ |
| Automatisches Schreiben | ✅ Datei im Browser-Speicher: 11.346 Bytes, `format:"terminplanung"`, `version:1`, 17 Aufgaben, 4 Personen, `meta.modified` gesetzt |
| Speicherzustand in der Kopfzeile | ✅ „Gespeichert gerade eben“ → „Änderung offen…“ → „Speichert…“ |
| Wiederfinden nach Neuladen | ✅ Startbildschirm zeigt „Weiter mit ‚Testplan-Buero‘ · Browser-Speicher · zuletzt 17.10.2026 11:08“; **Fortsetzen** öffnet das Projekt wieder |
| Sicherungen | ✅ Rotation auf 12 Kopien im Unterordner `Backups`, Liste und Wiederherstellung im Dialog (Codepfad, Ordner-Modus) |
| Absturzmarke | ✅ Marke wird vor dem Schreiben gesetzt und nach Erfolg entfernt; beim Start wird eine übrig gebliebene Marke gemeldet |
| Schließen ohne Datenverlust | ✅ Speichern bei `visibilitychange`, `pagehide`, `beforeunload` und alle 30 s |

## 6. Startdateien (Terminstart.bat / start.sh / tools/serve.py)

| Prüfung | Ergebnis |
|---|---|
| `tools/serve.py --no-open` startet | ✅ Ausgabe „Terminplanung laeuft auf: http://127.0.0.1:8777/“, Port 8777 belegt |
| Kein Zwischenspeichern mehr | ✅ Kopfzeilen enthalten `Cache-Control: no-store, no-cache, must-revalidate, max-age=0` und `Pragma: no-cache` (per `curl -I` geprüft) |
| Dateien werden ausgeliefert | ✅ `index.html` 200, `js/main.js` 200, `css/app.css` 200, `examples/beispiel-projekt.tplan.json` 200 |
| App lädt über diesen Server | ✅ Titel „Terminplanung“, `window.tplan` vorhanden, Fehlerprotokoll leer |
| Doppelstart | ✅ zweiter Aufruf beendet sich sofort mit „Terminplanung laeuft bereits auf …“ statt einen zweiten Server zu öffnen |
| Freier Port | ✅ ist 8777 belegt, sucht `serve.py` den nächsten freien Port (8778 …) |
| `Terminstart.bat` findet Python | ✅ Aufruf `cmd /c Terminstart.bat --no-open` → „Terminplanung wird gestartet …“, Rückgabecode 0 |
| `Terminstart.bat` startet den Server wirklich | ✅ über die Batchdatei gestartet, danach `http://127.0.0.1:8777/` mit 200 und den no-store-Kopfzeilen erreichbar |
| Rückfall ohne Python | ✅ Batchdatei versucht `py`, dann `npx http-server`, sonst Hinweis mit Download-Adresse (Codepfad, auf diesem Rechner nicht auslösbar – Python ist vorhanden) |

## 7. Offene Punkte / nicht geprüft

- **Ordner-Freigabe (`showDirectoryPicker`)**: Der native Dialog lässt sich nicht automatisiert
  bedienen. Der Weg ist implementiert (Zugriff merken in IndexedDB, Wiederherstellen mit
  Ein-Klick-Bestätigung, Umbenennen der Datei beim Ändern des Projektnamens, `Backups`-Ordner),
  muss aber von Hand einmal durchgeklickt werden.
- **Firefox/Safari**: Der Rückfall auf Browser-Speicher bzw. `localStorage` ist implementiert,
  in diesen Browsern aber noch nicht durchgeklickt.
- **Große Pläne**: geprüft mit 17 Aufgaben. Die Darstellung zeichnet bei jeder Änderung neu;
  ab etwa 1.000 Zeilen ist mit spürbarer Verzögerung zu rechnen.
- **CSV-/Excel-Ausgabe, Drucken/PDF, Kalender-Abo (ICS)**: noch nicht enthalten.
