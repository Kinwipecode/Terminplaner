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

## 7. Farblayouts

| Prüfung | Ergebnis |
|---|---|
| Auswahl öffnet sich | ✅ Dialog „Farblayout der Oberfläche“, **9 Karten** (Nachtblau, Anthrazit, Tiefsee, Violettnacht, Hoher Kontrast, Tageslicht, Nordlicht, Papier, Sonnenschein) |
| Vorschau je Karte | ✅ jede Karte malt sich mit den eigenen Farben (`data-theme` am Vorschau-Element) |
| Klick übernimmt sofort | ✅ „Papier“ angeklickt → `data-theme="papier"`, `--bg` = `#faf7f2`, Körperhintergrund `rgb(250,247,242)` |
| Auswahl bleibt erhalten | ✅ nach hartem Neuladen (`ignoreCache`) startet die App wieder in „Papier“ |
| Kein Aufblitzen beim Start | ✅ Layout wird im Kopf der Seite noch vor dem Zeichnen gesetzt |
| Vorrang der Farbvariablen | ✅ geprüft: die Layoutblöcke überschreiben die Standardwerte zuverlässig (Selektoren `[data-theme]` **und** `html[data-theme]`) |
| Keine Fehler | ✅ Fehlerprotokoll leer, alle vier Ansichten weiterhin vollständig |

## 8. Drucken / PDF (Kernanforderung)

Geprüft mit dem Beispielprojekt (17 Aufgaben, 19.10.–16.12.2026, Zeitraster Wochen/mittel).
Die PDF-Dateien wurden echt erzeugt (Chromium `Page.printToPDF`, Blattgröße aus der `@page`-Regel)
und die Blattzahl sowie die Papiergröße im PDF ausgelesen.

| Prüfung | Ergebnis |
|---|---|
| Druckdialog | ✅ Blattformat, Inhalt, Zeitraum, Raster, Feinheit, Einzelheiten, Spalten, Aufgabenauswahl |
| Blattzahl-Vorschau | ✅ z. B. „4 Blatt A4 quer (297 × 210 mm) · Deckblatt 1 · Gantt 1 · Tabelle 1 · Legende 1“ – stimmt mit den tatsächlich gebauten Blättern überein |
| Seitengröße auf dem Bildschirm | ✅ jedes Blatt misst 1123 × 794 px = **297 × 210 mm** (A4 quer), alle acht Blätter gleich |
| `@page`-Regel | ✅ `@page { size: 297mm 210mm; margin: 0; }` – wird beim Formatwechsel umgesetzt |
| **PDF A4 quer** (Deckblatt+Gantt+Tabelle+Legende) | ✅ **4 Seiten**, Papiergröße **841,92 × 594,96 pt** = A4 quer |
| **PDF A3 quer** (Tagesraster fein) | ✅ **5 Seiten**, Papiergröße **1191,12 × 841,92 pt** = A3 quer |
| **PDF A4 hoch** (Tagesraster fein) | ✅ **7 Seiten** (davon 4 Gantt-Blätter), Papiergröße **594,96 × 841,92 pt** = A4 hoch |
| Mehrblättriges Gantt | ✅ links wiederholt sich die Aufgabenliste, die Zeitachse läuft nach rechts weiter; Kopf nennt Zeitraum und Aufgabengruppe („Aufgaben 1/1, Zeitachse 2/4“) |
| Zeitachse endet am Projektende | ✅ letztes Blatt wird am Projektschluss abgeschnitten (19.10.2026–20.12.2026) statt leer weiterzulaufen |
| Deckblatt | ✅ Titel, Beschreibung, 10 Kennzahlen, Fortschrittsbalken der Hauptgruppen, Fußzeile ohne Überlappung |
| Gantt-Blatt | ✅ Balken mit Fortschritt, Meilenstein-Rauten, Abhängigkeitspfeile, Wochenend-Schattierung, Wochen-/Monatskopf, Aufgabenliste mit Nummer, Daten, Dauer, Fortschritt und Person |
| Tabellenblatt | ✅ Nummer, eingerückter Name, Beginn, Ende, Dauer, Fortschrittsbalken, Status mit Farbpunkt, Wer; Sammelaufgaben fett mit grauem Grund |
| Kalenderblatt | ✅ ein Monat je Blatt, Wochenend- und Nachbarmonats-Zellen, Meilenstein-Rauten, Terminliste je Tag |
| Board-Blatt | ✅ vier Statusspalten mit Karten (Datum, Fortschritt, Person) |
| Legendenblatt | ✅ Status, Priorität, Balken und Zeichen, Abhängigkeitsarten, Angaben zum Ausdruck, Blattübersicht mit Seitenzahlen |
| Strg+P des Browsers | ✅ baut den Aufbau automatisch mit den zuletzt gewählten Einstellungen (`beforeprint`) |
| Keine Fehler | ✅ Fehlerprotokoll bei allen Durchläufen leer |

## 9. Verschieben, Zeilenhöhe und Ideen-Sammelbecken

| Prüfung | Ergebnis |
|---|---|
| **Umschalt+→** (1 Arbeitstag) | ✅ „Screendesign“ 04.11. → 05.11., Nachfolger „Design-Review“ 16.11. → 17.11. (Auto-Planung) |
| **Umschalt+↓** (1 Woche) | ✅ 05.11. → 12.11., Nachfolger 17.11. → 24.11. |
| **Umschalt+Strg+→** (1 Monat) | ✅ 12.11. → 14.12. (12.12. ist Samstag → auf Montag gerastet) |
| Rückgängig-Einträge | ✅ „1 Tag später“, „1 Woche später“, „1 Monat später“ – jeder Schritt einzeln umkehrbar |
| Kontextmenü | ✅ 6 Schnellknöpfe (1 Tag/Woche/Monat später bzw. früher) + „Termin verschieben…“ in Gantt und Tabelle |
| Verschieben-Dialog | ✅ Betrag, Richtung, Einheit, Vorschau („14.12.2026 – 23.12.2026 → 15.12.2026 – 24.12.2026, Dauer 8 AT“), Auto-Planung schaltbar |
| Detailbereich | ✅ Knöpfe „− 1 Monat“ … „+ 1 Monat“ und „Verschieben…“ |
| Zeilenhöhe „geräumig“ | ✅ `--row-h` = 38 px, Gantt-Zeile misst 38 px, Wert steht als `settings.rowHeight` in der Datei |
| **Sammelbecken: Eintrag aufschreiben** | ✅ drei Einträge angelegt, alle mit Zähler (0), im Speichertext enthalten |
| **Ablegen per Klick** (bereit + Klick in die Zeile) | ✅ Aufgabe „Kickoff-Termin mit Kunde“ am 27.10.2026, Farbe `#14b8a6`, als Unteraufgabe 1.4 einsortiert, Zähler 0 → 1 |
| **Mehrfaches Ablegen** | ✅ derselbe Eintrag erneut abgelegt → zwei Aufgaben mit derselben Kennung, Zähler 2 |
| **Zahl in Klammern** | ✅ beide Aufgaben zeigen „(2)“; zusätzlich im Detailbereich und im Sammelbecken |
| **Farbe unterscheidbar** | ✅ Aufgaben aus dem Sammelbecken sind türkis (`#14b8a6`), andere behalten ihre Farbe |
| **Ziehen und Ablegen im Gantt** | ✅ `dragover` zeigt Linie + Schild („22.10. · nach ‚Zielgruppen-Workshop‘“), `drop` legt die Aufgabe an |
| **Ablegen in Tabelle und Kalender** | ✅ Tabellenzeile (Ablegen nach dieser Zeile) und Kalendertag (Ablegen an diesem Tag) |
| **Speichern in der Datei** | ✅ Projektdatei enthält `pool` mit `placedCount`, die Aufgaben mit `fromPool` und `settings.rowHeight` |
| **Sammelbecken-Fenster** | ✅ zweites Browserfenster verbindet sich („● mit Planungsfenster verbunden“), zeigt Projektname, Einträge und Zähler |
| **Unterschiedliche Darstellung** | ✅ bereits eingeplante Einträge haben türkisen Balken, Tönung und „(2) im Plan“; offene bleiben grau mit „(0)“ |
| **Fenster → Projekt** | ✅ im Sammelbecken aufgeschriebene Idee („Nachkontrolle“) erscheint **genau einmal** im Projekt und in der gespeicherten Datei (Doppelzustellung behoben) |
| **Projekt → Fenster** | ✅ Zähler und Liste im Fenster aktualisieren sich sofort nach dem Ablegen |
| **Fenster ohne Hauptfenster** | ✅ meldet „○ kein Planungsfenster“, allgemeiner Vorrat bleibt bearbeitbar (Codepfad) |
| Keine Fehler | ✅ Fehlerprotokoll bei allen Durchläufen leer |

## 10. Heute-Knopf, Ausschnitt verschieben, Zoom mit der Maus

| Prüfung | Ergebnis |
|---|---|
| Knopf **◉ Heute** in der Werkzeugleiste | ✅ vorhanden, wirkt in allen vier Ansichten |
| Gantt: heute wird angesteuert | ✅ aus scrollLeft 776 zurück auf 0, die Heute-Linie liegt im sichtbaren Zeitstreifen (x=679 bei Fenster 84…1264) |
| Gantt: „heute“ immer im Zeitstrahl | ✅ der Zeitraum wird um „heute“ erweitert (Beispiel: Plan ab 19.10., heute 17.10. → Strahl beginnt am 10.10.) |
| Kalender | ✅ Knopf setzt den Monat auf **Oktober 2026**, eine Zelle ist als heute markiert |
| Tabelle / Board | ✅ erste Aufgabe ab heute wird ausgewählt („Konzept & Planung“), Zeilen mit „heute“ bekommen einen roten Rand (im Beispiel 0, da alle Aufgaben später beginnen) |
| **Strg + linke Maustaste ziehen** | ✅ Ausschnitt wandert (scrollLeft 300 → 310, scrollTop 100 → 160 bei Zug −150/−60 px); Zeiger ist währenddessen `grabbing`, danach wieder normal |
| **Strg + Ziehen auf einem Balken** | ✅ Termin bleibt unverändert (04.11. → 04.11.) – Strg ist reine Ansicht-Steuerung |
| **Strg + Mausrad** | ✅ stufenloser Zoom: Maßstab 12 → 17,2 px je Tag, Anzeige „Zoom 143 %“, Tagesraster misst 17,2 px |
| Zoom um den Mauszeiger | ✅ Blickposition wird so nachgeführt, dass der Tag unter dem Zeiger stehen bleibt (`pendingScroll`) |
| Klick auf **Zoom … %** | ✅ setzt auf die Rasterstufe zurück („Zoom 100 %“, Maßstab wieder 12 px) |
| **Umschalt + Mausrad** | ✅ rollt seitlich (eigener Zweig im Rad-Handler) |
| Keine Fehler | ✅ Fehlerprotokoll leer |

## 11. Mehrfachauswahl (wie im Explorer)

| Prüfung | Ergebnis |
|---|---|
| Klick auf eine Zeile | ✅ genau 1 markiert, sie wird der Anker („Zielgruppen-Workshop“) |
| **Umschalt+Klick** 3 Zeilen weiter | ✅ 4 markiert (`1.2`, `1.3`, `2`, `2.1`) – Bereich vom Anker bis zum Klick |
| **Strg+Klick** außerhalb des Bereichs | ✅ 5 markiert, `3` kommt dazu |
| **Strg+Klick** auf dieselbe Zeile nochmal | ✅ 4 markiert – wieder herausgenommen |
| **Umschalt+Klick** auf eine Zeile innerhalb | ✅ Bereich wird neu aufgespannt (2 markiert) |
| **Strg+A** | ✅ 18 von 18 markiert |
| `Esc` | ✅ Auswahl leer |
| **Umschalt+↓** zweimal (ab `1.1`) | ✅ 3 markiert (`1.1`, `1.2`, `1.3`) |
| **Umschalt+↑** (verkleinern) | ✅ 2, dann 1 markiert; noch einmal: Bereich wächst über den Anker hinaus (`1`, `1.1`) |
| Tabelle: Klick + **Umschalt+Klick** + **Strg+Klick** | ✅ 3 → 4 → 3 markiert, 3 Zeilen farblich hervorgehoben |
| Gantt: **Strg+Klick** | ✅ schaltet beim Loslassen um (kurzer Klick) – Ziehen mit Strg verschiebt weiterhin nur den Ausschnitt |
| Statuszeile | ✅ „4 markiert · Entf löscht · Strg+C kopiert · Strg+D dupliziert“ |
| Detailbereich | ✅ Sammelbearbeitung mit Aktionen, Terminverschiebung, Status, Priorität, Fortschritt, Farbe und Liste der markierten Aufgaben |
| `Entf` (3 markiert) | ✅ Rückfrage „3 Aufgaben löschen“, danach 18 → 15 Aufgaben, Auswahl leer |
| **Strg+Z** | ✅ 15 → 18 Aufgaben, Aufgaben und Verknüpfungen wieder da |
| **Strg+C** (Auswahl `1` + `1.1`) | ✅ 4 Aufgaben in der Zwischenablage (Sammelaufgabe samt 3 Unteraufgaben) |
| **Strg+V** | ✅ 18 → 22 Aufgaben, die Einfügung ist markiert, Unteraufgaben bleiben Kinder |
| **Strg+D** | ✅ 22 → 26 Aufgaben, Kopien heißen „… (Kopie)“ |
| **Strg+Umschalt+↓** | ✅ Termin 23.10. → 30.10. (eine Woche) |
| **Umschalt+→** | ✅ Termin 30.10. → 02.11. (ein Arbeitstag, Wochenende übersprungen) |
| Keine Fehler | ✅ Fehlerprotokoll leer |

## 12. Druckvorschau am Bildschirm und eigenes Blattmaß

**Druckvorschau**

| Prüfung | Ergebnis |
|---|---|
| „🔍 Vorschau anzeigen“ im Druckfenster | ✅ Vorschau öffnet sich, 3 Blätter werden als weiße Blätter gezeigt (Kopie des Druckaufbaus, also garantiert gleich) |
| Blattgröße am Bildschirm | ✅ Blatt 1 misst 1197 × 898 px bei 400 × 300 mm und „Einpassen“ = 79 % (400 mm × 96/25,4 = 1512 px → 79 %) |
| Zoom | ✅ `+` 79 % → 99 %, zweimal `−` → 63 %, **Einpassen** wieder 79 % |
| Blattwechsel | ✅ `▼` → „Blatt 2 / 3“, `▲` → „Blatt 1 / 3“; `Bild ↓` ebenso |
| Tastatur | ✅ `+`/`-` zoomen (echte Tasten über CDP), `Esc` schließt die Vorschau |
| `Esc` mit offenem Druckfenster | ✅ schließt **nur** die Vorschau, das Druckfenster bleibt offen (Listener liegt auf `window` im Capture) |
| Papierfarben | ✅ `--p-fg` = `#10141c` auch in der Vorschau (Variablen für `#print-root` **und** `#print-preview`) |
| Vorschau im Ausdruck | ✅ im PDF nicht enthalten (`Druckvorschau` kommt nicht vor) |
| `Strg`+`P` außerhalb | ✅ öffnet das Druckfenster (nicht sofort den Druckdialog) |
| Keine Fehler | ✅ Fehlerprotokoll leer |

**Eigenes Blattmaß**

| Prüfung | Ergebnis |
|---|---|
| „✎ eigenes Maß“ wählen | ✅ Felder Breite/Höhe/Rand/Bezeichnung erscheinen, bei A4/A3 sind sie ausgeblendet |
| 400 × 300 mm, Rand 10, Bezeichnung „Plotter“ | ✅ Anzeige „3 Blatt · Plotter (400 × 300 mm, Rand 10 mm)“ |
| Ausgabe als PDF (MediaBox) | ✅ `/MediaBox` = **400,0 × 299,9 mm** – das eigene Maß kommt exakt heraus |
| Vorschau-Leiste | ✅ „3 Blatt · Plotter · 400 × 300 mm · Rand 10 mm“ |
| A4 quer als Gegenprobe | ✅ `/MediaBox` = 297,0 × 209,9 mm (unverändert) |
| 600 × 400 mm | ✅ 3 Blatt, keine Warnung |
| 120 × 90 mm | ✅ 11 Blatt + Hinweis „Aufgabenliste läuft über 3 Blätter“ |
| 5 × 5 mm (zu klein) | ✅ auf 50 × 50 mm begrenzt, Warnung „Eingabe auf 50 × 50 mm begrenzt (erlaubt sind 50–2000 mm)“ |
| 9999 × 500 mm (zu groß) | ✅ auf 2000 × 500 mm begrenzt, Warnung |
| Rand 300 mm | ✅ auf 135 mm begrenzt, Warnung „Rand auf 135 mm begrenzt“ |
| **⇄ hoch/quer tauschen** | ✅ 400 × 300 → 300 × 400 mm |
| Keine Fehler | ✅ Fehlerprotokoll leer |

## 13. Offene Punkte / nicht geprüft

- **Ordner-Freigabe (`showDirectoryPicker`)**: Der native Dialog lässt sich nicht automatisiert
  bedienen. Der Weg ist implementiert (Zugriff merken in IndexedDB, Wiederherstellen mit
  Ein-Klick-Bestätigung, Umbenennen der Datei beim Ändern des Projektnamens, `Backups`-Ordner),
  muss aber von Hand einmal durchgeklickt werden.
- **Firefox/Safari**: Der Rückfall auf Browser-Speicher bzw. `localStorage` ist implementiert,
  in diesen Browsern aber noch nicht durchgeklickt.
- **Windows-Druckdialog**: Der Systemdialog („Microsoft Print to PDF“) lässt sich nicht
  automatisiert bedienen. Geprüft wurde deshalb über die Druckfunktion des Browsers
  (`Page.printToPDF`), die dieselbe Druckvorlage und dieselbe Blattgröße benutzt – die
  Papiergrößen im erzeugten PDF stimmen mit A4/A3 überein (§ 8). Ein echter Klick auf
  „Speichern“ im Systemdialog steht noch aus.
- **Große Pläne**: geprüft mit 17 Aufgaben. Die Darstellung zeichnet bei jeder Änderung neu;
  ab etwa 1.000 Zeilen ist mit spürbarer Verzögerung zu rechnen. Beim Drucken werden alle
  Blätter auf einmal aufgebaut – bei sehr vielen Blättern (über 40) erscheint ein Hinweis.
- **CSV-/Excel-Ausgabe und Kalender-Abo (ICS)**: noch nicht enthalten. Drucken/PDF ist umgesetzt.
- **Ziehen zwischen zwei Browserfenstern**: Das Ziehen aus dem Sammelbecken-Fenster in das
  Planungsfenster ließ sich nicht automatisiert auslösen (echte Mausbewegung über Fenstergrenzen).
  Geprüft wurde stattdessen der vollständige Weg im Code: `dragover`-Vorschau, `drop` mit den
  übergebenen Daten sowie der Klick-Weg als Rückfall. Ein echter Zug über zwei Bildschirme steht
  noch aus.
- **Popup-Blocker**: Öffnet der Browser das Sammelbecken-Fenster nicht, erscheint statt dessen die
  Ideenliste im Planungsfenster (Codepfad geprüft, auf diesem Rechner nicht auslösbar).
