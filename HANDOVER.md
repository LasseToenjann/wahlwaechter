# Übergabe – WAHLWÄCHTER 4.7, 24.09.2026

## Auftrag

Lasse wollte eine Bestandsaufnahme: prüfen, ob das Repo existiert und auf dem
neuesten Stand ist, eine Fehlerprüfung, alten oder ungenutzten Code entfernen,
alle Doku-Dateien (README, Handover, Agents, CLAUDE usw.) auf den neuesten Stand
bringen und danach auf GitHub pushen.

## Stand

Das Spiel ist fertig und live unter **https://lassetoenjann.github.io/wahlwaechter/**
(Einsatz im Projektkurs „KI meets Democracy" auf iPads seit Juli 2026). Modi: Solo
klassisch, Endlos, Tages-Challenge, Online-Duell, Klassenraum (bis 30), dazu
Einweisung, Fall-Auswertung, Ranglisten pro Modus und Profile. 47 handgeschriebene
Fälle plus Fall-Generator.

Fassung 4.7 (Einzelheiten in [docs/AENDERUNGEN.md](docs/AENDERUNGEN.md)):

- **Vier Fehler behoben, die schon vorher bestanden:** Profile verloren am
  Duell-Ende einen Zähler („0 Runden gespielt"); der Klassenraum-Bonus fiel für
  späte Opfer weg; die Tages-Challenge wiederholte an 64 % der Zykluswechsel Fälle
  vom Vortag (Korrektur greift **ab 01.10.2026**, damit der laufende Tag gleich
  bleibt); die Rangliste zeigte bei schnellem Filterwechsel die falsche Liste.
  Dazu: Profil-Suche mit `+`/`%` im Namen.
- **Aufgeräumt:** tote Konstanten, Funktionen, Methoden, CSS-Klassen und eine ID,
  Turnier-Reste, doppelte Dienst-Adressen, ein widersprüchlicher Datenwert
  (`bossPointsBase`). Die Finale-Zahlen stehen jetzt in `DATA.scoring`.
- **Neu im Repo:** `tests/pruefung.js` (39 Prüfungen ohne Netz, u. a. auf
  ungenutzten Code) und `tests/test-speicher.js` (Browser-Tests ohne echte Daten).
- **Doku neu geordnet** wie in den anderen Projekten: `AGENTS.md` = gemeinsame
  Arbeitsanleitung, `CLAUDE.md` verweist nur noch dorthin, diese Datei = Stand.

Echte Daten (nur lesend geprüft, vor und nach den Tests identisch): Rangliste
Klassisch 1, Endlos 0, Duell 2, Tages-Challenge 3, Klassenraum 2 Einträge,
17 Profile. Alle lesbar.

## Geprüft

| Prüfung | Ergebnis |
|---|---|
| `node tests/pruefung.js` | 39/39 |
| Einweisung, alle 12 Schritte (Browser, Handy-Breite, Test-Speicher) | durchgelaufen, danach Weiterleitung in den gewählten Modus |
| Solo klassisch bis Boss-Finale | 19/19, Finale +300 aus den Daten, Eintrag + Profil gespeichert |
| Endlos | 6 Schichten, generierte Fälle ab Schicht 3, Vertrauenskrise, gespeichert |
| Tages-Challenge | 10 Fälle (4 erzeugt), zweiter Versuch gesperrt |
| Duell, zwei Tabs | Lobby, Regeländerung kommt an, gleiche Fälle, Showdown, +250 für unentdeckten Fake, beide Profile korrekt (nach dem Fix) |
| Klassenraum, drei Tabs | Lobby, Regeln, Start, Showdown, Nachzügler nach Frist hereingeholt, Zuteilung nach 61 s Wartezeit, Podium, Einträge mit Raum-Code |
| Klassenraum-Bonus bei spätem Opfer | gezielt nachgestellt: wird nachgezahlt, nicht doppelt |
| Rangliste bei schnellem Filterwechsel (künstlich verzögerte Antwort) | zeigt die gewählte Liste |
| Überlauf bei 390 px und 320 px | keine Treffer |
| Tages-Sätze bis 30.09.2026 | bitgleich zur Fassung 4.6 (Fingerabdruck) |
| Rauchtest mit Endstand | Konsole leer |

## Offen – ehrlich

- **Nicht auf einem echten iPad geprüft.** Alle Browser-Tests liefen im
  eingebauten Browser mit Handy-Maßen; geklickt wurde teils per Konsole.
- **Live-Prüfung nach dem Push** – siehe Nachtrag unten, sobald erledigt.
- **Profil-Größe:** Alle Profile stehen in einem Wert in der Adresse (heute
  2,8 k Zeichen für 17 Profile). Nach früherer, nicht erneut gemessener Beobachtung
  endet der Dienst bei rund 7.500 Zeichen – also bei grob 40–45 Profilen, nicht bei
  der Kappung von 120. Dann scheitern Profil-Updates (es wird nichts gelöscht).
  Lösung wäre, die Profile auf mehrere Schlüssel zu verteilen; die Kappung zu
  senken würde echte Profile löschen – nur mit Lasses Zustimmung.
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
- **`?v=` hochzählen** bei jeder Änderung an CSS oder JS (alle zehn Verweise).
- Timer zählen pro Takt: Beim Testen mit mehreren Tabs läuft die Fake-Werkstatt
  eines Hintergrund-Tabs nicht nach 75 s ab. `finishBuild(true)` in dessen Konsole
  löst den Zeitablauf aus.
- Die Klassenraum-Nachzügler-Frist braucht mindestens drei Mitspielende zum
  Testen (bei zwei ist der Schwellwert nie erreichbar, wenn einer hängt).
- Weitere Fallstricke: [AGENTS.md](AGENTS.md#fallstricke-die-schon-zeit-gekostet-haben).

## Repo

`origin` = `https://github.com/LasseToenjann/wahlwaechter` (Privatkonto, ohne
Bindestrich), Branch `main`, GitHub Pages veröffentlicht direkt. Commits unter
`LasseToenjann <LasseToenjann@users.noreply.github.com>`, ohne Mitautoren- oder
Sitzungszeilen.

**Noch offen: Historie bereinigen.** Neun Commit-Nachrichten vom 02.08.2026
enthalten eine Zeile `…-Session: https://…` mit dem Namen des Werkzeugs – das
widerspricht Lasses Vorgabe, dass kein Werkzeug als Mitwirkender auftaucht. Das
Entfernen schreibt die veröffentlichte Historie um und braucht einen Force-Push;
den gibt es nur mit Lasses ausdrücklicher Freigabe. Vorbereitet ist es, die
Befehle stehen unten. Die Bereinigung ändert nur Nachrichten, keinen Dateistand.
Danach muss jede andere Kopie des Repos einmal `git fetch origin && git reset
--hard origin/main` ausführen (vorher ungepushte Arbeit sichern).

## Nächste Schritte (Vorschlag)

1. Lasse entscheidet über die Historien-Bereinigung (siehe „Repo").
2. Einmal auf einem echten iPad durchklicken (Einweisung, eine Solo-Runde).
3. Am 01.10.2026 kurz prüfen, dass die Tages-Challenge startet (erster Tag mit
   der neuen Zykluswechsel-Regel).
4. Wenn die Profil-Zahl Richtung 35 wächst: Profile auf mehrere Schlüssel
   verteilen (vorher mit Lasse klären, siehe „Offen").
5. Ideen aus `KONZEPT.md` → „Erweiterungsideen" nur auf Lasses Wunsch.

## Befehle

```bash
node tests/pruefung.js                      # 39 Prüfungen ohne Netz
python -m http.server 8123                  # lokal spielen: http://localhost:8123
# im Browser vor dem ersten Klick: Inhalt von tests/test-speicher.js in die Konsole
git log --format='%B' | grep -iE 'co-authored|-session:'   # soll leer sein (siehe „Repo")
```

Historie bereinigen – **nur nach Lasses Freigabe**. Entfernt ausschließlich die
Sitzungszeile samt der Leerzeile davor; alle anderen Nachrichten bleiben bitgleich,
Commits vor dem 02.08.2026 behalten ihren Hash:

```bash
git branch sicherung/vor-bereinigung main
FILTER_BRANCH_SQUELCH_WARNING=1 git filter-branch -f \
  --msg-filter "perl -0pe 's/\n+[A-Za-z]+-Session: [^\n]*\n*\z/\n/'" -- main
git diff --quiet sicherung/vor-bereinigung main && echo "Dateistand gleich"
git push --force-with-lease origin main
```
