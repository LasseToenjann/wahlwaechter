# 🛡️ WAHLWÄCHTER – Duell der Algorithmen

Ein Browser-Spiel zum Thema **„KI meets Democracy“** (Projektkurs).
Drei Wochen vor der Wahl 2032 flutet das KI-Netzwerk **HYDRA** die sozialen Medien mit Fälschungen, die niemand mehr auf den ersten Blick erkennt. Du leitest die Prüfstelle für digitale Wahlintegrität: Ermittle mit echten Methoden der Medienforensik, entscheide unter Zeitdruck – und opfere dabei nicht die Freiheit, die du schützen sollst.

➡️ Das vollständige Spielkonzept steht in [KONZEPT.md](KONZEPT.md).

## Features

- 🕵️ **Forensik-Gameplay:** 30 Fall-Dossiers, bei denen die Oberfläche nichts verrät – nur die Kombination von Beweisen (Medienforensik, Quellen-Check, Account-Analyse, Fakten-Abgleich) trägt
- ⚡ **Prüf-Energie:** knappes Wochen-Budget, strategisches Haushalten
- ⚖️ **Dilemma-Upgrades:** KI-Ethik als Spielmechanik (Überwachung vs. Grundrechte)
- 🏛️ **Demokratie-Index:** wirkt als Punkte-Multiplikator – wer die Demokratie beschädigt, kann nicht gewinnen
- 🛡️ **Solo-Kampagne** mit Boss-Finale und lokaler Top-10-Rangliste
- ⚔️ **Online-Duell 1vs1** per Raum-Code (WebRTC/PeerJS, ohne eigenen Server): gleiche Fälle, Live-Punktestand, und im **Showdown** baut jede:r einen eigenen Fake für den Feed des Gegners

## Lokal starten

Das Spiel ist eine statische Website (HTML/CSS/JS, kein Build-Schritt). Wegen des Skript-Ladens am besten über einen Mini-Webserver öffnen:

```bash
# im Projektordner:
python -m http.server 8123
# dann im Browser: http://localhost:8123
```

Alternativ jeder andere statische Server (`npx serve`, VS-Code-Live-Server, …).
Für das **Online-Duell** wird eine Internetverbindung benötigt (PeerJS-Vermittlungsserver); das Spiel selbst läuft auch offline.

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
| Online-Duell | [PeerJS](https://peerjs.com) (WebRTC-P2P) über den kostenlosen öffentlichen Broker – kein Backend |
| Gleiche Fälle im Duell | Deterministischer RNG (Mulberry32) mit geteiltem Seed |
| Rangliste | `localStorage` (lokal pro Gerät) |
| Hosting | GitHub Pages (kostenlos, HTTPS) |

## Dateien

```
index.html      – alle Screens
css/style.css   – „Lagezentrum“-Design
js/data.js      – Fall-Dossiers, Dilemmas, Showdown-Baukasten (alle Inhalte fiktiv)
js/rng.js       – seeded RNG
js/net.js       – PeerJS-Wrapper (Duell)
js/game.js      – Spiellogik / State-Machine
KONZEPT.md      – ausführliches Spielkonzept (abgabefertig)
```

---
Alle Inhalte (Parteien, Personen, Medien) sind frei erfunden.
