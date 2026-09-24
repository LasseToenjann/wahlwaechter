# Arbeitsanleitung für WAHLWÄCHTER

Gemeinsame Anleitung für jedes Werkzeug, das an diesem Repo arbeitet.
**Vor Änderungen [HANDOVER.md](HANDOVER.md) lesen** — dort steht der aktuelle Stand.
Aufbau: [docs/TECHNIK.md](docs/TECHNIK.md) · Begründung: [KONZEPT.md](KONZEPT.md) ·
Regeln: [docs/SPIELANLEITUNG.md](docs/SPIELANLEITUNG.md).

---

## Projekt

**WAHLWÄCHTER** – ein Browser-Spiel zum Thema „KI meets Democracy" (Schul-Projektkurs,
nicht kommerziell). Man leitet eine Prüfstelle für Wahlintegrität, enttarnt
KI-Desinformation mit vier Prüfwerkzeugen und darf dabei die Meinungsfreiheit nicht
beschädigen.

Live: **https://lassetoenjann.github.io/wahlwaechter/** · Repo: `LasseToenjann/wahlwaechter`
(privates GitHub-Konto, ohne Bindestrich). GitHub Pages veröffentlicht `main` direkt,
ein Push ist nach ein bis zwei Minuten live.

Alle Spielinhalte sind **frei erfunden**; die dargestellten Manipulations*techniken*
sind real und in jeder Auflösung mit Quelle belegt. Das ist der didaktische Kern –
beim Schreiben neuer Inhalte nicht aufweichen.

## Wo was steht

| Frage | Datei |
|---|---|
| Aktueller Stand, offene Punkte, nächste Schritte | `HANDOVER.md` |
| Überblick, Einstieg, Projektstruktur | `README.md` |
| Warum das Spiel so gebaut ist (Abgabe-Dokument) | `KONZEPT.md` |
| Vollständige Spielregeln, Teil für Lehrkräfte | `docs/SPIELANLEITUNG.md` |
| Architektur, Protokolle, Datenmodell, bekannte Grenzen | `docs/TECHNIK.md` |
| Was sich wann geändert hat | `docs/AENDERUNGEN.md` |
| Prüfungen | `tests/pruefung.js`, `tests/test-speicher.js` |

## Grundsätze

1. **Mobile und iPad zuerst.** Gespielt wird auf Handys und iPads, nicht am PC.
   Neue Screens bei **390 px** bauen, bei **320 px** gegenprüfen, erst dann am Desktop
   ansehen. Tippziele mindestens 44 px, wichtige Knöpfe unten, nichts nur über Hover.
   Nach jeder Layout-Änderung auf horizontalen Überlauf prüfen (Prüfmuster in
   `docs/TECHNIK.md` → „Mobile zuerst"). Safe-Area (`env(safe-area-inset-*)`) nicht
   vergessen. Im Zweifel am Desktop Luft verschenken statt auf dem Handy quetschen.
2. **Vanilla HTML/CSS/JS, kein Build, keine Abhängigkeiten.** Was im Repo liegt, läuft
   im Browser. Keine Frameworks, kein Bundler, kein npm-Projekt. Für die Prüfungen
   reicht Node.
3. **Kein eigenes Backend.** Mehrspieler, Ranglisten und Profile laufen über den
   kostenlosen Key-Value-Speicher textdb.online, gebündelt in `js/tdb.js`. Kein WebRTC
   (scheitert real in Schul-WLANs).
4. **Deutsch überall** – Kommentare, Bezeichner in den Spieldaten, alle Texte.
   Kommentare erklären das Warum, nicht das Was – besonders bei allem, was gegen
   Netz-Eigenheiten abgesichert ist (gedrosselte Hintergrund-Tabs, Schreibkollisionen).
5. **Skript-Ladereihenfolge** in `index.html`:
   `anim → rng → data → tdb → net → gen → classroom → tutorial → game`.
   `tdb.js` muss vor `net.js` stehen – Duell, Klassenraum und Rangliste bauen darauf auf.
   `tests/pruefung.js` prüft die Reihenfolge.
6. **Spielzahlen gehören in `js/data.js`** (`DATA.scoring`, `DATA.weeks`,
   `DATA.sabotage`, `DATA.endless`), nicht als Zahl in den Code. Die Einweisung liest
   dieselben Werte.

## Echte Daten

Die textdb-Schlüssel (Tabelle in `docs/TECHNIK.md` → „Ranglisten und Profile")
enthalten Spielstände echter Personen. textdb hat **keine Historie** – einmal
geleert ist unwiederbringlich weg. Das ist hier schon einmal passiert.

- Ranglisten, Profile oder Räume **nur auf ausdrückliche Anweisung** leeren oder
  überschreiben – und dann vorher den Rohwert als Datei sichern.
- **Beim Prüfen im Browser zuerst `tests/test-speicher.js` in die Konsole einfügen**,
  bevor ein Spiel betreten wird. Sonst trägt sich der Testlauf in die echte
  Rangliste und die echten Profile ein. Nach jedem Neuladen erneut.
- Lesen ist unbedenklich (z. B. um Größe und Zustand der echten Schlüssel zu prüfen).
- `tests/pruefung.js` geht nie ins Netz.

## Fallstricke, die schon Zeit gekostet haben

1. **Hintergrund-Tabs werden auf ~1 Timer pro Sekunde, später pro Minute gedrosselt.**
   Deshalb steht der Stale-Timeout im Duell bei 90 s und es gibt einen Resync bei
   `visibilitychange`. Nicht „optimieren". Nebenwirkung: Die Spiel-Timer zählen pro
   Takt herunter und laufen in einem verborgenen Tab entsprechend langsamer.
2. **Nachrichten immer vor `bye`/`stale` verarbeiten** (`net.js`), sonst geht das
   Endergebnis verloren, wenn die Gegenseite direkt nach dem Senden schließt.
3. **Overlays sind während der Ausblendung noch im DOM.** Offenheit mit
   `overlayOpen(id)` prüfen, nie mit `classList.contains("hidden")`.
4. **Der Klassenraum-Zustand ist EIN JSON-Wert in einer URL.** Deshalb sind die
   Feldnamen einbuchstabig. Beim Ergänzen die Größe im Blick behalten; dasselbe gilt
   für die Profile (siehe „Bekannte Grenzen" in `docs/TECHNIK.md`).
5. **Zeitvergleiche über Geräte hinweg vermeiden.** Fristen laufen ab dem Moment, in
   dem das eigene Gerät einen Zustand *sieht* – nicht ab einem fremden Zeitstempel.
6. **`+` und `%` in allem, was auf textdb landet.** Der Dienst dekodiert den Wert
   zweimal und macht dabei aus `+` ein Leerzeichen; ein `%` im Namen zerreißt das
   JSON oder lässt den Dienst den Wert ganz verwerfen. Alles läuft deshalb über
   `js/tdb.js` — nie eine eigene Kopie von Lesen/Schreiben anlegen. Namen, die mit
   gespeicherten verglichen werden, vorher mit `cleanName()` bereinigen.
7. **Unlesbar ist nicht leer.** Wer bei einem Lesefehler eine leere Liste
   zurückgibt, löscht beim nächsten Schreiben die ganze Rangliste. `TDB.lies()`
   liefert `null` nur bei leerem Schlüssel und wirft sonst.
8. **Gleichzeitige Schreibvorgänge desselben Geräts.** Am Duell-Ende kommen zwei
   Profil-Änderungen fast gleichzeitig; parallel ausgeführt las die zweite den alten
   Stand und überschrieb die erste (im Test: „0 Runden gespielt" nach einem Duell).
   Profil-Änderungen laufen deshalb über eine Warteschlange, und die Kontrolle nach
   dem Schreiben prüft die geänderten Werte selbst, nicht nur das Datum.
9. **Asynchrone Anzeigen, die mehrfach gestartet werden.** Die Rangliste lud bei
   schnellem Filterwechsel die Antwort des älteren Abrufs zuletzt und zeigte die
   falsche Liste. Nur der zuletzt gestartete Abruf darf anzeigen (`boardRequest`).
10. **Tages-Challenge nicht nebenbei ändern.** Der Fallsatz eines Tages muss für alle
    gleich sein. Wer `buildDailyDeck` oder die Fall-Liste anfasst, ändert sonst den
    Satz des laufenden Tages – wer danach spielt, bekommt andere Fälle als die, die
    schon gespielt haben. Algorithmus-Änderungen nur ab einem künftigen Zyklus
    wirksam machen (Vorbild: `DAILY_SEAM_FROM_CYCLE`); `tests/pruefung.js` hält
    Fingerabdrücke fester Tage fest. **Achtung:** Auch ein neuer Fall in `DATA.cases`
    verschiebt die Rotation – dann die Fingerabdrücke bewusst neu setzen und das
    Datum des Wechsels in `docs/AENDERUNGEN.md` vermerken.
11. **Versionsparameter vergessen.** Die Verweise auf CSS und JS in `index.html`
    tragen `?v=…`. GitHub Pages cacht rund 10 Minuten, iPads oft länger – ohne
    Hochzählen spielen Teile der Klasse mit alten Skripten.
12. **iOS ist der strengere Browser.** Beschriftungen als reiner Textknoten in einem
    Flex-Knopf werden mit Emoji falsch gemessen und abgeschnitten (deshalb sind
    `.btn` bewusst kein Flexbox); Zahlenbereiche wie „2900–3599" werden ohne
    `format-detection`-Meta zu Anruf-Links; ohne `env(safe-area-inset-*)` liegt die
    erste Zeile hinter der Uhr.

## Prüfen

```
node tests/pruefung.js        # 39 Prüfungen, unter 1 Sekunde, Rückgabewert 1 bei Fehlern
python -m http.server 8123    # dann http://localhost:8123 – Test-Speicher einfügen!
```

`tests/pruefung.js` lädt alle Skripte in einer Sandbox und prüft Ladereihenfolge und
Versionsparameter, Syntax, die Fall-Dossiers (Pflichtfelder, reale Vorbilder), den
Showdown-Baukasten, den Fall-Generator, die Tages-Challenge, den Speicherdienst und
**ungenutzten Code** (Funktionen, Konstanten, Methoden, HTML-IDs, CSS-Klassen). Wer
einen neuen Fehler findet, ergänzt dort eine Gruppe.

Vor jedem Push im Browser durchspielen – **in Handy-Breite**, nicht am Desktop, und
mit eingefügtem Test-Speicher. Die Spiellogik ist aus der Konsole ansteuerbar (`G`,
`DATA`, `Net`, `ClassNet`, `Tutorial` sind global):

1. Einweisung von Schritt 1 bis 12
2. Solo klassisch **bis ins Boss-Finale** – dazu muss man richtig antworten, sonst
   endet der Lauf vorher in der Vertrauenskrise und das Finale wird nie getestet
3. Endlos, Tages-Challenge (inkl. Ein-Versuch-Sperre)
4. Duell mit zwei Tabs: Lobby, Regeländerung durch den Host, Start, Showdown,
   danach beide Profile prüfen (Runden **und** Bilanz)
5. Klassenraum mit drei Tabs: Lobby, Regeländerung, Start, Showdown, Auto-Fill
   (jemand gibt nicht ab), Nachzügler-Einzug (jemand bleibt in den Fällen stecken)
6. Rangliste über alle Filter (auch schnell hintereinander), Profil
7. Überlauf-Prüfung bei 320 px und 390 px

Die Browser-Konsole muss dabei leer bleiben.

## Nach jeder Änderung

1. `node tests/pruefung.js`, dazu der passende Teil der Browser-Prüfung
2. `?v=` in `index.html` hochzählen (alle zehn Verweise)
3. [docs/AENDERUNGEN.md](docs/AENDERUNGEN.md) ergänzen — mit gemessenen Zahlen
4. betroffene Dokumente mitziehen und prüfen, ob ältere Stellen dadurch falsch
   geworden sind (Spielregel → SPIELANLEITUNG, Technik → TECHNIK, neuer Modus oder
   neues Konzept → KONZEPT und README; Anzahlen, Tabellen, „was offen ist")
5. [HANDOVER.md](HANDOVER.md) überschreiben, nicht anhängen
6. committen und auf `main` pushen — unter Lasses Namen
   (`LasseToenjann <LasseToenjann@users.noreply.github.com>`), mit klaren deutschen
   Commit-Nachrichten, ohne Mitautoren- oder Sitzungszeilen und ohne Werkzeugnamen
   in Commits oder Doku. Keine Pull Requests ohne ausdrückliche Bitte.
