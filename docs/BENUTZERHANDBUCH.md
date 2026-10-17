# Handbuch

Alles, was die App kann – von der ersten Aufgabe bis zur Sicherung.

## 1. Erste Schritte

**Starten:** Doppelklick auf `Terminstart.bat` (Windows) bzw. `./start.sh` (Linux/macOS).
Es öffnet sich ein Konsolenfenster (das ist der kleine Webserver – offen lassen) und die App im
Browser. Läuft sie schon, wird nur das Browserfenster geholt.

1. Seite öffnen. Auf dem Startbildschirm **Neues Projekt anlegen** wählen.
2. Projektnamen eingeben – dieser Name wird auch der Dateiname (`Büro-Umbau.tplan.json`).
3. **Ordner wählen**: einen Ordner auf der Festplatte auswählen (z. B. `Dokumente\Projekte`).
   Dort legt die App die Projektdatei an. Ab jetzt wird jede Änderung automatisch dort hineingeschrieben.
4. Mit **＋ Aufgabe** oder `Einfg` die erste Aufgabe anlegen. Sie erscheint sofort im Gantt und
   in allen anderen Ansichten.

> **Kein Ordner gewählt?** Dann speichert die App im Browser-Speicher weiter und sagt das oben
> rechts. Über den Hinweis lässt sich jederzeit ein Ordner nachwählen.

## 2. Die vier Ansichten

Links in der Leiste umschalten (oder `1` … `4`).

### Gantt
- Zeitachse mit Raster: Tag, Woche, Monat, Quartal (**Tag/Woche/Monat/Quartal**) – oder
  **Einpassen**, um den ganzen Plan in die Fensterbreite zu holen.
- **Balken ziehen** = Termin verschieben (rastet auf Arbeitstage ein).
- **Balken am linken oder rechten Ende ziehen** = Anfang bzw. Ende/Dauer ändern.
- **Meilenstein** = Raute; ziehen verschiebt den Termin.
- **Sammelaufgabe** = grauer Klammerbalken; er wird automatisch aus den Unteraufgaben berechnet
  und lässt sich nicht direkt verschieben.
- **Pfeile** zeigen Abhängigkeiten. Mit **Kritischer Pfad** werden Aufgaben ohne Puffer rot
  umrandet, mit **Abhängigkeiten** lassen sich die Pfeile ausblenden.
- **Rechtsklick** auf eine Zeile öffnet das Menü (einfügen, ein-/ausrücken, verschieben,
  duplizieren, löschen).
- **Doppelklick auf den Namen** benennt direkt um.
- Die rote Linie ist **heute**; Wochenenden und Feiertage sind schattiert.

### Tabelle
Alle Felder, direkt bearbeitbar: Bezeichnung, Beginn, Ende, Dauer (Arbeitstage), Fortschritt,
Status, Priorität, Wer, Vorgänger, Ziel. Spaltenköpfe sortieren, oben **Gruppieren** nach
Status/Priorität/Person. Werkzeugleiste zum Ein-/Ausrücken, Verschieben, Duplizieren, Löschen.
Doppelklick auf eine Zeile öffnet die Details rechts.

### Kalender
Monatsansicht mit Vor/Zurück und **Heute**. Aufgabe auf einen anderen Tag ziehen verschiebt sie
(mitsamt Dauer). **＋** in einer Tageszelle legt an diesem Tag eine Aufgabe an.

### Board
Vier Spalten nach Status: Offen, Läuft, Blockiert, Erledigt. Karte in eine andere Spalte ziehen
ändert den Status („Erledigt“ setzt den Fortschritt auf 100 %). Karte anklicken öffnet die Details.

## 3. Aufgaben, Sammelaufgaben, Meilensteine

| Art | Bedeutung | Termine |
|---|---|---|
| **Aufgabe** | normale Arbeit | Dauer in Arbeitstagen |
| **Meilenstein** | Ereignis ohne Dauer | ein einzelner Tag, Dauer 0 |
| **Sammelaufgabe** | Ordner für Unteraufgaben | automatisch: frühester Anfang bis spätestes Ende der Unteraufgaben |

Einrücken (`Alt`+`→`) macht aus einer Zeile eine Unteraufgabe der Zeile darüber, Ausrücken
(`Alt`+`←`) hebt das wieder auf. Die Nummerierung (`1`, `1.1`, `1.2`, `2`, …) wird automatisch
vergeben. Fortschritt und Status einer Sammelaufgabe sind der gewichtete Durchschnitt ihrer
Unteraufgaben.

## 4. Abhängigkeiten

Im Detailbereich rechts unter **Vorgänger**:

- **＋ Vorgänger hinzufügen** → Aufgabe aus der Liste wählen.
- **Art**: `FS` Ende→Anfang (Standard), `SS` Anfang→Anfang, `FF` Ende→Ende, `SF` Anfang→Ende.
- **Puffer**: Anzahl Arbeitstage Abstand (auch negativ möglich, z. B. Überlappung).
- **✕** entfernt die Verknüpfung.

Kreise werden verhindert (die App lehnt eine Verknüpfung ab, die eine Schleife erzeugen würde),
Unteraufgaben sind als eigene Vorgänger ausgeschlossen.

## 5. Auto-Planung

Der Schalter in der Werkzeugleiste:

- **an** – Termine werden neu gerechnet. Verschiebt man eine Aufgabe nach hinten, wandern alle
  Nachfolger mit; ändert sich ein Vorgänger, rücken die Nachfolger nach.
- **aus** – nichts wird verschoben. Die App rechnet trotzdem mit und meldet Widersprüche
  (gelbe Umrandung am Balken, Warnhinweis im Detailbereich und in der Statuszeile).

Wichtig: Wenn man eine Aufgabe **mit Vorgängern** verschiebt, merkt sich die App das als
Festlegung „beginnt nicht vor <Datum>“. Die Aufgabe bleibt dann dort, kann aber weiterhin nach
hinten geschoben werden. Diese Festlegung lässt sich im Detailbereich unter
**Termin-Festlegung** auf „So früh wie möglich“ zurückstellen.

Weitere Festlegungen: „Muss beginnen am“ (fester Start, wird nie verschoben),
„Beginnt nicht vor“, „Muss enden am“, „Endet nicht nach“.

**Kritischer Pfad**: Aufgaben ohne Puffer (jede Verzögerung verschiebt das Projektende).
Puffer und Kennzeichnung stehen im Detailbereich jeder Aufgabe.

## 6. Arbeitszeit und Feiertage

**Setup** in der linken Leiste:

- **Arbeitstage**: Mo–Fr voreingestellt; beliebige Kombination möglich.
- **Feiertage / freie Tage**: einzelne Tage als arbeitsfrei eintragen.
- **Projektbeginn**: frühester Termin für Aufgaben ohne Vorgänger.

Dauern werden in **Arbeitstagen** gerechnet: eine Aufgabe mit Dauer 4, die an einem Montag
beginnt, endet am Donnerstag. Wochenenden und Feiertage zählen nicht mit.

## 7. Team

**Team** in der linken Leiste: Personen (oder Teams/Material) anlegen mit Name, E-Mail und Farbe.
Im Detailbereich einer Aufgabe unter **Beteiligt** anklicken zum Zuweisen – mehrere möglich.
Die Farbe der ersten zugewiesenen Person färbt den Balken, sofern an der Aufgabe keine eigene
Farbe gesetzt ist.

## 8. Speichern, Sichern, Wiederherstellen

- **Automatisch**: ~0,7 s nach der letzten Änderung, zusätzlich alle 30 s und beim Tab-Wechsel
  bzw. Schließen. Der Zustand steht oben in der Mitte.
- **Sofort**: `Strg`+`S`.
- **Sicherungen**: automatisch im Unterordner `Backups` (höchstens 12, älteste fliegen raus).
  Oben rechts auf den Speicherort klicken → **Sicherungen ansehen** listet sie auf,
  **Wiederherstellen** ersetzt den aktuellen Stand (mit `Strg`+`Z` umkehrbar).
- **Herunterladen**: `⤓` legt eine Kopie in den Download-Ordner.
- **Öffnen**: `📂` zeigt die Projektdateien des aktuellen Speicherorts, `⤓`/Drag & Drop liest
  eine Datei von beliebiger Stelle ein.
- **Speicherort wechseln**: oben rechts auf den Hinweis klicken.
- **Nach einem Absturz**: Beim nächsten Start meldet die App, dass ein Schreibvorgang nicht
  abgeschlossen wurde, und bietet Datei bzw. Sicherungen an.

## 9. Tastenkürzel

| Taste | Wirkung |
|---|---|
| `Strg`+`Z` / `Strg`+`Y` | Rückgängig / Wiederholen (bis zu 120 Schritte) |
| `Strg`+`S` | sofort speichern |
| `Strg`+`N` / `Strg`+`O` | neues Projekt / Projekt öffnen |
| `Strg`+`F` | Filterfeld fokussieren |
| `Einfg` | neue Aufgabe |
| `Entf` | ausgewählte Aufgabe löschen |
| `F2` | ausgewählte Aufgabe umbenennen |
| `Alt`+`→` / `Alt`+`←` | einrücken / ausrücken |
| `Alt`+`↑` / `Alt`+`↓` | Zeile verschieben |
| `1` … `4` | Ansicht wechseln |
| `Leertaste` | zu „Heute“ springen |
| `Strg`+`P` | drucken bzw. PDF erzeugen |
| `F1` | Kurzanleitung |
| `Esc` | Dialog schließen / Auswahl aufheben |

## 10. Farblayout der Oberfläche

Links auf **Farbe** (oder oben auf **◐**, oder im Setup-Fenster auf **Farblayout…**).
Es öffnet sich eine Auswahl mit neun fertigen Layouts – jedes mit echter Vorschau in seinen
eigenen Farben. **Ein Klick** übernimmt es, **Fertig** schließt.

| Layout | Charakter |
|---|---|
| **Nachtblau** | Standard. Tiefes Blau, ruhige Flächen, kräftiger Indigo-Akzent. |
| **Anthrazit** | Neutrales Grau, Bernstein-Akzent – tritt optisch zurück. |
| **Tiefsee** | Petrol und Türkis, sehr gute Trennung von Balken und Raster. |
| **Violettnacht** | Dunkles Violett, weiche Kontraste. |
| **Hoher Kontrast** | Schwarz mit Gelb, weiße Schrift – für Beamer und schwache Augen. |
| **Tageslicht** | Helles, neutrales Blaugrau. Gut bei Tageslicht. |
| **Nordlicht** | Kühles Blaugrau, sehr zurückhaltend. |
| **Papier** | Warmes Weiß wie Papier, brauner Akzent – augenschonend am Abend. |
| **Sonnenschein** | Warmes Hellgelb mit Orange, freundlich und sehr hell. |

Mit **Hell ⇄ Dunkel** wechselt man schnell hin und her; die App merkt sich das zuletzt benutzte
dunkle Layout. Die Wahl gilt für alle Projekte und bleibt beim nächsten Start erhalten.

Wichtig: Die **Balkenfarben behalten immer ihre Bedeutung** (grün = erledigt, rot = blockiert,
blau = offen, grau = niedrige Priorität). Dadurch sehen Pläne in jedem Layout gleich aus –
nur die Flächen und Linien ändern sich. Der **Ausdruck ist unabhängig vom Layout immer hell**,
damit er auf Papier gut lesbar ist und keine Farbe verschwendet wird.

## 11. Drucken und PDF erzeugen

Links auf **Drucken**, oben auf **🖨** oder `Strg`+`P`. Der Aufbau entsteht dabei automatisch –
auch beim direkten `Strg`+`P` des Browsers, dort mit den zuletzt gewählten Einstellungen.

**Blattformat**: A4 oder A3, je **hoch** oder **quer**. Die Seiten werden exakt in Millimetern
gebaut; es gibt keine halben Blätter, keine abgeschnittenen Zeilen und keine Überläufe.

**Inhalt** (frei kombinierbar):

| Teil | Inhalt |
|---|---|
| **Deckblatt** | Projekttitel, Beschreibung, Kennzahlen (Zeitraum, Aufgaben, Fortschritt, Beteiligte, Arbeitstage) und Fortschrittsbalken der Hauptgruppen |
| **Gantt-Diagramm** | Zeitachse mit Balken, Meilensteinen, Fortschritt, Abhängigkeitspfeilen, Wochenend-Schattierung und Aufgabenliste links |
| **Tabelle** | Aufgabenliste mit Haupt- oder allen Spalten |
| **Kalender** | ein Monat je Blatt |
| **Board** | Karten nach Status in vier Spalten |
| **Legende** | Farben, Zeichen, Abhängigkeitsarten, Angaben zum Ausdruck und Blattübersicht |

**Weitere Einstellungen**: Zeitraum (gesamtes Projekt / ab heute / eigener Zeitraum),
Zeitraster (Tage/Wochen/Monate), Feinheit (grob/mittel/fein), Einzelheiten
(Abhängigkeitspfeile, Fortschritt, Wochenenden, kritischer Pfad, Zieltermine), Spaltenumfang,
und ob alle oder nur die gefilterten Aufgaben gedruckt werden.

Die **Blattzahl wird laufend angezeigt** (z. B. „7 Blatt A4 hoch · Deckblatt 1 · Gantt 4 ·
Tabelle 1 · Legende 1“), samt Hinweisen, wenn es viele Blätter werden.

**Passt der Inhalt nicht auf ein Blatt**, entstehen weitere Blätter:

- **Gantt**: die Aufgabenliste wiederholt sich auf jedem Blatt links, die Zeitachse läuft nach
  rechts weiter. Auf jedem Blatt steht im Kopf, welcher Zeitraum und welche Aufgabengruppe zu sehen ist.
- **Tabelle**: läuft nach unten weiter, die Spaltenköpfe wiederholen sich.
- **Kalender**: ein Monat je Blatt. **Board**: läuft nach unten weiter.

**So entsteht die PDF-Datei** (Windows):

1. **Drucken / PDF erzeugen** anklicken – der Druckdialog des Browsers öffnet sich.
2. Als Drucker **„Microsoft Print to PDF“** wählen (oder einen anderen PDF-Drucker).
3. Papierformat prüfen: es wird automatisch auf das eingestellte Format gesetzt
   („Papierformat: A4/A3“ und „Layout: Hochformat/Querformat“).
4. Ränder auf **Standard** (oder **Keine**) lassen, **Hintergrundgrafiken** einschalten –
   sonst bleiben die Balken weiß.
5. **Speichern** → Dateiname und Ort wählen. Der Dateiname ist bereits sinnvoll vorbelegt
   (Projektname und Datum).

**Drucken ohne Dialog prüfen**: Mit **Vorschau bauen** wird der Aufbau erzeugt, ohne dass der
Druckdialog aufgeht – man kann ihn dann in Ruhe ansehen (z. B. mit der Druckvorschau des Browsers).

## 12. Häufige Fragen

**Wo liegt meine Datei?** Der Hinweis oben rechts nennt den Speicherort (Ordnerpfad bzw.
„Browser-Speicher“). Im Ordner-Modus ist es eine normale Datei, die man kopieren, sichern oder
in ein Cloud-Laufwerk legen kann.

**Kann ich auf zwei Rechnern arbeiten?** Ja, aber nacheinander: Die Datei kopieren, dort öffnen,
danach zurückkopieren. Die App hat (noch) keine automatische Zusammenführung.

**Warum fragt der Browser nach dem Ordner-Zugriff?** Aus Sicherheitsgründen muss der Zugriff auf
einen Ordner nach einem Neustart einmal bestätigt werden – ein Klick auf **Fortsetzen** bzw.
**Zugriff erlauben** genügt.

**Warum kann ich keine Ordner wählen?** Firefox und Safari unterstützen die Ordner-Freigabe
(noch) nicht. Dort speichert die App im Browser-Speicher; zum Weitergeben `⤓` benutzen.

**Excel/andere Programme?** Die Projektdatei ist JSON. Der Umweg über die Tabelle (Kopieren und
in Excel einfügen) ist am einfachsten; ein CSV-Export ist als Erweiterung vorgesehen.

**Warum sehe ich nach dem Bearbeiten der Dateien meine Änderung nicht?** Der Browser merkt sich
CSS- und JavaScript-Dateien. Beim lokalen Arbeiten einmal mit `Strg`+`F5` neu laden.

**Im PDF sind die Balken weiß.** Im Druckdialog unter „Weitere Einstellungen“ die
**Hintergrundgrafiken** einschalten (Chrome: „Hintergrundgrafiken“, Edge: „Hintergrundgrafiken“).
Ohne diese Option drucken Browser keine Flächenfarben.

**Mein Plan passt nicht auf ein Blatt.** Dann entstehen automatisch weitere Blätter – das ist
gewollt und wird vorher angezeigt. Weniger Blätter erreicht man mit: größerem Blatt (A3),
gröberem Zeitraster (Monate), gröberer Feinheit, kürzerem Zeitraum, weniger Inhaltsteilen
(z. B. nur Gantt + Legende) oder der Beschränkung auf gefilterte Aufgaben.

**Gilt das Farblayout pro Projekt oder für alles?** Für alles – es ist eine Einstellung der App,
kein Bestandteil der Projektdatei. So bleibt ein Plan bei jedem Nutzer gleich und die Datei
bleibt frei von Aussehensfragen.

**Kann ich ein eigenes Farblayout bauen?** Ja, über `css/themes.css`: dort einen Block nach dem
Muster der anderen ergänzen und in `js/themes.js` einen Eintrag mit Name und Beschreibung
hinzufügen – schon erscheint es in der Auswahl.

**Meilenstein lässt sich nicht verlängern?** Richtig – Meilensteine haben keine Dauer. Über
**Art** im Detailbereich lässt sich die Aufgabe wieder in eine normale Aufgabe umwandeln.
