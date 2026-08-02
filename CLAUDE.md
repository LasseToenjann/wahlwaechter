# Arbeitsanleitung für dieses Repository

Diese Datei ist der Einstieg für jede neue Sitzung. Sie sagt, **was das Projekt ist,
wie hier gearbeitet wird und wo der Stand steht.** Vor jeder Änderung einmal lesen.

## Was das ist

**WAHLWÄCHTER** – ein Browser-Spiel zum Thema „KI meets Democracy" (Schul-Projektkurs,
nicht kommerziell). Man leitet eine Prüfstelle für Wahlintegrität, enttarnt
KI-Desinformation mit vier Prüfwerkzeugen und darf dabei die Meinungsfreiheit nicht
beschädigen. Live unter **https://lassetoenjann.github.io/wahlwaechter/**.

Alle Spielinhalte sind **frei erfunden**; die dargestellten Manipulations*techniken*
sind real und in jeder Auflösung mit Quelle belegt. Das ist der didaktische Kern –
beim Schreiben neuer Inhalte nicht aufweichen.

## Wo was steht

| Frage | Datei |
|---|---|
| Überblick, Einstieg, Projektstruktur | `README.md` |
| Warum das Spiel so gebaut ist (Abgabe-Dokument) | `KONZEPT.md` |
| Vollständige Spielregeln, Teil für Lehrkräfte | `docs/SPIELANLEITUNG.md` |
| Architektur, Protokolle, Datenmodell, offene Punkte | `docs/TECHNIK.md` |
| Was sich wann geändert hat | `docs/AENDERUNGEN.md` |

**Bei jeder Änderung mitpflegen:** `docs/AENDERUNGEN.md` immer, dazu die betroffene
Doku (Spielregel geändert → SPIELANLEITUNG, Technik geändert → TECHNIK, neuer Modus
oder neues Konzept → KONZEPT und README). Eine Änderung ohne Doku-Nachzug gilt als
unfertig.

## Wie hier gearbeitet wird

- **Vanilla HTML/CSS/JS, kein Build, keine Abhängigkeiten.** Was im Repo liegt, läuft
  im Browser. Keine Frameworks, kein Bundler, kein npm-Projekt einführen.
- **Kein eigenes Backend.** Mehrspieler und Ranglisten laufen über den kostenlosen
  Key-Value-Speicher textdb.online. Kein WebRTC (scheitert real in Schul-WLANs).
- **Deutsch überall** – Kommentare, Bezeichner in den Spieldaten, alle Texte.
- **Kommentare erklären das Warum**, nicht das Was. Besonders bei allem, was gegen
  Netz-Eigenheiten abgesichert ist (gedrosselte Hintergrund-Tabs, Schreibkollisionen).
- Skript-Ladereihenfolge in `index.html` beachten:
  `anim → rng → data → net → gen → classroom → tutorial → game`.

### Daten niemals eigenmächtig löschen

Die textdb-Schlüssel enthalten echte Spielstände von echten Personen. textdb hat
**keine Historie** – einmal geleert ist unwiederbringlich weg. Das ist hier schon
einmal passiert. Ranglisten oder Profile **nur auf ausdrückliche Anweisung** leeren.

### Git

Auf dem jeweils zugewiesenen Feature-Branch entwickeln, mit klaren deutschen
Commit-Nachrichten, dann pushen. Keine Pull Requests ohne ausdrückliche Bitte.

## Testen

Es gibt keine Test-Suite im Repo (bewusst – kein Build, keine Abhängigkeiten).
Bewährt hat sich: lokaler Server plus Playwright-Skripte, die textdb per
Route-Handler durch einen In-Memory-Speicher ersetzen. Damit lassen sich Duell und
Klassenraum mit mehreren Tabs komplett durchspielen, **ohne echte Daten anzufassen**.

```bash
node --check js/*.js          # Syntax
python -m http.server 8123    # dann http://localhost:8123
```

Vor jedem Push mindestens durchspielen:

1. Einweisung von Schritt 1 bis 12
2. Solo klassisch **bis ins Boss-Finale** – dazu muss man richtig antworten, sonst
   endet der Lauf vorher in der Vertrauenskrise und das Finale wird nie getestet
3. Endlos, Tages-Challenge (inkl. Ein-Versuch-Sperre)
4. Duell: Lobby, Regeländerung durch den Host, Start, Showdown
5. Klassenraum: Lobby, Regeländerung, Start, Showdown, Auto-Fill (jemand gibt nicht
   ab), Nachzügler-Einzug (jemand bleibt in den Fällen stecken)
6. Rangliste über alle Filter, Profil mit „Mehr sehen"

Die Browser-Konsole muss dabei leer bleiben.

## Fallstricke, die schon Zeit gekostet haben

1. **Hintergrund-Tabs werden auf ~1 Timer pro Minute gedrosselt.** Deshalb steht der
   Stale-Timeout im Duell bei 90 s und es gibt einen Resync bei `visibilitychange`.
   Nicht „optimieren".
2. **Nachrichten immer vor `bye`/`stale` verarbeiten** (`net.js`), sonst geht das
   Endergebnis verloren, wenn die Gegenseite direkt nach dem Senden schließt.
3. **Overlays sind während der Ausblendung noch im DOM.** Offenheit mit
   `overlayOpen(id)` prüfen, nie mit `classList.contains("hidden")`.
4. **Der Klassenraum-Zustand ist EIN JSON-Wert in einer URL.** Deshalb sind die
   Feldnamen einbuchstabig. Beim Ergänzen die Größe im Blick behalten.
5. **Zeitvergleiche über Geräte hinweg vermeiden.** Fristen laufen ab dem Moment, in
   dem das eigene Gerät einen Zustand *sieht* – nicht ab einem fremden Zeitstempel.
6. **ReportLab-PDFs:** nie den `Tc`-Operator verwenden (Zeichenabstand überlebt
   Textobjekte und wird von manchen Viewern nicht zurückgesetzt).

## Stand (Februar-Update v4.2)

Fertig und getestet:

- 47 handgeschriebene Fälle, Fall-Generator für den Endlosmodus
- Modi: Solo klassisch, Endlos, Tages-Challenge, Online-Duell, Klassenraum
- Interaktive Einweisung (12 Schritte) mit Erstspieler-Erkennung über das Profil
- Showdown (Fake bauen) im Duell **und** im Klassenraum inkl. fairer Verteilung,
  Auto-Fill nach 60 s und Nachzügler-Einzug
- Lobbys für Duell und Klassenraum: Spielerliste, Regeln nur beim Host änderbar,
  Start-Knopf nur beim Host
- Globale Rangliste über alle Modi, Profile mit Duell-Bilanz
- Durchgängiges Animationskonzept („Lagezentrum", `js/anim.js`)
- In-Game-Hilfe ist reines Nachschlagewerk und überschneidet sich bewusst **nicht**
  mit der Einweisung

Offen (siehe `docs/TECHNIK.md` → „Offene Punkte"):

- Smoke-Test auf GitHub Pages nach größeren Updates (Pages cacht JS ~10 Min)
- Klassenraum unter Volllast (30 Geräte) nur simuliert, nie real gemessen
- `ANLEITUNG.pdf` kennt Einweisung, Lobbys und Klassenraum-Showdown noch nicht
