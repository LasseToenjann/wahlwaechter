# 🛡️ WAHLWÄCHTER – Duell der Algorithmen

**▶️ Spielen: https://lassetoenjann.github.io/wahlwaechter/**

Ein Browser-Spiel zum Thema **„KI meets Democracy“** (Projektkurs).
Drei Wochen vor der Wahl 2032 flutet das KI-Netzwerk **HYDRA** die sozialen Medien mit Fälschungen, die niemand mehr auf den ersten Blick erkennt. Du leitest die Prüfstelle für digitale Wahlintegrität: Ermittle mit echten Methoden der Medienforensik, entscheide unter Zeitdruck – und opfere dabei nicht die Freiheit, die du schützen sollst.

➡️ Das vollständige Spielkonzept steht in [KONZEPT.md](KONZEPT.md).

## Features

- 🕵️ **Forensik-Gameplay:** 47 handgeschriebene Fall-Dossiers, bei denen die Oberfläche nichts verrät – nur die Kombination von Beweisen (Medienforensik, Quellen-Check, Account-Analyse, Fakten-Abgleich) trägt
- 📚 **Fiktiv, aber belegt:** Alle Inhalte sind erfunden (FIKTIV-Badge), jeder Fall nennt in der Auflösung sein **reales, dokumentiertes Vorbild** samt Quelle
- ⚡ **Prüf-Energie:** knappes Budget, strategisches Haushalten
- ⚖️ **Dilemma-Upgrades:** KI-Ethik als Spielmechanik (Überwachung vs. Grundrechte)
- 🏛️ **Demokratie-Index:** wirkt als Punkte-Multiplikator – wer die Demokratie beschädigt, kann nicht gewinnen
- 🛡️ **Solo klassisch** (3 Wochen + Boss-Finale) oder **♾️ Endlos** (steigende Schwierigkeit, ab Schicht 3 mit **automatisch generierten, immer neuen Fällen**)
- 📅 **Tages-Challenge:** täglich neuer, für alle identischer Fallsatz – 1 Versuch pro Tag, eigene Tages-Rangliste
- ⚔️ **Online-Duell 1vs1** per Raum-Code mit **konfigurierbaren Regeln** (Fälle, Tempo, Schwierigkeit, Showdown an/aus) – läuft über einen kostenlosen HTTP-Spielserver (kein WebRTC, funktioniert daher auch in Schul-WLANs und Mobilnetzen). Im **Showdown** baut jede:r einen eigenen Fake mit Tarnungs-Budget
- 🏟️ **Klassenraum:** bis zu 30 Spieler:innen gleichzeitig in einer Runde – Live-Spitzenreiter im Spiel, Abschluss-Auswertung mit Podium
- 📋 **Fall-Auswertung:** nach jeder Runde alle Beiträge mit Antwort, Auflösung und realem Vorbild nachlesen
- 👤 **Profile:** globale Duell-Bilanz (Siege/Niederlagen), Ø-Genauigkeit, Bestleistung
- 🌐 **Globale Rangliste** (kostenloser Online-Speicher) mit Modus-Filtern und Offline-Fallback
- ℹ️ **Rechtliches & Datenschutz** direkt im Spiel (Fiktionshinweis, Pseudonym-Empfehlung)

## Lokal starten

Das Spiel ist eine statische Website (HTML/CSS/JS, kein Build-Schritt). Wegen des Skript-Ladens am besten über einen Mini-Webserver öffnen:

```bash
# im Projektordner:
python -m http.server 8123
# dann im Browser: http://localhost:8123
```

Alternativ jeder andere statische Server (`npx serve`, VS-Code-Live-Server, …).
Für **Online-Duell, Klassenraum und globale Rangliste** wird eine Internetverbindung benötigt (HTTP-Spielserver textdb.online); das Solo-Spiel selbst läuft auch offline.

## Kostenlos veröffentlichen (GitHub Pages)

1. Kostenloses Konto auf [github.com](https://github.com) anlegen
2. Neues Repository erstellen (z. B. `wahlwaechter`, „Public“)
3. Diese Projektdateien hochladen (per `git push` oder „Add file → Upload files“ im Browser)
4. Im Repository: **Settings → Pages → Branch: `main` / Ordner: `/ (root)` → Save**
5. Nach ~1 Minute ist das Spiel unter `https://<benutzername>.github.io/wahlwaechter/` für alle erreichbar – HTTPS inklusive (Voraussetzung für das Online-Duell)

## Technik

| Baustein | Lösung |
|---|---|
| Frontend | Vanilla HTML/CSS/JS, keine Frameworks, kein Build |
| Online-Duell | HTTP-Relay über [textdb.online](https://textdb.online) (kostenloser Key-Value-Speicher): zwei „Postfächer“ pro Raum, Polling im Sekundentakt. Bewusst kein WebRTC – das scheitert in Schul-WLANs/Mobilnetzen an Firewalls/NAT |
| Gleiche Fälle im Duell | Deterministischer RNG (Mulberry32) mit geteiltem Seed |
| Rangliste | Global via textdb.online (pro Modus ein Schlüssel) + `localStorage`-Fallback |
| Hosting | GitHub Pages (kostenlos, HTTPS) |

## Dateien

```
index.html      – alle Screens
css/style.css   – „Lagezentrum“-Design
js/data.js      – Fall-Dossiers, Dilemmas, Showdown-Baukasten (alle Inhalte fiktiv)
js/rng.js       – seeded RNG
js/net.js       – HTTP-Relay-Duell (textdb.online, Postfach-Prinzip)
js/classroom.js – Klassenraum-Netzwerk (bis 30 Spieler:innen auf einem Raum-Key)
js/gen.js       – Fall-Generator (Endlos ab Schicht 3)
js/game.js      – Spiellogik / State-Machine
KONZEPT.md      – ausführliches Spielkonzept (abgabefertig)
```

---
Alle Inhalte (Parteien, Personen, Medien) sind frei erfunden.
