# Übergabe – WAHLWÄCHTER 4.8, 25.09.2026

## Auftrag

Am 24.09. wollte Lasse eine Bestandsaufnahme: Fehlerprüfung, alten und ungenutzten
Code entfernen, alle Doku-Dateien auf den neuesten Stand bringen, pushen (→ v4.7).
Am 25.09. hat er dazu zurückgemeldet:

- **iPad funktioniert** (von Lasse selbst geprüft).
- **Profile:** 40–45 reichen eigentlich, mehr wäre natürlich besser (→ v4.8).
- **Sitzungszeilen in alten Commits:** für dieses Projekt egal, solange es künftig
  nicht mehr vorkommt. Historie also **nicht** umschreiben.

## Stand

Das Spiel ist fertig und live unter **https://lassetoenjann.github.io/wahlwaechter/**
(Einsatz im Projektkurs „KI meets Democracy" auf iPads seit Juli 2026). Modi: Solo
klassisch, Endlos, Tages-Challenge, Online-Duell, Klassenraum (bis 30), dazu
Einweisung, Fall-Auswertung, Ranglisten pro Modus und Profile. 47 handgeschriebene
Fälle plus Fall-Generator. Einzelheiten zu jeder Fassung in
[docs/AENDERUNGEN.md](docs/AENDERUNGEN.md).

**v4.8 (25.09.):** Die Grenze des Speicherdienstes ist jetzt gemessen – rund
32.200 Zeichen Adresse statt der alten Annahme 7.500. Profile haben eine
Größengrenze (`PROFILE_MAX_URL`, 24.000 Zeichen ≈ **140 Profile**) statt der festen
Kappung auf 120; ist sie erreicht, bekommt ein neuer Name kein Profil, bestehende
laufen weiter, gelöscht wird nichts. `TDB.schreib` sendet zu Großes gar nicht erst.
Neue Prüfungen für Profile und für Commits. Beim erneuten Durchprüfen aufgefallen
und behoben (bestand schon vorher): Nach einem gespielten Duell übersah die Lobby
des nächsten Duells, wenn der Gegner sie verließ – der Host hing dann am Ende.

**v4.7 (24.09.):** vier ältere Fehler behoben (verlorene Profil-Zähler am
Duell-Ende, Klassenraum-Bonus für späte Opfer, Vortags-Wiederholungen in der
Tages-Challenge – Korrektur greift ab 01.10.2026 –, falsche Rangliste bei schnellem
Filterwechsel), ungenutzten Code entfernt, `tests/` angelegt, Doku neu geordnet
(`AGENTS.md` = gemeinsame Anleitung, `CLAUDE.md` verweist dorthin).

Echte Daten (nur lesend geprüft, 25.09.): Rangliste Klassisch 1, Endlos 0,
Duell 2, Tages-Challenge 3, Klassenraum 2 Einträge, 17 Profile. Alle lesbar.

## Geprüft

| Prüfung | Ergebnis |
|---|---|
| `node tests/pruefung.js` | 47/47 |
| Gegenprobe: Profil-Logik vor v4.7 in einer Kopie | fällt wie erwartet durch („Runden 1" statt 2) |
| Grenze des Dienstes (Wegwerf-Schlüssel, 25.09.) | bis ~32.200 Zeichen ok, ~32.270 → 500, 33.000 → 414 |
| Browser v4.8 (Handy-Breite, Test-Speicher direkt aus `tests/test-speicher.js` geladen) | Solo bis Ergebnis; Profil-Screen normal; volle Liste (142 Profile): Hinweis „Profilliste ist voll", neuer Name bekommt Ranglisten-Eintrag, aber kein Profil, Liste unverändert; Duell mit zwei Tabs, beide Profile korrekt; Gast verlässt Lobby nach einem vorigen Duell → Host bekommt „Verbindung verloren"; Gast verlässt mitten im Spiel → Host spielt gegen HYDRA bis zum Ergebnis; Konsole leer |
| v4.8 live nach dem Push (~50 s) | alle Skripte `?v=4.8`, Korrekturen vorhanden, Solo-Runde und Profil mit Test-Speicher, Konsole leer |
| Echte Schlüssel nach allen Tests (nur lesend) | Zeichenzahl unverändert – kein Testlauf ist dort gelandet |
| iPad | von Lasse bestätigt (25.09.) |
| v4.7 im Browser (24.09.) | Einweisung 1–12, Solo bis Finale, Endlos, Tages-Challenge samt Sperre, Duell mit zwei Tabs, Klassenraum mit drei Tabs inkl. Nachzügler und Auto-Zuteilung, Rangliste, Profil, Überlauf 320/390 px – alles ohne Fehler |
| v4.7 live nach dem Push | alle Skripte neu, Konsole leer |

## Offen – ehrlich

- **Schul-Netze:** Die Grenze von 32.200 Zeichen ist vom Entwicklungsrechner aus
  gemessen. Ein Proxy im Schulnetz könnte kürzere Adressen erzwingen; das würde
  zuerst bei vielen Profilen oder einem vollen Klassenraum (~8.200 Zeichen)
  auffallen. Bisher kein Hinweis darauf.
- **Gleichzeitige Profil-Updates verschiedener Geräte** bleiben Best-Effort: Die
  Kontrolle erkennt überschriebene Änderungen nur, wenn das Überschreiben vor dem
  Rücklesen passiert. Der Dienst kennt keine Transaktionen.
- Der Lasttest mit 30 echten Geräten ist weiterhin bewusst gestrichen (Begründung
  in `docs/TECHNIK.md` → „Bekannte Grenzen").
- Die Prüfung auf ungenutzten Code arbeitet mit Textmustern. Sie kann bei neuen
  Schreibweisen Fehlalarme geben; dann das Muster anpassen, nicht den Code verbiegen.

## Fallstricke für den Nächsten

- **Test-Speicher zuerst.** Wer im Browser prüft, ohne `tests/test-speicher.js`
  einzufügen, schreibt in die echte Rangliste. Die echten Schlüssel nie leeren.
- **Tages-Challenge:** Jede Änderung an `buildDailyDeck`, an der Rotation oder an
  `DATA.cases` ändert Tages-Sätze. `tests/pruefung.js` schlägt über die
  Fingerabdrücke an. Neue Fälle nicht an einem Unterrichtstag hochladen.
- **Gespeichertes Format nicht nebenbei ändern.** iPads halten alte Fassungen
  länger im Cache; ein neues Format lesen die falsch. Deshalb blieb in v4.8 das
  Profilformat unverändert.
- **`?v=` hochzählen** bei jeder Änderung an CSS oder JS (alle zehn Verweise).
- **Commits:** Manche Umgebungen hängen `Co-Authored-By:` oder eine
  `…-Session:`-Zeile an. Vor dem Commit entfernen; `tests/pruefung.js` meldet es.
  Die neun alten Commits vom 02.08.2026 bleiben auf Lasses Entscheidung so.
- Timer zählen pro Takt: Beim Testen mit mehreren Tabs läuft die Fake-Werkstatt
  eines Hintergrund-Tabs nicht nach 75 s ab. `finishBuild(true)` in dessen Konsole
  löst den Zeitablauf aus.
- Die Klassenraum-Nachzügler-Frist braucht mindestens drei Mitspielende zum
  Testen (bei zwei ist der Schwellwert nie erreichbar, wenn einer hängt).
- Weitere Fallstricke: [AGENTS.md](AGENTS.md#fallstricke-die-schon-zeit-gekostet-haben).

## Repo

`origin` = `https://github.com/LasseToenjann/wahlwaechter` (Privatkonto, ohne
Bindestrich), Branch `main`, GitHub Pages veröffentlicht direkt (rund eine Minute
nach dem Push). Commits unter `LasseToenjann <LasseToenjann@users.noreply.github.com>`
– die globale Git-Konfiguration auf diesem PC steht auf einer anderen Adresse, also
mit `git -c user.email=… commit` arbeiten. Keine Mitautoren- oder Sitzungszeilen.

## Nächste Schritte (Vorschlag)

1. Am 01.10.2026 kurz prüfen, dass die Tages-Challenge startet (erster Tag mit
   der neuen Zykluswechsel-Regel).
2. Falls im Unterricht je „Die Profilliste ist voll" erscheint: Profile auf mehrere
   Schlüssel verteilen – vorher mit Lasse klären, weil sich das Format ändert.
3. Ideen aus `KONZEPT.md` → „Erweiterungsideen" nur auf Lasses Wunsch.

## Befehle

```bash
node tests/pruefung.js                      # 47 Prüfungen ohne Netz (+ Commit-Prüfung per git)
python -m http.server 8123                  # lokal spielen: http://localhost:8123
# im Browser vor dem ersten Klick: Inhalt von tests/test-speicher.js in die Konsole
```
