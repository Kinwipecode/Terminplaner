# Terminplanung

Projekt- und Terminplanung im Browser – mit **Gantt-Diagramm, Tabelle, Kalender und Board**.
Eine einzige Projektdatei, die automatisch gespeichert wird: **du musst nie auf „Speichern“ drücken**
und kannst nichts verlieren, wenn der Browser geschlossen wird.

Kein Server, kein Konto, keine Installation – reines HTML/CSS/JavaScript (ES-Module) ohne
Abhängigkeiten. Läuft als statische Seite auf **GitHub Pages** oder lokal aus einem Ordner.

![Gantt-Ansicht](docs/screenshot-gantt.png)

## Was drin ist

**Vier Ansichten, ein Plan**

| Ansicht | Wofür |
|---|---|
| **Gantt** | Zeitachse mit Balken, Meilensteinen, Fortschritt und Abhängigkeitspfeilen. Balken ziehen = Termin ändern, an den Enden ziehen = Dauer ändern. |
| **Tabelle** | Alle Felder auf einen Blick, direkt bearbeitbar, gruppierbar (Status, Priorität, Person) und sortierbar. |
| **Kalender** | Monatsansicht – Aufgaben per Ziehen auf einen anderen Tag verschieben. |
| **Board** | Kanban nach Status; Karte in eine andere Spalte ziehen ändert den Status. |

**Planung wie in MS Project / GanttProject**

- Aufgaben, Sammelaufgaben (mit automatischer Zusammenfassung) und Meilensteine
- Abhängigkeiten in vier Arten: Ende→Anfang, Anfang→Anfang, Ende→Ende, Anfang→Ende – jeweils mit Puffer
- **Auto-Planung**: Verschiebt man eine Aufgabe, wandern alle Nachfolger mit
- Kritischer Pfad, Puffer pro Aufgabe, Termin-Festlegungen („muss beginnen am“, „beginnt nicht vor“ …)
- Ziel-Termine (Deadlines) mit Warnung bei Überschreitung
- Arbeitskalender: Arbeitstage und Feiertage frei einstellbar (Dauer wird in Arbeitstagen gerechnet)
- Beteiligte mit Farben, Auslastung und Zuweisung mehrerer Personen

**Neun fertige Farblayouts** (links auf **Farbe** oder oben auf **◐**)

Ein Klick genügt – die Auswahl wird gemerkt und gilt beim nächsten Start weiter:

| Dunkel | Hell |
|---|---|
| Nachtblau · Anthrazit · Tiefsee · Violettnacht · Hoher Kontrast | Tageslicht · Nordlicht · Papier · Sonnenschein |

Jedes Layout setzt Flächen, Linien, Text und Akzentfarben neu. Die Balkenfarben behalten ihre
Bedeutung (grün = erledigt, rot = blockiert …), damit Pläne vergleichbar bleiben.

**Drucken und PDF** (links auf **Drucken**, oben auf **🖨** oder `Strg`+`P`)

![Druckausgabe](docs/screenshot-druck.png)

- Blattformat **A4 oder A3**, je hoch oder quer – die Seiten werden exakt in Millimetern aufgebaut,
  es gibt keine halben Blätter und keine abgeschnittenen Zeilen.
- Inhalte frei zusammenklicken: **Deckblatt, Gantt-Diagramm, Tabelle, Kalender, Board, Legende**.
- Zeitraum, Zeitraster (Tage/Wochen/Monate) und Feinheit einstellbar; die Blattzahl wird laufend angezeigt.
- Reicht der Platz nicht, entstehen weitere Blätter: die Aufgabenliste wiederholt sich links,
  die Zeitachse läuft nach rechts weiter.
- Im Druckdialog **„Microsoft Print to PDF“** wählen → fertige PDF-Datei im gewählten Format.

**Speichern ohne Nachdenken** (siehe unten)

- Automatisches Speichern ~0,7 s nach jeder Änderung, zusätzlich alle 30 s und beim Schließen
- Sicherungskopien mit Rotation, Wiederherstellung per Klick
- Warndialog, wenn der Browser beim letzten Mal nicht mehr fertig speichern konnte

## Schnellstart

### Variante A – GitHub Pages (empfohlen, nichts installieren)

1. Repository anlegen und diese Dateien hineinlegen (Ordner `css/`, `js/`, `docs/`, `examples/` mitnehmen).
2. Im Repository: **Settings → Pages → Source: Deploy from a branch → Branch: `main` / `/ (root)`**.
3. Nach ein bis zwei Minuten ist die App unter `https://<benutzer>.github.io/<repo>/` erreichbar.

> Für das automatische Speichern in einen echten Ordner braucht es Chrome, Edge oder Opera
> (File System Access API). Firefox und Safari speichern im Browser – dort zusätzlich
> `⤓` benutzen, um die Datei zu sichern.

### Variante B – lokal starten

Doppelklick auf **`Terminstart.bat`** (Windows) bzw. `./start.sh` (Linux/macOS). Der Start
erledigt alles: freien Port suchen, kleinen Webserver starten, App im Browser öffnen. Läuft die
App schon, wird nur das Browserfenster geholt – kein zweiter Server.

Zusatzangaben sind möglich: `Terminstart.bat --port 9000` oder `Terminstart.bat --no-open`.
Das Konsolenfenster ist der Webserver und muss während der Arbeit offen bleiben (schließen beendet ihn).

> `start.bat` macht dasselbe – beide Namen funktionieren.
> Ohne Server geht es nicht, weil die App aus JavaScript-Modulen besteht (Browser-Sicherheitsregel).

### Loslegen

1. **Neues Projekt anlegen** → Namen eingeben → **Ordner wählen** (z. B. `Dokumente\Projekte`).
   Dort entsteht `mein-projekt.tplan.json`.
2. Aufgaben anlegen (`＋ Aufgabe`, `Einfg`), Termine im Gantt ziehen, Abhängigkeiten im
   Detailbereich rechts setzen.
3. Fertig – es ist bereits gespeichert. Beim nächsten Mal einfach die Seite öffnen und
   **Fortsetzen** klicken.

## Speichern im Detail

Die App kann drei Arten von Speicherorten, automatisch die beste verfügbare:

| Art | Verhalten | Voraussetzung |
|---|---|---|
| **Ordner** | Du wählst einmalig einen Ordner. Die Projektdatei liegt dort als normale Datei, jede Änderung wird sofort hineingeschrieben. Beim nächsten Start wird der Ordner wiederverwendet (Zugriff einmal bestätigen). | Chrome, Edge, Opera (https oder localhost) |
| **Browser-Speicher** | Automatisch, ohne Dialog. Die Datei liegt im geschützten Speicher des Browsers (OPFS) und überlebt Neustarts. | Chrome, Edge, Firefox, Safari |
| **Notfall** | Speichern im `localStorage`, zusätzlich `⤓` zum Herunterladen und Import per Drag & Drop. | alle Browser |

Zusätzlich:

- **Sicherungskopien**: im Unterordner `Backups` der Projektdatei, maximal 12, älteste werden
  automatisch gelöscht (oben rechts auf den Speicherort klicken → `Sicherungen ansehen`,
  Wiederherstellen mit einem Klick).
- **Absturzschutz**: Vor jedem Schreibvorgang wird eine Marke gesetzt und nach erfolgreichem
  Schreiben entfernt. Findet die App beim Start eine solche Marke, meldet sie das und bietet
  Datei bzw. Sicherungen an.
- **Schließen**: Beim Tab-Wechsel, beim Schließen und alle 30 Sekunden wird geschrieben.
  Bei einem Speicherfehler fragt der Browser vor dem Schließen nach.
- **Speicherzustand** oben in der Mitte: grün = gespeichert, gelb = wird gleich gespeichert,
  blau = speichert gerade, rot = Fehler. Der Hinweis rechts daneben nennt den Speicherort und
  öffnet beim Anklicken die Auswahl (Ordner wechseln, Browser-Speicher, nur herunterladen).

## Projektdatei

Eine Datei, lesbarer JSON-Text, Endung `.tplan.json`:

```json
{
  "format": "terminplanung",
  "version": 1,
  "meta":      { "name": "…", "created": "…", "modified": "…" },
  "settings":  { "projectStart": "2026-10-19", "calendar": { "workdays": [1,2,3,4,5], "holidays": [] } },
  "resources": [ { "id": "r…", "name": "Anna Weber", "color": "#6366f1" } ],
  "tasks":     [ { "id": "t…", "name": "…", "type": "task|milestone|summary",
                   "start": "2026-10-19", "end": "2026-10-22", "duration": 4,
                   "progress": 40, "status": "running", "priority": "high",
                   "assignees": ["r…"], "deps": [{ "id": "t…", "type": "FS", "lag": 0 }] } ]
}
```

Weitergeben = Datei kopieren. Wieder öffnen = `📂 Projekt öffnen` (oder Datei ins Fenster ziehen).
Beispiel zum Ausprobieren: [`examples/beispiel-projekt.tplan.json`](examples/beispiel-projekt.tplan.json).

## Tastenkürzel

| Taste | Wirkung |
|---|---|
| `Strg`+`Z` / `Strg`+`Y` | Rückgängig / Wiederholen |
| `Strg`+`S` | sofort speichern (sonst passiert das automatisch) |
| `Einfg` | neue Aufgabe · `Entf` löschen · `F2` umbenennen |
| `Alt`+`→` / `Alt`+`←` | einrücken / ausrücken |
| `Alt`+`↑` / `Alt`+`↓` | Zeile nach oben / unten |
| `1` … `4` | Gantt / Tabelle / Kalender / Board |
| `Leertaste` | im Gantt zu „Heute“ springen |
| `Strg`+`P` | drucken bzw. PDF erzeugen (Druckaufbau entsteht automatisch) |
| `F1` | Kurzanleitung |

## Aufbau des Projekts

```
index.html            Oberfläche
Terminstart.bat       Start per Doppelklick (Windows) – start.bat macht dasselbe
start.sh              Start unter Linux/macOS
css/app.css           Aussehen der Oberfläche (benutzt die Farbvariablen)
css/themes.css        die neun Farblayouts
css/print.css         Druckvorlage (A4/A3, Millimetermaße)
js/
  main.js             Start, Werkzeugleiste, Tastenkürzel, Speicherzustand
  model.js            Datenmodell, Prüfen/Reparieren von Dateien, Beispielprojekt
  scheduler.js        Terminberechnung, Abhängigkeiten, kritischer Pfad
  store.js            Zustand, Änderungen, Rückgängig/Wiederholen
  storage.js          Speichern (Ordner / Browser / Notfall), Autospeichern, Sicherungen
  print.js            Aufbau der Druckseiten und der Druckdialog
  themes.js           Farblayouts: Namen, Auswahl, merken
  dateutil.js         Datums- und Arbeitstagsrechnung
  ui/                 Dialoge, Detailbereich, Kontextmenü, kleine Helfer
  views/              gantt.js · table.js · calendar.js · board.js
docs/                 Handbuch, Testprotokoll, Screenshots
examples/             Beispielprojekt
tools/serve.py        kleiner lokaler Webserver (freier Port, kein Cache)
tools/make-example.mjs erzeugt das Beispielprojekt neu
```

Keine Abhängigkeiten, kein Build-Schritt: Datei ändern, Seite neu laden. Fertig.

## Lizenz

MIT – siehe [LICENSE](LICENSE).
