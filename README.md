# 🛡️ WAHLWÄCHTER – Duell der Algorithmen

**▶️ Direkt spielen: https://lassetoenjann.github.io/wahlwaechter/**

Ein Browser-Spiel zum Thema **„KI meets Democracy"** (Projektkurs).
Drei Wochen vor der Wahl 2032 flutet das KI-Netzwerk **HYDRA** die sozialen Medien mit Fälschungen, die niemand mehr auf den ersten Blick erkennt. Du leitest die Prüfstelle für digitale Wahlintegrität: Ermittle mit echten Methoden der Medienforensik, entscheide unter Zeitdruck – und opfere dabei nicht die Freiheit, die du schützen sollst.

Keine Installation, keine Anmeldung, kein Konto. Website öffnen, Namen eintippen, los.

> **Gebaut für Handy und iPad.** Das Spiel wird im Unterricht auf kleinen Bildschirmen gespielt – jede Oberfläche entsteht zuerst für 390 px Breite und wird bei 320 px gegengeprüft. Am Desktop läuft es genauso, ist aber nicht der Maßstab.

---

## 📚 Wo steht was?

| Ich will… | Datei |
|---|---|
| **spielen und verstehen, wie es geht** | Im Spiel: **🎓 Einweisung** (interaktiv, ca. 5 Min) · zum Nachschlagen: [docs/SPIELANLEITUNG.md](docs/SPIELANLEITUNG.md) |
| **das Spiel im Unterricht einsetzen** | [docs/SPIELANLEITUNG.md → Für Lehrkräfte](docs/SPIELANLEITUNG.md#für-lehrkräfte-und-kursleitung) |
| **wissen, warum das Spiel so gebaut ist** (Abgabe-Dokument) | [KONZEPT.md](KONZEPT.md) |
| **am Code arbeiten** | [CLAUDE.md](CLAUDE.md) für Arbeitsweise und Stand · [docs/TECHNIK.md](docs/TECHNIK.md) für die Architektur |
| **sehen, was sich geändert hat** | [docs/AENDERUNGEN.md](docs/AENDERUNGEN.md) |

## Was das Spiel kann

**Kern:** 🕵️ **Forensik statt Raten** – 47 handgeschriebene Fall-Dossiers, bei denen die Oberfläche nichts verrät. Nur die Kombination mehrerer Beweise (Medienforensik, Quellen-Check, Account-Analyse, Fakten-Abgleich) trägt. Jede Prüfung kostet ⚡ **Prüf-Energie**, das Budget reicht nie für alles.

**Der Haken:** 🏛️ Der **Demokratie-Index** ist Punkte-Multiplikator. Durchgelassene Fakes schaden – zu viel Sperren aber auch. Man gewinnt nicht, indem man die Demokratie opfert. ⚖️ **Dilemma-Upgrades** machen die Abwägung „Effizienz durch KI vs. Grundrechte" zum Spielzug.

**Die Spielarten:**

| Modus | Was passiert |
|---|---|
| 🎓 **Einweisung** | Interaktive Trainings-Schicht vor dem ersten Spiel: alle Funktionen einmal selbst ausprobiert, keine Wertung. Wird Erstspieler:innen automatisch angeboten. |
| 🛡️ **Solo klassisch** | 3 Wochen × 6 Fälle, 2 Dilemma-Upgrades, Boss-Finale gegen HYDRA (ca. 15–20 Min) |
| ♾️ **Endlos** | Schicht um Schicht härter; ab Schicht 3 erzeugt der Fall-Generator laufend neue, nie gesehene Fälle |
| 📅 **Tages-Challenge** | Täglich neuer, für alle identischer Fallsatz – Wechsel um Mitternacht deutscher Zeit, ein Teil der Fälle wird täglich frisch erzeugt |
| ⚔️ **Online-Duell 1 vs 1** | Raum-Code, Lobby mit beiden Namen, gleiche Fälle, Punktestand des Gegners live |
| 🏟️ **Klassenraum** | Bis 30 Spieler:innen gleichzeitig, 👑 Spitzenreiter live im HUD, Podium am Ende – **auf Wunsch mit Showdown** |

Duell und Klassenraum haben beide eine **Lobby**: Spielerliste, Regeln nur beim Host änderbar (Änderungen sind sofort bei allen sichtbar), Start-Knopf nur beim Host.

**🧪 Showdown (Duell & Klassenraum):** Jede:r baut selbst einen KI-Fake aus Thema × Format × Tarnungen. Das Budget reicht nie für perfekte Tarnung – irgendein Beweiskanal bleibt immer offen. Im Klassenraum werden die gebauten Fakes **gleichmäßig reihum verteilt**: niemand bekommt den eigenen, möglichst jeder Fake geht an genau eine Person, und wer zu lange braucht, wird nicht abgewartet – nach 60 Sekunden springt ein automatisch gebauter HYDRA-Fake ein. Wer beim Start des Showdowns noch in den Fällen steckt, wird nach kurzer Frist herausgeholt („Du warst zu langsam"), damit die Klasse nicht auf Einzelne wartet.

**Drumherum:** 📋 Fall-Auswertung nach jeder Runde (jeder Fall mit Auflösung und **realem Vorbild**) · 🌐 globale Rangliste **pro Modus** (die Modi sind zu verschieden für eine gemeinsame Liste; im Duell steht Ergebnis **und** Bilanz) · 👤 Profil mit den eigenen Kennzahlen · ℹ️ Rechtliches & Datenschutz im Spiel.

Das Ganze ist durchgehend animiert – nach einem festen Konzept („Lagezentrum"), das in [js/anim.js](js/anim.js) beschrieben und in [docs/TECHNIK.md](docs/TECHNIK.md#animationen) eingeordnet ist. Wer im System „Bewegung reduzieren" eingeschaltet hat, bekommt alles ohne Animation.

> **Fiktiv, aber belegt:** Alle Parteien, Personen, Medien und Beiträge sind **frei erfunden** (FIKTIV-Badge im Dossier). Die dargestellten Manipulations*techniken* sind real – jede Auflösung nennt das dokumentierte Vorbild samt Quelle.

## Lokal starten

Statische Website (HTML/CSS/JS, kein Build-Schritt). Wegen des Skript-Ladens am besten über einen Mini-Webserver:

```bash
python -m http.server 8123     # im Projektordner
# dann im Browser: http://localhost:8123
```

Alternativ jeder andere statische Server (`npx serve`, VS-Code-Live-Server, …).
Solo, Endlos, Tages-Challenge und die Einweisung laufen **offline**. Für Duell, Klassenraum, Rangliste und Profil wird Internet gebraucht.

## Veröffentlichen (GitHub Pages, kostenlos)

1. Repository auf [github.com](https://github.com) anlegen (z. B. `wahlwaechter`, „Public")
2. Projektdateien hochladen (`git push` oder „Add file → Upload files")
3. **Settings → Pages → Branch: `main` / Ordner: `/ (root)` → Save**
4. Nach ~1 Minute läuft das Spiel unter `https://<benutzername>.github.io/wahlwaechter/` – HTTPS inklusive (Voraussetzung für Duell und Klassenraum)

## Projektstruktur

```
index.html            alle Screens
css/style.css         „Lagezentrum"-Design
js/anim.js            Animations-System (Konzept „Lagezentrum")
js/rng.js             deterministischer Zufall (Mulberry32), Raum-Codes
js/data.js            Fall-Dossiers, Dilemmas, Showdown-Baukasten (alles fiktiv)
js/gen.js             Fall-Generator + Fake-Baukasten (craftFake / randomBuild)
js/net.js             Online-Duell (HTTP-Relay, Postfach-Prinzip)
js/classroom.js       Klassenraum-Netzwerk (bis 30 Spieler:innen auf einem Raum-Key)
js/tutorial.js        interaktive Einweisung (eigene Übungsfälle)
js/game.js            Spiellogik, State-Machine, Ranglisten, Profile
CLAUDE.md             Arbeitsanleitung: Projekt, Konventionen, Teststrategie, Stand
KONZEPT.md            Spielkonzept (Abgabe-Dokument)
docs/                 Spielanleitung, Technik-Doku, Änderungsverlauf
```

Details zur Architektur, zu den Netzwerk-Protokollen und zum Erweitern: [docs/TECHNIK.md](docs/TECHNIK.md).

---
Nicht-kommerzielles Schulprojekt. Alle Spielinhalte (Parteien, Personen, Medien) sind frei erfunden.
