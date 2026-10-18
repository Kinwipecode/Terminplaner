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

**Welche Version läuft?** Die Nummer steht **unten rechts in der Statuszeile** (z. B. „Version 02“),
außerdem auf dem Startbildschirm, unten in der Kurzanleitung und im Detailfenster. Sie hilft, wenn
du zwei Stände vergleichst – z. B. die eigene Kopie gegen die veröffentlichte Seite: passen die
Nummern nicht zusammen, ist eine davon älter.

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

**Bedienung mit der Maus und der „Heute“-Knopf**

| Eingabe | Wirkung |
|---|---|
| **◉ Heute** (Werkzeugleiste) oder `Leertaste` | springt zum heutigen Datum. Im Gantt wird heute mittig gezeigt und zur ersten Aufgabe gescrollt, die heute läuft; im Kalender springt der Monat auf heute; in Tabelle und Board wird die erste Aufgabe ab heute angesteuert und markiert. |
| **Strg** gedrückt + linke Maustaste ziehen | **Ausschnitt verschieben** (Hand-Werkzeug). Der Zeiger wird zum Greifer, sobald Strg gedrückt ist. |
| **mittlere Maustaste** ziehen | dasselbe Verschieben, ohne Strg. |
| **Strg** + **Mausrad** | **stufenlos zoomen** – und zwar um den Mauszeiger herum: der Tag unter dem Zeiger bleibt stehen. |
| **Umschalt** + **Mausrad** | seitlich rollen (waagerecht). |
| **Mausrad** allein | senkrecht rollen. |
| Klick auf die Anzeige **Zoom … %** | Maßstab zurücksetzen (entspricht dem gewählten Raster). |
| **⤢ Einpassen** | der ganze Zeitraum passt in die Fensterbreite. |

Der Maßstab lässt sich also auf drei Wegen einstellen: die Rasterknöpfe **Tag/Woche/Monat/Quartal**
(grobe Stufen), **Strg+Mausrad** (stufenlos) oder **Einpassen**. Die Anzeige daneben nennt immer den
aktuellen Wert, z. B. „Zoom 143 %“ – 100 % ist die Stufe des gewählten Rasters.

Wichtig: Beim Ziehen mit **Strg** werden Balken **nicht** verschoben – Strg ist immer die
Ansicht-Steuerung. Zum Verschieben von Terminen also ohne Strg ziehen (oder die Tastatur benutzen).

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

**Wohin eine neue Aufgabe kommt:** immer auf dieselbe Ebene wie die gerade markierte Zeile – ist
die markierte Zeile eine Sammelaufgabe, entsteht die neue Aufgabe also *daneben*, nicht darin.
Eine Unteraufgabe machen Sie anschließend mit `Alt`+`→` bzw. über **＋ Unteraufgabe** im
Detailbereich oder **Unteraufgabe hinzufügen** im Kontextmenü. Ohne Markierung (Esc) landet die
neue Aufgabe am Ende des Plans, ganz außen.

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
- **Schließen**: `🚪` in der Leiste oben schließt das **Projekt**, nicht die App – vorher wird
  noch einmal gespeichert und das automatische Speichern angehalten. Danach erscheint der
  Startbildschirm; dort geht es über **Fortsetzen**, `📂` oder `＋` weiter. Praktisch, wenn du
  zwischen mehreren Projekten wechselst oder den Rechner jemand anderem überlässt.
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
| **Umschalt**+`←` / `→` | Termin um **einen Arbeitstag** verschieben |
| **Umschalt**+`Strg`+`↑` / `↓` | Termin um **eine Woche** verschieben |
| **Umschalt**+`Strg`+`←` / `→` | Termin um **einen Monat** verschieben |
| **Umschalt**+`↑` / `↓` | Auswahl erweitern bzw. verkleinern |
| `Alt`+`L` | Schloss der markierten Aufgabe(n) umschalten (sperren / öffnen) |
| **Strg**+`A` | alle sichtbaren Aufgaben markieren |
| **Strg**+`C` / `Strg`+`V` / **Strg**+`D` | Auswahl kopieren / einfügen / duplizieren |
| `Entf` | markierte Aufgaben löschen |
| `1` … `4` | Ansicht wechseln |
| `Leertaste` | zu „Heute“ springen |
| `Strg`+`P` | drucken bzw. PDF erzeugen |
| `F1` | Kurzanleitung |
| `Esc` | Dialog schließen / Auswahl aufheben / Ablegen abbrechen |

Die Tastenkürzel gelten auch dann, wenn das **Detailfenster** vorn ist (§ 16): Tastendrücke dort
werden ins Planungsfenster weitergereicht. Nur beim **Tippen in einem Eingabefeld** im
Detailbereich bleibt das Tippen dort und verschiebt nichts.

## 10. Ansicht steuern: Heute, Verschieben des Ausschnitts, Zoom

**◉ Heute** in der Werkzeugleiste (oder `Leertaste`) springt immer zum heutigen Datum – auch wenn
heute außerhalb des geplanten Zeitraums liegt (der Zeitstrahl enthält „heute“ immer). Je nach
Ansicht passiert dabei:

- **Gantt**: heute wird in die Mitte geholt und zur ersten Aufgabe gescrollt, die heute läuft.
- **Kalender**: der Monat springt auf heute.
- **Tabelle / Board**: die erste Aufgabe ab heute wird angesteuert, markiert und ausgewählt.

**Ausschnitt verschieben (Hand-Werkzeug):** `Strg` gedrückt halten und mit der linken Maustaste
ziehen – oder die mittlere Maustaste ziehen. Der Zeiger wird zum Greifer, sobald `Strg` gedrückt ist.
Achtung: mit `Strg` werden Balken nicht verschoben; zum Ändern von Terminen ohne `Strg` ziehen.

**Zoom:**

- `Strg` + **Mausrad**: stufenlos zoomen, um den Mauszeiger herum (der Tag unter dem Zeiger bleibt stehen).
- Rasterknöpfe **Tag / Woche / Monat / Quartal**: grobe Stufen.
- **⤢ Einpassen**: der ganze Zeitraum passt in die Fensterbreite.
- Anzeige **Zoom … %** daneben: 100 % = Stufe des gewählten Rasters; ein Klick setzt zurück.
- `Umschalt` + Mausrad rollt seitlich, das Mausrad allein senkrecht.

## 11. Termine verschieben

Drei Wege, alle mit demselben Ergebnis:

1. **Tastatur**: Aufgabe auswählen, dann `Umschalt`+`←`/`→` (ein Arbeitstag),
   `Umschalt`+`Strg`+`↑`/`↓` (eine Woche) oder `Umschalt`+`Strg`+`←`/`→` (ein Monat).
2. **Rechtsklick** auf eine Zeile (Gantt oder Tabelle) → *Termin: 1 Tag/Woche/Monat
   später bzw. früher* oder **Termin verschieben…**.
3. **Detailbereich** rechts: die Knöpfe `− 1 Monat` bis `+ 1 Monat`, oder **Verschieben…** für
   einen eigenen Betrag mit Richtung und Vorschau des neuen Termins.

Geregelt wird dabei immer:

- Verschoben wird in **Arbeitstagen** – Wochenenden und Feiertage werden übersprungen.
  Bei Monaten bleibt der Tag im Monat erhalten (der 15. bleibt der 15.).
- Der neue Termin wird als **Festlegung** gespeichert („beginnt nicht vor …“), damit er hält.
  Im Detailbereich unter *Termin-Festlegung* lässt sich das wieder auf „So früh wie möglich“ stellen.
- **Nachfolger wandern mit**, wenn die Auto-Planung eingeschaltet ist (Werkzeugleiste bzw. direkt
  im Verschieben-Fenster). Ist sie aus, bleibt alles stehen und die App meldet nur Widersprüche.
- Sammelaufgaben verschieben alle ihre Unteraufgaben mit.

## 12. Sperren: das Schloss

Manche Termine sollen sich nicht mehr verschieben lassen – etwa ein bereits zugesagter Kundentermin
oder eine Meilenstein-Zusage. Dafür gibt es das **Schloss**.

**Sperren** – Aufgabe markieren, dann einer dieser Wege:

| Weg | So geht es |
|---|---|
| Leiste oben | Knopf **🔒 Sperren** |
| Tastatur | `Alt`+`L` |
| Rechtsklick | Kontextmenü → **🔒 Sperren** |
| Detailbereich | unter **Sperren (Schloss)** auf **🔒 Sperren** |

Mehrere auf einmal: mit **Strg**+Klick (einzelne) oder **Umschalt**+Klick (Bereich) markieren, dann
sperren – der Knopf in der Leiste sperrt immer die ganze Auswahl.

**Angezeigt wird es überall:** gesperrte Aufgaben tragen in **Gantt, Tabelle, Kalender und Board**
ein **🔒** neben dem Namen (im Gantt zusätzlich ein gestrichelter Balkenrand, in der Tabelle eine
farbige Kante). Auch im **gedruckten Plan und PDF** steht das Zeichen.

**Was „gesperrt“ heißt:** Termin, Dauer, Name, Fortschritt, Status, Beteiligte und Vorgänger lassen
sich nicht ändern; die Aufgabe lässt sich auch nicht löschen, ein-/ausrücken oder in der
Zeilenfolge verschieben. Jeder Versuch wird abgelehnt und unten rechts gemeldet, zum Beispiel:

> **Aufgabe ist gesperrt** — „Kundentermin“ ist gesperrt – verschieben ist nicht möglich.
> Zuerst das Schloss öffnen.

**Zusammenhängende Termine.** Weil die Auto-Planung Nachfolger mitzieht, prüft die App vor dem
Verschieben die **ganze Kette**: die markierte Zeile samt Unteraufgaben, die Sammelaufgaben darüber
und alle Nachfolger, die terminlich nachrücken würden. Ist **einer** davon gesperrt, wird gar nicht
verschoben – die Meldung nennt genau die Aufgabe, die im Weg steht („„Zulieferung“ ist gesperrt –
verschieben ist nicht möglich …“). Nach dem Öffnen dieses Schlosses geht das Verschieben wieder.
Ist die Auto-Planung **aus**, bewegt ein Verschieben ohnehin nur die markierte Zeile und ihre
Unteraufgaben – dann zählen nur diese (und die Sammelaufgaben darüber).

**Schloss öffnen:** dieselben vier Wege wie oben – oder einfach auf das **🔒** neben dem Namen
klicken. `Strg`+`Z` macht auch das Sperren rückgängig.

**Während der Plan rechnet**, bleiben gesperrte Termine immer stehen: ergäbe die Rechnung einen
anderen Termin, wird das nur **gemeldet** (gelbe Warnung im Detailbereich und in der Statuszeile),
geändert wird nichts. Die Aufgabe gilt dann als Konflikt und wird im Gantt gestrichelt umrandet.

**Sammelaufgaben und Kopien.** Eine gesperrte Sammelaufgabe hält auch ihre Unteraufgaben fest –
deren Verschieben würde ja ihren Zeitraum ändern. Eine neue Unteraufgabe lässt sich in eine
gesperrte Sammelaufgabe nicht einfügen (erst Schloss öffnen). **Kopien** (Duplizieren, Kopieren und
Einfügen) sind dagegen immer ungesperrt: das Schloss wird nicht mitkopiert.

## 13. Mehrere Aufgaben markieren (wie im Explorer)

Es lassen sich beliebig viele Aufgaben gleichzeitig markieren – zum Löschen, Kopieren oder um Status,
Priorität, Fortschritt und Farbe für alle in einem Rutsch zu setzen.

| Eingabe | Wirkung |
|---|---|
| **Klick** | markiert genau diese Aufgabe (sie wird der **Anker**) |
| **Strg**+**Klick** | fügt eine einzelne Aufgabe hinzu bzw. nimmt sie wieder heraus |
| **Umschalt**+**Klick** | markiert alles **von der Anker-Aufgabe bis hierher** |
| **Strg**+**Umschalt**+**Klick** | diesen Bereich zur bestehenden Auswahl hinzufügen |
| **Umschalt**+`↑` / `↓` | Auswahl zeilenweise erweitern bzw. verkleinern |
| **Strg**+`A` | alle sichtbaren Aufgaben markieren (auch bei aktivem Filter) |
| `Esc` oder Klick ins Leere | Auswahl aufheben |
| **Strg**+`C` | Auswahl kopieren |
| **Strg**+`V` | kopierte Aufgaben als neue Aufgaben einfügen |
| **Strg**+`D` | Auswahl duplizieren – die Kopien stehen hinter den Originalen |
| `Entf` | Auswahl löschen (mit Rückfrage; `Strg`+`Z` holt sie zurück) |

Markiert wird in **allen vier Ansichten**: im Gantt, in der Tabelle, im Kalender und im Board.
Ein Rechtsklick auf eine markierte Aufgabe stellt die Mehrfach-Einträge oben ins Menü.

**Sammelbearbeitung im Detailbereich**

Sind mehrere Aufgaben markiert, zeigt der Bereich rechts statt der Einzelheiten eine
Sammelbearbeitung:

- **Aktionen**: Duplizieren, Kopieren, Einfügen, Löschen, Auswahl aufheben
- **Termin verschieben (alle)**: ± 1 Tag / 1 Woche / 1 Monat für die ganze Auswahl
- **Status**, **Priorität**: „– unverändert –“ lässt die Aufgaben, wie sie sind
- **Fortschritt setzen**: 0 / 25 / 50 / 75 / 100 %
- **Farbe**: eine Farbe für alle oder wieder „automatisch“
- **Markiert**: die Liste der markierten Aufgaben, jede einzeln entfernbar (✕) oder allein
  auswählbar (◎)

Die Statuszeile unten zeigt jederzeit „*n* markiert“ samt der wichtigsten Kürzel.

**Gut zu wissen**

- **Löschen** fragt bei mehreren Aufgaben nach und lässt sich mit `Strg`+`Z` rückgängig machen.
  Unteraufgaben markierter Sammelaufgaben werden mitgelöscht.
- **Duplizieren** nimmt Unteraufgaben mit und hängt „(Kopie)“ an den Namen.
- **Kopieren** legt die Auswahl zusätzlich als Text in die Windows-Zwischenablage (Tabulator-
  getrennt), sodass sie sich z. B. in Excel einfügen lässt. Innerhalb der App bleiben die
  Verknüpfungen zwischen den kopierten Aufgaben erhalten; Verknüpfungen zu Aufgaben außerhalb
  der Auswahl entfallen.
- **Verschieben** gilt nur für die markierten Aufgaben – Unteraufgaben einer markierten
  Sammelaufgabe wandern automatisch mit, auch wenn sie selbst nicht markiert sind.
  Beim **Ziehen mit der Maus** bewegt sich dagegen nur der gegriffene Balken.

## 14. Zeilenhöhe

**Setup** → *Zeilenhöhe in Listen und Gantt*: **kompakt** (24 px), **normal** (30 px),
**geräumig** (38 px) oder **sehr groß** (46 px). Die Einstellung wirkt sofort in Gantt, Tabelle,
Kalender und Board und wird **im Projekt gespeichert** – beim nächsten Öffnen ist sie wieder da.

## 15. Ideen-Sammelbecken (zweites Fenster)

Der Gedanke: Aufgaben, die es gibt, aber noch keinen Termin haben, sollen nicht verloren gehen.
Sie stehen in einem eigenen Fenster, das man auf den zweiten Bildschirm schieben kann.

**Öffnen:** links auf **Ideen**. Es öffnet sich ein eigenes Browserfenster (mit der Ideenliste).
Das Planungsfenster bleibt offen – das Sammelbecken-Fenster ist eine Ergänzung.

**Aufschreiben:** oben eintippen, `Eingabe` – fertig. Kein Termin nötig, nur der Text.
Der Text lässt sich mit **✎** ändern, mit **✓** als erledigt markieren, mit **🗑** löschen.

**Dauer (freiwillig):** Unter jeder Idee steht **Dauer** mit einem Zahlenfeld und der Einheit
(**Tag(e)**, **Woche(n)**, **Monat(e)**). Beides darf **leer bleiben** – dann wird die Aufgabe beim
Einplanen 1 Arbeitstag lang. Steht eine Dauer drin, bekommt die daraus entstehende Aufgabe genau
diese Länge; daneben steht zur Kontrolle die Umrechnung in Arbeitstage („= 15 Arbeitstage“):

| Eingabe | ergibt |
|---|---|
| 3 Tage | 3 Arbeitstage |
| 1 Woche | 5 Arbeitstage |
| 2 Wochen | 10 Arbeitstage |
| 1 Monat | 20 Arbeitstage |
| *(leer)* | 1 Arbeitstag |

Die Dauer gehört zum Eintrag: sie gilt für **jeden** Termin, den man daraus anlegt, und wird mit
dem Projekt gespeichert (im allgemeinen Vorrat im Browser). Im Gantt sieht man das Ergebnis sofort
an der Balkenlänge.

**Einplanen – zwei Wege:**

1. **Ziehen**: Eintrag mit der Maus greifen und im Planungsfenster auf die gewünschte Zeile und
   Position fallen lassen. Eine Linie zeigt die Zielzeile, ein kleines Schild das Datum und den
   Platz („nach ‚Screendesign‘“). Dort entsteht eine Aufgabe – **so lang wie die eingetragene
   Dauer**, ohne Angabe einen Arbeitstag lang.
2. **Klicken**: Eintrag anklicken → er ist „bereit zum Ablegen“ (unten erscheint ein Hinweis).
   Dann im Gantt, in der Tabelle oder im Kalender auf die gewünschte Stelle klicken.
   `Esc` bricht ab.

**Mehrfach verwenden:** Der Eintrag bleibt immer erhalten – man kann ihn beliebig oft einplanen.
Die **Zahl in Klammern** zeigt, wie oft er schon im Plan steht: im Sammelbecken, am Balken in der
Liste und im Detailbereich. Eingeplante Aufgaben sind **türkis** gefärbt und damit auf einen Blick
von den übrigen zu unterscheiden.

**Zwei Ablagen:**

| Ablage | Gilt für | Gespeichert in |
|---|---|---|
| **Projekt-Sammelbecken** | dieses Projekt | Projektdatei (`*.tplan.json`) |
| **Allgemeiner Vorrat** | alle Projekte | Browser-Speicher |

Einträge lassen sich mit **↥**/**↧** zwischen beiden verschieben. Mit
**Allgemeinen Vorrat ins Projekt holen** (im Ideen-Dialog) oder beim Öffnen eines neuen Projekts
wandert der Vorrat ins Projekt.

**Wenn kein Planungsfenster offen ist:** Das Sammelbecken-Fenster zeigt das an und lässt den
allgemeinen Vorrat trotzdem bearbeiten; das Projekt-Sammelbecken braucht das Planungsfenster
(denn die Daten gehören zur Projektdatei).

## 16. Detailbereich in einem eigenen Fenster (zweiter Bildschirm)

Der Detailbereich (alles zur markierten Aufgabe) steht **standardmäßig in einem eigenen
Browserfenster** – so hat der Plan im Hauptfenster den ganzen Bildschirm. Das Fenster lässt sich
frei ziehen, z. B. auf einen zweiten Bildschirm; die Stelle wird gemerkt.

**So läuft es ab:**

1. Beim **ersten Markieren einer Aufgabe** geht das Fenster von selbst auf und zeigt sie.
2. Danach folgt es der Markierung: Klick auf eine andere Zeile in Gantt, Tabelle, Kalender oder
   Board – das Fenster zeigt sofort die neue Aufgabe.
3. **Schließen ist ungefährlich.** Wurde das Fenster (auch versehentlich) geschlossen, geht es
   beim **nächsten** Markieren wieder auf – und steht dann an der zuletzt benutzten Stelle.
4. Beim **Beenden des Programms** (Fenster/Tab schließen) wird es mit geschlossen.

Die **Tastenkürzel des Plans** wirken auch bei vorgeschaltetem Detailfenster: `Umschalt`+`←`/`→`
verschiebt den Termin der markierten Aufgabe, `Entf` löscht sie und so weiter – das Fenster reicht
die Tastendrücke weiter. Nur beim Tippen in einem **Eingabefeld** im Detailbereich bleibt der
Tastendruck dort (dort wird getippt und nichts verschoben).

**Abschalten:** links auf **🗗 Detail** (der Knopf ist hervorgehoben, solange das Fenster läuft).
Ein Klick holt den Bereich wieder als rechte Spalte ins Planungsfenster und schaltet den
Fensterbetrieb dauerhaft aus; ein weiterer Klick schaltet ihn wieder an. Die Einstellung gilt
auch nach dem nächsten Start.

**Gut zu wissen:**

- Es ist **derselbe** Bereich, nur an anderer Stelle: jede Änderung im Fenster wirkt sofort im
  Plan und umgekehrt (Termine, Fortschritt, Vorgänger, Notizen, Farbe …). Es gibt keine zweite
  Kopie der Daten.
- Markiert wird weiterhin im Planungsfenster – dort, wo die Aufgabenliste ist.
- Blockiert der Browser das Fenster (**Popup-Blocker**), erscheint ein Hinweis und der Bereich
  steht sichtbar rechts im Plan – nichts geht verloren. Nach dem Erlauben von Pop-ups einfach
  wieder auf **🗗 Detail** klicken.
- Das **Farblayout** wird mitgenommen und folgt späteren Wechseln.
- **Dialoge** (z. B. *Vorgänger hinzufügen*, *Termin verschieben*) erscheinen weiterhin im
  Planungsfenster.

## 17. Farblayout der Oberfläche

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

## 18. Drucken und PDF erzeugen

Links auf **Drucken**, oben auf **🖨** oder `Strg`+`P`. Der Aufbau entsteht dabei automatisch –
auch beim direkten `Strg`+`P` des Browsers, dort mit den zuletzt gewählten Einstellungen.

**Blattformat**: **A4** oder **A3**, je **hoch** oder **quer** – oder ein **eigenes Maß**. Dafür im
Druckfenster **„✎ eigenes Maß“** wählen und **Breite**, **Höhe** und **Rand** in Millimetern
eintragen (50–2000 mm, Rand höchstens 50 mm, z. B. 400 × 300 mm für einen Plotter). Eine **Bezeichnung** (z. B. „Plotter“)
erscheint später im Kopf der Blätter. **⇄ hoch/quer tauschen** vertauscht Breite und Höhe. Die
Seiten werden exakt in Millimetern gebaut; es gibt keine halben Blätter, keine abgeschnittenen
Zeilen und keine Überläufe.

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

**Vorschau ansehen, bevor gedruckt wird**

Im Druckfenster auf **🔍 Vorschau anzeigen** – die fertigen Blätter erscheinen am Bildschirm, genau
so, wie sie aufs Papier kommen (dieselben Seiten, nur am Bildschirm dargestellt). Oben in der Leiste:

| Bedienung | Wirkung |
|---|---|
| **▲ / ▼** oder `Bild ↑` / `Bild ↓` | voriges / nächstes Blatt |
| **− / +** | kleiner / größer zoomen |
| **Einpassen** | ganze Blattbreite ins Fenster einpassen (Voreinstellung beim Öffnen) |
| `+` / `-` | zoomen über die Tastatur |
| **🖨 Drucken / PDF erzeugen** oder `Strg`+`P` | Druckdialog öffnen |
| **⚙ Einstellungen** | zurück zum Druckfenster (die Vorschau schließt sich) |
| `Esc` oder **✕** | Vorschau schließen |

Die Blätter werden in ihrer echten Größe gezeigt (100 % = Originalgröße in Millimetern), die
Leiste nennt Anzahl, Format und Rand, z. B. „3 Blatt · Plotter · 400 × 300 mm · Rand 10 mm“.
Nichts wird gedruckt, solange du nicht **Drucken / PDF erzeugen** anklickst.

**Passt der Inhalt nicht auf ein Blatt**, entstehen weitere Blätter:

- **Gantt**: die Aufgabenliste wiederholt sich auf jedem Blatt links, die Zeitachse läuft nach
  rechts weiter. Auf jedem Blatt steht im Kopf, welcher Zeitraum und welche Aufgabengruppe zu sehen ist.
- **Tabelle**: läuft nach unten weiter, die Spaltenköpfe wiederholen sich.
- **Kalender**: ein Monat je Blatt. **Board**: läuft nach unten weiter.

**So entsteht die PDF-Datei** (Windows):

1. Im Druckfenster **🔍 Vorschau anzeigen** – dort siehst du die Blätter und kannst alles prüfen.
2. In der Vorschau **🖨 Drucken / PDF erzeugen** (oder `Strg`+`P`) – der Druckdialog des Browsers öffnet sich.
3. Als Drucker **„Microsoft Print to PDF“** wählen (oder einen anderen PDF-Drucker).
4. Papierformat prüfen: es wird automatisch auf das eingestellte Format gesetzt
   („Papierformat: A4/A3“ und „Layout: Hochformat/Querformat“). Bei einem **eigenen Maß** steht das
   Papierformat auf „Benutzerdefiniert“ – beim PDF-Drucker ist das die eingegebene Größe, bei einem
   echten Drucker muss das Papier im Gerät liegen und dort passend gewählt sein.
5. Ränder auf **Standard** (oder **Keine**) lassen, **Hintergrundgrafiken** einschalten –
   sonst bleiben die Balken weiß.
6. **Speichern** → Dateiname und Ort wählen. Der Dateiname ist bereits sinnvoll vorbelegt
   (Projektname und Datum).

**Ohne Vorschau drucken**: Im Druckfenster gibt es zusätzlich **Direkt drucken / PDF** – das geht
sofort in den Druckdialog, mit den aktuellen Einstellungen. Und ein `Strg`+`P` außerhalb des
Druckfensters öffnet dieses Fenster (nicht sofort den Druckdialog), damit die Einstellungen stimmen.

## 19. Häufige Fragen

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

**Warum sind manche Balken türkis?** Diese Aufgaben stammen aus dem Ideen-Sammelbecken
(Abschnitt 12). Die Zahl in Klammern daneben sagt, wie oft diese Idee schon eingeplant wurde.
Ein eigenes Farbschema lässt sich der Aufgabe trotzdem geben – im Detailbereich unter *Farbe*.

**Ich habe eine Idee gelöscht – sind die Aufgaben weg?** Nein. Löschen betrifft nur den Eintrag im
Sammelbecken; bereits eingeplante Aufgaben bleiben im Plan (sie verlieren nur den Verweis und den
Zähler).

**Kann das Sammelbecken-Fenster allein arbeiten?** Nur für den allgemeinen Vorrat. Das
Projekt-Sammelbecken gehört zur Projektdatei und braucht das Planungsfenster – das Fenster zeigt
deutlich an, ob eine Verbindung besteht („mit Planungsfenster verbunden“).

**Der Klick auf „Ideen“ öffnet kein Fenster.** Dann blockiert der Browser Pop-ups. Im gleichen
Dialog erscheint die Liste auch direkt im Planungsfenster (Knopf **Ideenliste** im Hinweis bzw.
der Dialog nach dem Blockieren) – oder Pop-ups für diese Seite erlauben.
