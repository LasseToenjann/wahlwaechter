# Änderungsverlauf

## v4 – Einweisung & Klassenraum-Showdown

**Interaktive Einweisung (`js/tutorial.js`)**
- Zwölf Schritte, in denen jede Spielfunktion einmal selbst benutzt wird: Dossier, vier Prüfwerkzeuge mit echter Energie-Buchhaltung, Urteil, die Zensur-Falle an einem legitimen Satire-Beitrag, Punkte, Demokratie-Index als Regler zum Ausprobieren, Dilemma-Wahl, Fake-Werkstatt, Jagd im Feed, Modi-Überblick, Merkzettel.
- Eigene Übungsfälle in `tutorial.js` – die 47 echten Dossiers bleiben unverspoilert.
- „Weiter" ist gesperrt, bis der Schritt wirklich ausprobiert wurde; jederzeit überspringbar.
- Wird Erstspieler:innen **vor** dem ersten Spielstart angeboten; danach läuft der ursprünglich gewählte Modus automatisch weiter.
- Erkennung „hat schon gespielt" über drei Wege: abgeschlossene Einweisung, lokale Ergebnisse **oder globales Profil zum eingegebenen Namen** (deckt Wiederkehrende auf einem neuen Gerät ab). Der Profil-Abruf läuft im Hintergrund und blockiert den Spielstart nie.
- Start-Screen zeigt Erstspieler:innen eine Hinweiskarte; im Menü und in der Anleitung ist die Einweisung jederzeit erreichbar.

**Fake-Building im Klassenraum**
- Host kann den Showdown an- oder abschalten (neue Option in der Raum-Konfiguration, in der Lobby für alle sichtbar).
- Nach der letzten Welle baut jede:r einen eigenen Fake, der bei einer anderen Person im Feed landet.
- **Verteilung:** fester Ring über alle Raum-Mitglieder (jeder Fake genau einmal, niemand bekommt den eigenen); ist der Ring-Partner noch nicht fertig, greift der am seltensten vergebene Fake.
- **Auto-Fill:** Ist nach 30 Sekunden nichts verfügbar, baut HYDRA automatisch einen Fake – mit sichtbarem Countdown. Niemand wartet auf Trödler.
- Bonus für unentdeckt gebliebene eigene Fakes (+200 je Person), wird nachträglich verrechnet, sobald das Gegenüber geurteilt hat.
- Auswertung zeigt live, wer gerade baut oder jagt, und was aus dem eigenen Fake geworden ist.
- `ClassNet` schreibt den eigenen Eintrag jetzt immer vollständig neu (`_self`), damit Bauplan, Zuteilung und Ergebnis bei Schreibkollisionen nicht verloren gehen; Abrufrate während des Showdowns von 2,6 s auf 1,3 s erhöht.

**Dokumentation**
- `README.md` neu strukturiert: Einstieg, Wegweiser zu allen Dokumenten, Modi-Übersicht, Projektstruktur.
- `docs/SPIELANLEITUNG.md` neu: vollständige Anleitung inklusive Abschnitt für Lehrkräfte und häufige Fragen.
- `docs/TECHNIK.md` neu: Architektur, Datenmodell, Netzwerk-Protokolle, Verteilungsverfahren, Testhinweise, bekannte Grenzen. Ersetzt `HANDOFF.md`.
- `KONZEPT.md` auf den neuen Stand gebracht.

## v3 – Klassenraum, Tages-Challenge, Profile

- **Klassenraum** (ersetzt das K.-o.-Turnier): bis 30 Spieler:innen, ein Raum-Code, gleiche Fälle, Live-Spitzenreiter 👑 im HUD, Abschluss-Auswertung mit Podium
- **Online-Duell mit Regeln:** Host wählt Fallzahl (6/10/14), Tempo (45/35/24 s), Schwierigkeit und Showdown an/aus
- **Showdown-Budget:** Tarnungen kosten 2/3/2/3 bei Budget 5 – die zwei starken sind nicht kombinierbar
- **Tages-Challenge:** Datums-Seed für alle, ein Versuch pro Tag, eigener Ranglisten-Filter „Heute"
- **Profil & Duell-Bilanz** (global): Runden, Siege–Niederlagen–Unentschieden, Ø-Genauigkeit, Bestleistung
- **Fall-Auswertung:** nach jeder Runde alle Fälle nachlesbar, mit Detail-Overlay und realem Vorbild
- **47 handgeschriebene Fälle** (16/15/16 je Woche) plus Fall-Generator im Endlosmodus ab Schicht 3
- **Rechtliches & Datenschutz**-Screen im Spiel
- Duell-Fix: Nachrichten werden vor `bye`/`stale` verarbeitet, damit das Endergebnis nicht verloren geht; Resync bei `visibilitychange`
- Handout `ANLEITUNG.pdf` mit Vektor-QR-Code

## v2 – Online und Ranglisten

- Online-Duell von WebRTC auf HTTP-Relay umgestellt (funktioniert in Schul-WLANs und Mobilnetzen)
- Globale Rangliste, Endlosmodus, iPad-Anpassungen

## v1 – Erste Fassung

- Solo-Kampagne mit drei Wochen, Dilemma-Upgrades, Demokratie-Index, Boss-Finale
