# Handbuch

Alles, was die App kann – von der ersten Aufgabe bis zur Sicherung.

## 1. Erste Schritte

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
| `F1` | Kurzanleitung |
| `Esc` | Dialog schließen / Auswahl aufheben |

## 10. Häufige Fragen

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

**Meilenstein lässt sich nicht verlängern?** Richtig – Meilensteine haben keine Dauer. Über
**Art** im Detailbereich lässt sich die Aufgabe wieder in eine normale Aufgabe umwandeln.
