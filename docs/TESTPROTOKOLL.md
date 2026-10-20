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

## 13. Projekt schließen (ohne die App zu schließen)

| Prüfung | Ergebnis |
|---|---|
| Knopf `🚪` in der Leiste | ✅ vorhanden, Titel „Projekt schließen – zurück zur Startseite (die App bleibt offen)“ |
| Vorher eine Änderung (Aufgabe angelegt), `dirty` = true | ✅ 19 Aufgaben, Änderung offen |
| Klick auf `🚪` | ✅ Startbildschirm erscheint, `#app` versteckt, kein Fehler |
| Zustand danach | ✅ `store.project` = null, Autospeicher-Intervall beendet, `dirty` = false, Dateiname geleert |
| Letzte Änderung wirklich in der Datei | ✅ gelesen aus `Beispielprojekt-Website-Neulaufbau.tplan.json`: 19 Aufgaben, „Testaufgabe …“ enthalten |
| Startbildschirm | ✅ Kasten „Weiter mit „Beispielprojekt-Website-Neulaufbau“ · Browser-Speicher · zuletzt 17.10.2026 20:05“ |
| **Fortsetzen** | ✅ Projekt wieder offen, 19 Aufgaben, Autospeichern wieder aktiv, Dateiname gesetzt |
| Zweites Schließen (ohne Änderung) | ✅ sauber, keine Fehler |
| Nach dem Schließen | ✅ kein Schreibvorgang mehr (Dateiname leer ⇒ `flush()` steigt aus) |
| Keine Fehler | ✅ Fehlerprotokoll leer |

## 14. Dauer einer Idee (freiwillig) im Sammelbecken

| Prüfung | Ergebnis |
|---|---|
| Feld je Eintrag | ✅ „Dauer [Zahl] [Tag(e)/Woche(n)/Monat(e)]“ in **beiden** Oberflächen: eigenes Fenster (`sideboard.html`) und Ideen-Dialog im Hauptfenster |
| Leer lassen | ✅ Anzeige „ohne Angabe“, gespeichert wird `duration: 0, unit: 'day'` – kein Muss, kein Fehler |
| 3 Wochen eintragen | ✅ Anzeige „= 15 Arbeitstage“, Eintrag wird hervorgehoben (`is-set`) |
| 2 Monate (allgemeiner Vorrat, eigenes Fenster) | ✅ `localStorage` enthält `{"d":2,"u":"month"}`, Anzeige „= 40 Arbeitstage“ |
| Übertragung ans Hauptfenster | ✅ Nachricht über den BroadcastChannel (`type: 'update'`) setzt die Dauer im Projekt – geprüft mit `{duration: 2, unit: 'month'}` |
| Einplanen **mit** Dauer | ✅ Idee mit 3 Wochen, Start 02.11.2026 → Aufgabe 02.11.–**20.11.2026**, `duration: 15`, Farbe türkis |
| Einplanen **ohne** Dauer | ✅ Idee ohne Angabe → 02.11.–02.11.2026, `duration: 1` |
| Speichern in der Projektdatei | ✅ `duration`/`unit` stehen im JSON des Sammelbecken-Eintrags (Fehler dabei gefunden und behoben: `serializeProject` ließ die beiden Felder weg) |
| Neu laden (Rundreise serialize → migrate) | ✅ 3 Wochen bleiben erhalten |
| Alte Projektdatei ohne die Felder | ✅ Beispiel-Datei hat kein `duration`-Feld → nach der Migration `0`/`day`, kein Fehler |
| Beispieldaten | ✅ `examples/beispiel-projekt.tplan.json` zeigt jetzt „Schulung … 2 Tage“ und „Foto-Shooting … 1 Woche“ |
| Keine Fehler | ✅ Fehlerprotokoll leer |

## 15. Ebene beim Anlegen neuer Aufgaben (Sammelaufgabe)

| Prüfung | Ergebnis |
|---|---|
| Ausgangslage | ✅ leeres Projekt, Sammelaufgabe anlegen (sie wird markiert), dann zweimal „＋ Aufgabe“ |
| Ebene danach | ✅ alle drei Zeilen `parentId: null` – „Neue Aufgabe“ und „Dritte“ sind **nicht** in der Sammelaufgabe |
| Termine | ✅ Sammelaufgabe 19.10., neue Aufgaben 20.10. und 21.10. (jeweils nach dem Ende der markierten Zeile) |
| Bewusstes Unterordnen | ✅ `addTask({parentId: Sammelaufgabe})` + `indent` gesetzt: `parentId` = Sammelaufgaben-ID (Wege über Kontextmenü und Detailbereich bleiben also erhalten) |
| Keine Fehler | ✅ Fehlerprotokoll leer |

## 16. Detailbereich in einem eigenen Fenster

Standard = **an**: der Bereich steht sofort im Park (`#detail-park`, unsichtbar), der Plan ist
1180 px breit statt 840. Fehlerprotokoll über alle Prüfungen leer.

| Prüfung | Ergebnis |
|---|---|
| Start | ✅ Bereich im Park, Knopf **🗗 Detail** hervorgehoben (`is-active`), Planbreite 1180 px, Bereichsbreite 0 |
| **Erstes Markieren** (echter Mausklick auf eine Gantt-Zeile, `Input.dispatchMouseEvent`) | ✅ Fenster ging von selbst auf (`detail.html`), 37 Felder darin, im Hauptfenster liefert `getElementById('detail')` `null` |
| Fenster schließen | ✅ Bereich wanderte **in den Park** (nicht in den Plan): Bereichsbreite 0, Planbreite bleibt 1180 px |
| Nächster Klick auf eine **andere** Zeile | ✅ Fenster wieder offen, zeigt „Wireframes“ |
| Klick auf **dieselbe** Zeile nach dem Schließen | ✅ Fenster wieder offen (Markierung ändert sich nicht – deshalb hängt es auch am `select`-Ereignis, nicht nur am Wechsel) |
| Knopf **＋ Aufgabe** (echter Klick) | ✅ neue Aufgabe markiert und Fenster automatisch offen |
| Schalter **🗗 Detail** (echter Klick) | ✅ Betrieb aus: Bereich als rechte Spalte im Plan (340 px), Knopf nicht mehr hervorgehoben, Fenster zu |
| Schalter noch einmal | ✅ Betrieb an: Fenster offen, Planbreite wieder 1180 px, Knopf hervorgehoben |
| **Programm beenden** (`beforeunload`) | ✅ Fenster geschlossen (`isDetached()` false) |
| Projekt schließen (`🚪`) bei offenem Fenster | ✅ Ziel `detail.html` aus der Zielliste verschwunden, Startbildschirm da, Bereich im Park |
| Bedienen im Fenster | ✅ Bezeichnung geändert → `store.selected.name` sofort geändert; Markierungswechsel im Hauptfenster folgt im Fenster (Einzel 39 Felder, Mehrfach „2 Aufgaben ausgewählt“ 34 Felder, Kopf „◆ Meilenstein“) |
| Popup-Blocker (nachgestellt: `window.open = () => null`) | ✅ Kein Fehler; Bereich wird sichtbar in den Plan geholt, Hinweis „Fenster wurde blockiert – Bitte Pop-ups für diese Seite erlauben …“ (nur einmal je Sitzung) |
| Fensterschließen ohne Betriebsart „an“ | ✅ Bereich bleibt im Plan (kein Park) |
| Position | ✅ `tplan.detailwindow.pos` wird beim Verschieben gemerkt; (0,0)-Meldungen werden verworfen, damit das Fenster nicht in die Ecke springt |
| Farblayout | ✅ Wechsel auf „Sonnenschein“ wirkte sofort im Fenster (`data-theme` = `sonne`, Fläche hell) |
| Größe im Fenster | ✅ Bereich füllt es (784 × 401 px bei 784 × 470 px Fenster), kein Rand am `body` |
| Keine Fehler | ✅ Fehlerprotokoll leer |
| **Nicht prüfbar hier** | ⚠️ Die Vorabstelle auf den **zweiten Bildschirm** (`screen.isExtended`, `left = availLeft + availWidth`): der Prüfbrowser hat nur einen Bildschirm (800 × 800), der Zweig lief deshalb nicht. Ebenso bleibt echtes Verschieben von Hand mit zwei Bildschirmen offen |

## 17. Versionsnummer in der App

| Prüfung | Ergebnis |
|---|---|
| Statuszeile unten rechts | ✅ „Version 01“, sichtbar (`width > 0`), bei x = 1196 ganz rechts, durch Trennlinie von der Dateiangabe abgesetzt |
| Startbildschirm | ✅ „Version 01“ in der Fußzeile des Kastens |
| Kurzanleitung (`F1`) | ✅ „Version 01“ als letzte Zeile unter allen Abschnitten |
| Detailfenster (`detail.html`) | ✅ „Version 01“ unter dem Hinweis oben |
| Ideen-Fenster (`sideboard.html`) | ✅ „Version 01“ unter dem Projektnamen im Kopf |
| Eine einzige Quelle | ✅ `js/version.js` (`APP_VERSION = '01'`, `versionLabel()`) – die Seiten holen sich den Text per `import` |
| Keine Fehler | ✅ Fehlerprotokoll leer |

## 18. Tastenkürzel bei vorgeschaltetem Detailfenster (Nutzermeldung)

**Meldung:** „Das Verschieben der Aufgaben mit den Pfeiltasten funktioniert jetzt nicht mehr.“

**Ursache:** Der Detailbereich liegt seit § 16 standardmäßig in einem **eigenen Fenster**, und
`openDetailWindow()` holt es beim Öffnen nach vorn (`w.focus()`) – das passiert bei jeder
Markierung. Das Planungsfenster hört Tastendrücke aber nur in **seinem** Dokument
(`document.addEventListener('keydown')`). Stand das Detailfenster vorn, kam der Tastendruck dort an
und blieb liegen: keine Wirkung im Plan. Nachgestellt: derselbe Tastendruck (Umschalt+→) im
Popup-Dokument → Start blieb `2026-10-19`; im Hauptfenster → `2026-10-20`.

**Behebung:** `attachKeyBridge(win)` in `js/ui/detailwindow.js` hängt beim Umhängen des Bereichs
einen Zuhörer ins Popup-Dokument, der den Tastendruck als `KeyboardEvent` ins Planungsfenster
weitergibt. Ausgenommen sind Drucke, die einem **Eingabefeld** im Detailbereich gelten (dort wird
getippt). Verbraucht das Planungsfenster den Druck (`dispatchEvent` → `false`), wird auch im Popup
die Standardwirkung unterdrückt (sonst rollt das Fenster dabei).

| Prüfung | Ergebnis |
|---|---|
| Ausgangslage | ✅ Beispielprojekt, echte Maus auf eine Gantt-Zeile → Detailfenster ging auf (wie beim Nutzer) |
| Tastendruck im Popup **vor** der Behebung | ✅ Ursache bestätigt: `2026-10-19` → `2026-10-19` (unverändert) |
| Tastendruck im Hauptfenster (Gegenprobe) | ✅ `2026-10-19` → `2026-10-20` (Kürzel war also nicht grundsätzlich kaputt) |
| **Umschalt+→ im Detailfenster, nach der Behebung** | ✅ `2026-10-19` → `2026-10-20` (ein Arbeitstag) |
| **Umschalt+← im Detailfenster** | ✅ `2026-10-20` → `2026-10-19` (zurück) |
| **Umschalt+Strg+→ im Detailfenster** | ✅ einen Monat: `2026-10-20` → `2026-11-20` |
| **Alt+↓ im Detailfenster** | ✅ Zeile verschoben (Reihenfolge der sichtbaren Aufgaben geändert) |
| Tippen in einem Feld des Detailbereichs | ✅ Feld `INPUT` fokussiert, Umschalt+→ → Start **unverändert** (nichts verschoben) |
| Standardwirkung im Popup | ✅ `dispatchEvent` → `false`, also verbraucht und unterdrückt |
| Keine Fehler | ✅ Fehlerprotokoll leer |
| **Nicht prüfbar hier** | ⚠️ Echter Tastendruck von Hand in einem zweiten Browserfenster (Fokuswechsel zwischen Fenstern) – im Prüfbrowser zeigt `document.hasFocus()` in beiden Fenstern `true`; nachgestellt über denselben Ereignisweg, den die Tastatur nimmt |

## 19. Sperren mit dem Schloss (neue Aufgabe)

Geprüft über den echten Bedienweg (Leistenknopf mit echtem Mausklick, Tastatur, Kontextmenü,
Klick auf das Symbol), Zustand jeweils aus `store.project.tasks` abgelesen. Fehlerprotokoll über
alle Prüfungen leer.

| Prüfung | Ergebnis |
|---|---|
| **Sperren** über den Leistenknopf **🔒 Sperren** (echter Klick, Aufgabe markiert) | ✅ `locked: true` in der Aufgabe; Hinweis „🔒 Gesperrt – … lässt sich jetzt nicht mehr ändern …“ |
| Symbol in **allen vier Ansichten** | ✅ Gantt: `🔒` neben dem Namen, Zeile `.g-left.is-locked`, Balken `.bar.is-locked` (gestrichelt); Tabelle: `🔒` in der Namensspalte + `tr.is-locked`; Kalender: `🔒` in der Karte + `.cal-ev.is-locked`; Board: `🔒` in der Kartentitel + `.card.is-locked` |
| Symbol im **Ausdruck** | ✅ Druckvorschau baut weiter 3 Blätter, `🔒` erscheint im `#print-root` |
| **Verschieben per Tastatur** (`Umschalt`+`→`) | ✅ abgelehnt: Start bleibt `2026-10-19`, Meldung „„Anforderungen sammeln“ ist gesperrt – verschieben ist nicht möglich. Zuerst das Schloss öffnen.“ (genau **eine** Meldung je Aktion) |
| **Ziehen am Balken** (Gantt) | ✅ abgelehnt, Termin unverändert |
| **Ziehen im Kalender** (auf einen anderen Tag) | ✅ abgelehnt, Termin unverändert |
| **Löschen** (`Entf`) | ✅ abgelehnt, Aufgabenanzahl unverändert |
| **Umbenennen** über das Feld im Detailbereich | ✅ abgelehnt, Name unverändert |
| **Datumsfeld** (Beginn) im Detailbereich | ✅ abgelehnt, Termin unverändert |
| **Status/Fortschritt** (Board `setStatus`, Detail-Schieber) | ✅ abgelehnt |
| **Unteraufgabe in eine gesperrte Sammelaufgabe** | ✅ abgelehnt („eine Unteraufgabe hinzufügen ist nicht möglich“) |
| **Idee aus dem Sammelbecken** in eine gesperrte Sammelaufgabe legen | ✅ abgelehnt (`null`), Meldung |
| **Gesperrter Nachfolger:** gesperrten Nachfolger „Zielgruppen-Workshop“ setzen, Vorgänger verschieben | ✅ gar nicht verschoben; Meldung nennt **den Nachfolger** („„Zielgruppen-Workshop“ ist gesperrt …“); Nachfolger unverändert |
| **Gesperrte Sammelaufgabe:** Unteraufgabe verschieben | ✅ abgelehnt; Meldung nennt die **Sammelaufgabe** |
| Schloss öffnen, dann verschieben | ✅ `2026-10-19` → `2026-10-20`, Nachfolger wanderte mit (`2026-10-23` → `2026-10-26`), keine Meldung |
| **Rechnen mit gesperrtem Termin:** Dauer des Vorgängers um 10 AT verlängern (Vorgänger nicht gesperrt) | ✅ gesperrter Termin blieb stehen (`2026-11-05`), Warnung „„Screendesign“ ist gesperrt und bleibt am 2026-11-05 – berechnet wäre 2026-11-19.“, Aufgabe als Konflikt markiert |
| **Schloss öffnen** per Klick auf das `🔒` neben dem Namen | ✅ `locked: false`, Meldung „🔓 Schloss geöffnet – „Design“ ist wieder änderbar.“ |
| **Kontextmenü** (Rechtsklick auf gesperrte Zeile) | ✅ Eintrag „🔓 Schloss öffnen“ (bzw. „🔒 Sperren“) vorhanden; bei Mehrfachauswahl „N Schlösser öffnen“ / „N Aufgaben sperren“ |
| **Rückgängig** (`Strg`+`Z`) nach dem Sperren/Öffnen | ✅ stellt den vorigen Zustand her |
| **Speichern und Laden**: `serialize()` → `migrateProject` → `load()` | ✅ `locked` steht in der Datei und ist nach dem Laden wieder gesetzt („Design“, „Screendesign“) |
| **Kopien**: Duplizieren, Kopieren/Einfügen einer gesperrten Aufgabe | ✅ Kopie ist **ungesperrt** („Design (Kopie)“, `locked: false`) – so gewollt und im Handbuch vermerkt |
| Gegenprobe ohne Schloss (Regression) | ✅ `Einfg` (18 → 19 Aufgaben), `Umschalt`+`→` (`19.10.` → `20.10.`), `Alt`+`←` ausrücken, Druckvorschau, alle vier Ansichten – Fehlerprotokoll leer |

**Nicht geprüft / offen:** Das Schloss-Zeichen in **Firefox/Safari** (Emoji-Darstellung) und das
Öffnen von Projektdateien mit `locked` aus älteren Fassungen (das Feld fehlte dort – `migrateProject`
setzt es dann auf `false`, Codepfad geprüft, nicht durchgeklickt).

## 20. Kontextmenü: Einträge wirkten beim Rechtsklick auf einen Balken nicht (Nutzermeldung)

**Meldung:** „Sperren über das Pull-Down-Menü funktioniert nicht – im Detailfenster schon.“

**Ursache (im Bildschirmfoto sichtbar: Rechtsklick auf den *Balken*, Menü geht auf, Klick bewirkt
nichts):** `bar` und `ms-diamond` im Gantt haben einen eigenen `contextmenu`-Zuhörer, ließen das
Ereignis aber **weiterlaufen** – zusätzlich zum Zeilen-Zuhörer. Damit lief `rowMenu()` zweimal:
Der zweite Aufbau entfernte das erste Menü (`closeMenu`), **ließ aber dessen Zuhörer
„Klick außerhalb schließt“ am Dokument stehen**. Dieser alte Zuhörer sah beim nächsten
Mausdruck den Klick auf das *neue* Menü als „außerhalb“ (er kannte nur sein eigenes, entferntes
Kästchen) und schloss das neue Menü – und zwar in der **mousedown-Phase**. Der Knopf war damit weg,
bevor `mouseup`/`click` kam: der Eintrag wirkte nicht. Betroffen waren **alle** Einträge des Menüs
bei Rechtsklick auf Balken/Meilenstein (z. B. auch „Termin: 1 Tag später“), nicht nur das Schloss.

**Behebung:**
1. `js/ui/menu.js`: `closeMenu()` räumt den Außerhalb-Zuhörer mit ab, und es gibt immer nur einen
   (der vorherige wird vor dem Registrieren entfernt). Zusätzlich baut ein Aufbau nichts mehr auf,
   wenn dazwischen schon ein neues Menü entstanden ist (`if (current !== box) return`).
2. `js/views/gantt.js`: `contextmenu` auf Balken und Meilenstein-Raute jetzt mit
   `e.stopPropagation()` – der Menüaufbau läuft nur noch einmal.

| Prüfung (echte Maus über `Input.dispatchMouseEvent`) | Ergebnis |
|---|---|
| Rechtsklick **Balken** → „🔒 Sperren“ (vorher: wirkungslos, Menü schloss nur) | ✅ sperrt die Aufgabe |
| Rechtsklick **Zeile** (Namensspalte) → „🔓 Schloss öffnen“ | ✅ öffnet das Schloss |
| Rechtsklick **Meilenstein-Raute** → „🔒 Sperren“ | ✅ sperrt |
| Rechtsklick **Tabellenzeile** → „🔓 Schloss öffnen“ | ✅ öffnet |
| Rechtsklick **Balken** → „Termin: 1 Tag später“ | ✅ `2026-10-28` → `2026-10-29` |
| Rechtsklick **Balken** → „Duplizieren“ | ✅ 18 → 19 Aufgaben |
| Rechtsklick **Balken** → „Termin verschieben…“ | ✅ Dialog öffnet |
| Nur **ein** Menü im DOM, Klick daneben schließt es | ✅ (vorher wurden zwei Kästchen gebaut) |
| Keine Fehler | ✅ Fehlerprotokoll leer |

## 21. Zeilenreihenfolge mit Umschalt+↑/↓ verschieben (neue Bedienung)

**Wunsch:** Mit **Umschalt**+`↑`/`↓` die Reihenfolge der Aufgaben schieben, ohne dass bereits
eingegebene Daten (Termine, Dauer, Fortschritt, Name, Zuweisungen) verändert werden.

**Umsetzung:** `store.moveRows(dir, ids?)` (neu) verschiebt die markierten Zeilen **als Block**
innerhalb ihrer Ebene; Unteraufgaben wandern mit, Sammelaufgaben mit ihrem ganzen Teilbaum. Nur die
Reihenfolge im Feld `tasks` ändert sich – nichts an den Aufgaben selbst; die Nummerierung (WBS)
ergibt sich daraus und läuft mit. Das flache Feld wird aus den neuen Geschwisterlisten per
Tiefensuche wieder aufgebaut. `moveRow(id, dir)` (Kontextmenü) ist jetzt ein Aufruf von `moveRows`.
Neu belegt: `Umschalt`+`↑`/`↓` = Reihenfolge, `Strg`+`↑`/`↓` = Auswahl zeilenweise erweitern
(vorher auf `Umschalt`+`↑`/`↓`), `Umschalt`+`Strg`+`↑`/`↓` = Termin eine Woche, `Alt`+`↑`/`↓` =
weiterhin Reihenfolge.

| Prüfung | Ergebnis |
|---|---|
| `Umschalt`+`↑` auf „1.2 Zielgruppen-Workshop“ | ✅ wird zu „1.1“ und schiebt „Anforderungen sammeln“ auf „1.2“ |
| `Umschalt`+`↓` danach | ✅ wieder die Ausgangsreihenfolge |
| **Datenvergleich** vorher/nachher (Name, Beginn, Ende, Dauer, Fortschritt, Status, Elternteil) | ✅ **keine** Aufgabe geändert |
| Drei markierte Zeilen (3.3/3.4/3.5) mit `Umschalt`+`↑` | ✅ wandern als **Block** über „3.2 Frontend-Grundgerüst“, Reihenfolge der drei bleibt erhalten |
| Sammelaufgabe „Design“ mit `Umschalt`+`↑` | ✅ wandert mit allen drei Unteraufgaben über „Konzept & Planung“ (wird `1`, Konzept `2`) und mit `Umschalt`+`↓` zurück |
| Oberste Zeile weiter nach oben | ✅ nichts passiert, **kein** neuer Rückgängig-Punkt |
| `Strg`+`↑`/`↓` | ✅ erweitert bzw. verkleinert die Auswahl zeilenweise (wie vorher `Umschalt`) |
| `Umschalt`+`Strg`+`↑`/`↓` und `Umschalt`+`Strg`+`←`/`→` | ✅ Termine weiterhin eine Woche bzw. einen Monat (Rückgängig-Titel „1 Wochen früher“, „1 Monat später“ …) |
| `Umschalt`+`←`/`→` | ✅ weiterhin ein Arbeitstag (Titel „1 Tag später“) |
| `Alt`+`↑`/`↓` | ✅ verschiebt ebenfalls die Reihenfolge (jetzt auch für die ganze Auswahl) |
| Kontextmenü **Nach oben** / **Nach unten** | ✅ wirkt auf die Auswahl, Hinweis jetzt `Umschalt+↑`/`Umschalt+↓` |
| Gesperrte Zeile | ✅ abgelehnt: „„Zielgruppen-Workshop“ ist gesperrt – nach oben verschieben ist nicht möglich.“ |
| `Strg`+`Z` nach dem Schieben | ✅ stellt die vorige Reihenfolge her (ein Rückgängig-Punkt je Schieben) |
| Keine Fehler | ✅ Fehlerprotokoll leer |

## 22. Wochentage, Wochenenden und Feiertage (neue Bedienung)

**Wunsch:** (1) über den Tageszahlen die Wochentage `Mo`, `Di`, `Mi` … anzeigen, (2) Samstag und
Sonntag als Spalten deutlich anders färben, (3) Feiertage wie in Outlook übernehmen – mit
regionaler Ergänzung – und ähnlich auffällig zeigen wie gesperrte Aufgaben.

**Umsetzung**

- **Wochentagszeile** (`buildHeader` in `views/gantt.js`): im **Tag-Raster** eine eigene Reihe
  zwischen Monatszeile und Tageszahlen (`Mo Di Mi Do Fr Sa So …`), Spaltenkopf wächst auf 62 px.
  Bei Woche/Monat/Quartal bleibt der Kopf wie bisher (dort gibt es keine Tagesspalten).
  Jede Tageszelle nennt im Hinweis nun `Wochentag, Datum` plus `· Feiertag: Name`.
- **Feiertage wie in Outlook** (`js/holidays.js`, neu): Bundesland + Jahre wählen, Knopf
  **Feiertage eintragen** im Setup-Dialog. 9 bundesweite Feiertage plus die regionalen des Landes;
  die beweglichen werden aus Ostern gerechnet (Anonymus Gregorianus), feste stehen als Regel drin.
  Namen werden mitgespeichert (neues Feld `settings.calendar.holidayNames`) – `holidays` bleibt die
  Datumsliste, damit ältere Dateien weiter laden (`normalizeCalendar` versteht jetzt auch
  `{date,name}`). Eigene freie Tage lassen sich wie bisher mit Bezeichnung eintragen.
- **Anzeige**: Wochenenden kühl-blau, Feiertage bernsteinfarben mit gestricheltem Rand und im
  Spaltenkopf ein kleines 🔒 vor der Zahl (wie bei gesperrten Aufgaben); Kalenderzelle und
  Ausdruck ebenfalls hervorgehoben.

**Zwei alte Fehler kamen dabei ans Licht**

1. **Die Spaltenfärbung im Plan war nie zu sehen**: die Regeln in `css/app.css` hießen
   `.g-track .grid-day`, der Hintergrund liegt aber in einem eigenen Kästchen `.g-bg` – der
   Selektor passte nie. Jetzt `.g-bg .grid-day…` (plus `.g-track` als Rückfall).
2. **`--weekend`/`--holiday` liegen in `themes.css`** (je Layout) – Änderungen nur in `app.css`
   wirken nicht, weil die Theme-Blöcke später kommen. Alle **neun** Layouts wurden angepasst.

| Prüfung | Ergebnis |
|---|---|
| Tag-Raster: Reihen im Spaltenkopf | ✅ `g-head-coarse` (Monat) · `g-head-dows` (Wochentage) · `g-head-units` (Tage), Höhe 62 px |
| Wochentage über den Zahlen | ✅ `Mo Di Mi Do Fr Sa So Mo Di …` über `12 13 14 15 …` (Tag-Spalte 30 px) |
| Woche/Monat/Quartal | ✅ unverändert (`KW 42 KW 43 …`, Kopfhöhe 44 px) – keine Wochentagszeile |
| Wochenend-Spalten im Plan | ✅ 24 Spalten, gemessene Farbe `rgba(120,160,235,.15)` (vorher unsichtbar) |
| Feiertags-Spalten | ✅ bernsteinfarben `rgba(245,158,11,.22)` mit gestricheltem linken Rand |
| Hinweis am Tag | ✅ „Sonntag, 01.11.2026 · Feiertag: Allerheiligen“ (Tages- und Wochentagszelle) |
| **Import Bayern 2026–2027** über den echten Knopf | ✅ 26 Tage (13 je Jahr) = 9 bundesweit + Heilige Drei Könige, Fronleichnam, Allerheiligen, Mariä Himmelfahrt |
| Namen | ✅ „Allerheiligen“, „Tag der Arbeit“ … · in BY „Mariä Himmelfahrt – in Bayern nur katholische Gemeinden“ |
| Gegenprobe regional | ✅ Reformationstag bei **BY** nicht dabei, bei **SN** schon; Frauentag bei **BE**; Buß- und Bettag nur **SN** |
| **Rechnung stimmt** (gegen die amtlichen Termine) | ✅ Ostern 2026 `05.04.`, 2027 `28.03.`, 2028 `16.04.` · Karfreitag `03.04.2026`, `26.03.2027` · Himmelfahrt `14.05.2026`, `06.05.2027` · Pfingstmontag `25.05.2026`, `17.05.2027` · Fronleichnam `04.06.2026`, `27.05.2027` · Buß- und Bettag `18.11.2026`, `17.11.2027` |
| Zweimal eintragen | ✅ „Alles schon eingetragen“, keine Doppel |
| Kalender-Ansicht | ✅ Zelle `cal-cell wknd hol`, Hinweis „Feiertag: Allerheiligen“ |
| Wirkung auf Termine | ✅ Aufgabe auf den `01.11.` gesetzt → beginnt am `02.11.`; Verschieben rutscht über den Feiertag |
| Druck/PDF | ✅ 3 Blätter, Feiertagsspalte als `pg-hol`-Streifen vorhanden |
| Keine Fehler | ✅ Fehlerprotokoll leer |

**Nicht geprüft / offen:** Schulferien sind bewusst nicht enthalten (kein verlässlicher Datensatz
ohne externe Quelle); ein **.ics-Import** (Kalenderdatei aus Outlook) ist noch nicht gebaut.
Die Schweiz mit ihren Kantonen ist in § 23 nachgetragen.

## 23. Feiertage für die Schweiz und ihre Kantone (Erweiterung)

**Wunsch:** Feiertage wie in Outlook übernehmen – „für die Schweiz und deren Kantone“.

**Umsetzung**

- `js/holidays.js` kennt jetzt zwei Länder: **Schweiz** (`CH`) und **Deutschland** (`DE`).
  Regionen-Kennungen: `CH` (nur die 4 gesamtschweizerischen Tage), `CH:UEB`
  („Feiertagsfahrplan“ von SBB/Post/Bundesverwaltung, 9 Tage), `CH:ZH` … `CH:JU` (die 26 Kantone),
  `DE`, `DE:BW` … `DE:TH`. Die alte Form `holidaysForYear(y, 'BY')` funktioniert weiter.
- **Datenquelle:** amtliche Feiertagsliste des Bundesamts für Justiz, maschinenlesbar über
  `date.nager.at/api/v3/PublicHolidays/<jahr>/CH` (Tage mit `counties` = „CH-XX“ bzw. `global`).
  Daraus wurden **Regeln** abgeleitet (festes Datum oder Abstand zu Ostern) statt einzelner Jahre,
  damit jedes Jahr – auch künftige – stimmt. Der Kanton Zürich führt zusätzlich den
  **Berchtoldstag** als kantonalen Feiertag (Personalamt ZH/Zürich Tourismus); die Bundesliste
  nennt AG, BE, FR, SH, TG, VD.
- Bundesweite Sonderfälle: **Jeûne genevois** (Donnerstag nach dem ersten Sonntag im September, GE),
  **Bettagsmontag** (Montag nach dem 3. Sonntag im September, VD), **Näfelser Fahrt** (erster
  Donnerstag im April, GL – Datum wird angegeben, „Ausnahmen möglich“), **Stephanstag nur, wenn er
  nicht auf Dienstag oder Samstag fällt** (AI, AR). Der Eidgenössische Bettag selbst ist immer ein
  Sonntag und wurde deshalb weggelassen.
- Nur regional geltende Tage (z. B. Josefstag in LU, Mariä Empfängnis in TI) werden mit dem Hinweis
  „nur regional bzw. gewohnheitsmäßig frei“ mit eingetragen, damit nichts fehlt – löschbar einzeln.
- **Oberfläche:** Der Setup-Dialog hat jetzt **Land** + **Region**; die Auswahl wird als
  `settings.calendar.holidayRegion` im Projekt gemerkt (Standard Schweiz).

| Prüfung | Ergebnis |
|---|---|
| Automatischer Abgleich gegen die Quelle | ✅ **130 Kanton-Jahre** (26 Kantone × 2025–2029) **datumsgenau verglichen – 0 Abweichungen** (Prüfskript `ch_check.mjs`, node) |
| Ostersonntage | ✅ 2025 `20.04.` · 2026 `05.04.` · 2027 `28.03.` · 2028 `16.04.` · 2029 `01.04.` |
| „Ganze Schweiz“ | ✅ genau 4: Neujahr, Auffahrt, Bundesfeier, Weihnachtstag |
| Kanton Zürich 2026 | ✅ 10 Tage: mit **2.1. (Berchtoldstag)** und **1.5.** |
| Kanton Luzern 2026 (echte Klicks im Dialog) | ✅ 11 Tage, u. a. 19.3. Josefstag (Hinweis), 1.11. Allerheiligen |
| Tessin 2026 | ✅ 15 Tage, mit 6.1., 19.3., 29.6. – **ohne Karfreitag** |
| Wallis 2026 | ✅ 9 Tage – **ohne Karfreitag, Ostermontag, Pfingstmontag** |
| Genf / Waadt / Glarus | ✅ Jeûne genevois `10.09.2026` + `31.12.` · Bettagsmontag `21.09.2026` · Näfelser Fahrt `02.04.2026` |
| Appenzell Innerrhoden | ✅ 26.12.2026 (Samstag) fehlt, 2025/2027 vorhanden – Regel wirkt |
| Deutschland unverändert | ✅ Bayern 2026 weiterhin 13 Tage |
| Swiss-Hinweise | ✅ nur bei den betroffenen Tagen, Löschen mit ✕ möglich |
| Anzeige im Plan | ✅ 4 Feiertagsspalten im Zeitraum (1.11., 8.12., 25.12., 26.12.2026), Tag-Zelle `wknd hol` mit Hinweis „Sonntag, 01.11.2026 · Feiertag: Allerheiligen“ und 🔒 vor der Zahl |
| Wirkung auf Termine | ✅ Aufgabe auf Freitag 30.10.2026, Dauer 2 → endet Montag `02.11.2026` (Wochenende + Allerheiligen übersprungen) |
| Speichern/Laden | ✅ Region `CH:LU` und alle 11 Tage mit Namen bleiben erhalten |
| Fehlerprotokoll | ✅ leer |

**Offen:** Schulferien, reine Lokalanlässe und ein `.ics`-Import sind weiterhin nicht enthalten.
Die Datenlage ist zwischen öffentlichem Dienst und Privatwirtschaft kantonal unterschiedlich
(z. B. Berchtoldstag in AG/FR nur in bestimmten Gemeinden) – deshalb die Hinweise und die
Möglichkeit, einzelne Zeilen zu löschen.

## 24. Feiertage in künftigen Jahren – automatische Ergänzung (Erweiterung)

**Frage des Nutzers:** „Wie funktioniert die Aktualisierung der Feiertage in folgenden Jahren?“
Gewünscht: einmal einrichten, danach nie wieder daran denken.

**Vorher (gemessen):** Die Jahre im Dialog waren aus dem Plan vorbelegt; die Feiertage lagen als
Daten in `settings.calendar.holidays`. Ein neues Jahr musste man selbst hochziehen und erneut
klicken (harmlos: Doppeltes wurde übersprungen), ein nicht eingetragenes Jahr hatte keine Feiertage.

**Umsetzung**

- Beim Übernehmen merkt sich das Projekt `settings.calendar.holidayImport = { region, from, to }`
  (welche Region für welche Jahre eingetragen ist); `holidayYears` bleibt für die Anzeige/Vorbelegung.
- `store.extendHolidaysToPlan()` prüft bei jeder Terminberechnung, ob der Plan über die
  eingetragenen Jahre hinausreicht oder früher beginnt, und trägt die fehlenden Jahre für **dieselbe
  Region** nach (bewegliche Feiertage wieder aus Ostern gerechnet). Meldung als Toast
  „📅 Feiertage 2027 ergänzt – n Tage (Kanton …)“.
- Läuft **vor und nach** dem Terminlauf: erst dann steht fest, wohin der Plan wirklich reicht
  (Vorgänger und Arbeitstage schieben Termine über die Jahresgrenze). Wächst der Plan dadurch,
  wird gleich neu gerechnet – eine Aufgabe, die dadurch auf einen neuen Feiertag fällt, rutscht weg.
- Schutz gegen Selbstaufruf (`_extendingHolidays`), kein Leerlauf (nachgetragene Jahre werden
  mitgeschrieben, sonst würde jede Neuberechnung erneut arbeiten).
- Maßgeblich ist die **eingetragene** Region, nicht die im Auswahlfeld stehende: wer die Auswahl nur
  umstellt (ohne Knopf), behält die alte Region für die Automatik; bestehende Tage bleiben immer.

| Prüfung | Ergebnis |
|---|---|
| Luzern 2026 eingetragen | ✅ 11 Tage, `holidayImport {CH:LU, 2026, 2026}` |
| Aufgabe nach 2027 geschoben (Start + Ende) | ✅ 11 Tage für 2027 automatisch, `{CH:LU, 2026, 2027}`, Toast „📅 Feiertage 2027 ergänzt“ |
| Sprung von 2026 nach 2028 | ✅ 20 Tage für 2027 **und** 2028 in einem Zug, Toast „📅 Feiertage 2027, 2028 ergänzt“ |
| Aufgabe **rückwärts** in 2025 | ✅ 11 Tage für 2025 ergänzt, `{2025 … 2027}` |
| Termin genau auf neuem Feiertag | ✅ Aufgabe auf `01.05.2028` (Tag der Arbeit, ZH) gesetzt → beginnt `02.05.2028` |
| 3× Neuberechnung ohne Planänderung | ✅ keine neuen Tage, keine zusätzlichen Rückgängig-Punkte (kein Leerlauf) |
| Auswahlfeld auf anderen Kanton, ohne Knopf | ✅ Automatik bleibt bei der eingetragenen Region (Luzern-Tage für 2027, kein ZH-Tag) |
| Knopf gedrückt nach Regionswechsel (ZH) | ✅ 2.1. und 1.5. für 2026 **und** 2027 ergänzt, `holidayImport {CH:ZH, …}`, Jahre im Dialog vorbelegt |
| Speichern/Laden | ✅ Region, `holidayImport` und alle 40 Tage bleiben erhalten; keine erneute Nacharbeit |
| Fehlerprotokoll | ✅ leer |

## 25. Einstellung „Feiertage und Zeitstrahl bis Jahr“ (Erweiterung)

**Wunsch:** „Ich will im Setup einstellen können, bis zu welchem Jahr die Tage hier angezeigt
werden sollen. Standardmäßig aber 1 Jahr länger als aktuelles Datum.“

**Umsetzung**

- Neue Einstellung `settings.calendar.holidayUntil`. Ohne Wert gilt als Vorgabe das **kommende
  Jahr** (`store.holidayHorizon()` = heutiges Jahr + 1).
- Im Setup steht dafür ein eigenes Feld **„Feiertage vorhalten bis Jahr“** (Zahlenfeld) mit Hinweis.
  Ändern wirkt sofort: `store.setHolidayUntil(jahr)` speichert und ruft die Nachträge für die
  eingetragene Region; die Automatik zieht `holidayHorizon()` als Zielmarke mit
  (`b = max(Planjahre, eingetragene Jahre, Zieljahr)`).
- Das Jahresfeld „bis“ beim Eintragen ist mit `max(Planende, eingetragene Jahre, Zieljahr)`
  vorbelegt – der erste Klick deckt also gleich die Vorgabe „nächstes Jahr“ mit ab.
- **Automatik erst nach bewusstem Eintragen:** `extendHolidaysToPlan()` arbeitet nur mit
  `holidayImport.region` (nicht mit der nur im Auswahlfeld stehenden Region). Ein Umstellen der
  Region ohne Klick trägt nichts ein; Heruntersetzen des Zieljahrs löscht nichts.

| Prüfung | Ergebnis |
|---|---|
| Vorgabe im Feld (heute 20.10.2026) | ✅ `2027` = ein Jahr länger als heute |
| Region Zürich wählen, **ohne** Knopf | ✅ keine Feiertage eingetragen (leer) |
| Eintragen mit Jahre 2026, Zieljahr 2027 | ✅ 10 Tage 2026 **und** 10 Tage 2027 in einem Vorgang |
| Zieljahr auf 2031 | ✅ 2028–2031 ergänzt (40 Tage), Toast „📅 Feiertage 2028, 2029, 2030, 2031 ergänzt“ |
| Zieljahr auf 2030 senken | ✅ nichts gelöscht (60 Tage bleiben), Einstellung gespeichert, Hinweis-Toast |
| Speichern/Laden | ✅ `holidayUntil` 2030, 60 Tage und Vermerk bleiben erhalten, Feld zeigt 2030 |
| Fehlerprotokoll | ✅ leer |

### Nachtrag: derselbe Wert steuert auch den Zeitstrahl

**Nutzerfrage:** „Warum sehe ich hier nur bis 15. November? Wo ist der Rest der Tage?“
**Ursache (gemessen):** Der Gantt-Zeitraum wurde **allein aus den Aufgaben** bestimmt – frühester
Start − 7 Tage bis spätestes Ende + 14 Tage, auf ganze Wochen gerundet. Bei einem Plan, der Mitte
November endet, endete damit auch der Strahl; der eingestellte Zielwert wirkte nur auf die
Feiertage. Meine erste Auslegung der Bitte war zu eng.

**Änderung**

- `store.holidayHorizon()` → **`store.horizonYear()`** (ein Wert für Feiertage **und** Zeitstrahl).
- `views/gantt.js`: `max = max(Planende, „<Zieljahr>-12-31“)`; nur wenn der Plan darüber hinausreicht,
  bleibt es beim Rand von 14 Tagen. Feld im Setup heißt jetzt **„Feiertage und Zeitstrahl bis Jahr“**.
- `fitGantt()`: kleinste Tagesbreite von 1,2 px auf **4 px** angehoben – bei mehrjährigen Strahlen war
  „Einpassen“ sonst unlesbar.

| Prüfung | Ergebnis |
|---|---|
| Zieljahr 2027, Plan endet 17.12.2026 | ✅ 448 Tagesspalten, `12.10.2026 … 02.01.2028` |
| Zieljahr 2026 senken | ✅ 84 Spalten (Planende + Jahresende), letzte Spalte `03.01.2027` |
| Zieljahr 2028 | ✅ 812 Spalten bis `31.12.2028` |
| Feiertage weit rechts sichtbar | ✅ 22 `hol`-Spalten mit Namen, z. B. „Dienstag, 26.12.2028 · Feiertag: Stephanstag“ |
| Rechenzeit beim Umschalten | ✅ Tag (812 Spalten) 90 ms · Monat 15 ms · Quartal 12 ms bis zum nächsten Bild |
| Einpassen bei langem Strahl | ✅ Tagesbreite bleibt ≥ 4 px, der Rest wird gerollt |
| Fehlerprotokoll | ✅ leer |

## 26. Offene Punkte / nicht geprüft

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
