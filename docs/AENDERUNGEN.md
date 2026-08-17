# Änderungsverlauf

## v4.5 – Favicon in der Google-Suche

- Das Favicon war ein `data:`-URI mit einem Emoji. Der Browser zeigt so etwas im Tab an, **Google kann es aber nicht abrufen** — in der Suche und in der Search Console blieb das Bild deshalb leer, während andere Projekte dort ein Symbol hatten.
- Jetzt eine echte Datei unter `assets/favicon.svg`: ein gezeichneter Schild mit Haken in den Projektfarben, statt eines Emojis, dessen Darstellung von der Schriftart des jeweiligen Systems abhängt.
- Ergänzt um `apple-touch-icon` und `mask-icon` auf dieselbe Datei.


## v4.4 – Mobile-First, Tages-Challenge, Ranglisten

**Google Search Console**
- Nachweis-Meta-Tag (`google-site-verification`) im `<head>` von `index.html`. Damit lässt sich in der Search Console sehen, wie die Seite gefunden wird. Das Tag muss dort stehen bleiben – wird es entfernt, gilt die Seite als unbestätigt.
- `sitemap.xml` mit **einer** URL. Mehr gibt es nicht: Alle Screens sind Abschnitte in `index.html`, es existieren keine Routen, Parameter oder Raum-Links.
- `<link rel="canonical">` ergänzt, damit `/` und `/index.html` nicht getrennt im Index landen.
- `robots.txt` angelegt – mit dem ausdrücklichen Hinweis, dass sie im Projektpfad `/wahlwaechter/` **folgenlos** ist: Suchmaschinen lesen die Datei nur im Wurzelverzeichnis einer Domain. Sie wird erst unter einer eigenen Domain wirksam oder wenn man den Inhalt ins Wurzel-Repository kopiert. `css/` und `js/` sind darin bewusst **nicht** gesperrt, weil Google die Seite zum Indexieren rendert.
- Neues Kapitel „Suchmaschinen" in `docs/TECHNIK.md`.

**Mobile und iPad zuerst – als Grundsatz festgeschrieben**
- Gespielt wird auf kleinen Bildschirmen; der Desktop ist die Zugabe. Steht jetzt in `CLAUDE.md` und `docs/TECHNIK.md` samt Prüfmuster für horizontalen Überlauf (390 px bauen, 320 px gegenprüfen).

**Tages-Challenge**
- Der Tageswechsel läuft über **deutsche Zeit** statt UTC. Vorher wechselte die Challenge um 01:00 bzw. 02:00 Uhr, nicht um Mitternacht.
- Der Fallsatz wiederholt sich nicht mehr: Sechs handgeschriebene Fälle rotieren so durch den Bestand, dass innerhalb einer Woche keiner zweimal drankommt; vier weitere Fälle werden täglich **neu erzeugt** (derselbe Generator wie im Endlosmodus). Gemessen über 30 Tage: vorher 2–4 Wiederholungen vom Vortag und bis zu 11 Auftritte je Fall, jetzt 0 Wiederholungen und höchstens 5.

**Rangliste und Profil**
- Der Filter **„Alle" ist entfallen**. Die Modi haben verschiedene Fallzahlen, Timer und Multiplikatoren – nebeneinandergestellt sagen die Zahlen nichts aus. Standard ist jetzt „Klassisch".
- Die **Duell-Rangliste zeigt Ergebnis und Bilanz zusammen**: Punktzahl aus dem Duell-Schlüssel, Siege–Niederlagen–Unentschieden und Siegquote aus den Profilen.
- Im **Profil** entfällt die Tabelle mit der Bilanz aller Spieler:innen; dort stehen nur noch die eigenen Kennzahlen, dazu ein Verweis in die Duell-Rangliste.

**Meldungen und Animationen**
- Die Meldung am unteren Rand ist keine Pille mehr, sondern eine Karte mit farbigem Randstreifen (`info` / `warn` / `error` / `good`) und Antippen zum Schließen. Als Pille wurde daraus bei zweizeiligem Text eine Ellipse.
- Die Inhalts-Ebene kennt jetzt **zwei Richtungen**: Neues steigt auf, das *nächste Element einer Reihe* kommt von rechts. Dadurch unterscheidet sich ein neuer Fall sichtbar von einem neuen Screen.
- Zusätzlich klarer: gewähltes Urteil bleibt markiert, Fall-Nummer pulst beim Wechsel, Budget in der Fake-Werkstatt und Energie in der Jagd pulsen bei Änderung.

**Handout `ANLEITUNG.pdf` entfernt**
- Das gedruckte Handout ist ersatzlos gestrichen: Die interaktive Einweisung erklärt das Spiel besser als ein Blatt Papier, und `docs/SPIELANLEITUNG.md` deckt alles ab, was zum Vorbereiten und Nachschlagen gebraucht wird. Für den Unterricht reicht die Adresse an der Tafel.
- Damit entfallen auch die Erzeugungs-Skripte (`tools/`) und die dazugehörigen Screenshots.

**Offene Punkte geschlossen**
- Der Lasttest mit 30 echten Geräten ist nach Absprache **gestrichen**; die Begründung steht in `docs/TECHNIK.md` unter „Bekannte Grenzen".
- Damit gibt es keine offenen Punkte mehr. Das Kapitel „Offene Punkte" in `docs/TECHNIK.md` ist entfallen – ein leeres Kapitel, das jede neue Sitzung liest, stiftet nur Verwirrung.
- Das Prüfrezept, das dort stand (ausgelieferten Stand über `git archive origin/main` lokal servieren, weil `github.io` aus der Entwicklungsumgebung gesperrt ist), steht jetzt dort, wo man es sucht: im Kapitel „Testen".

## v4.3 – Mobile-Fehlerbehebungen

Nach dem ersten Test auf einem iPhone gemeldet und behoben:

- **Zahlen wurden als Telefonnummern erkannt.** iOS Safari hat Bereiche wie „2900–3599" in den Hilfe-Tabellen automatisch in blaue Anruf-Links verwandelt. Behoben mit `<meta name="format-detection" content="telephone=no,…">`, dazu eine CSS-Regel als Rückfallebene, falls doch etwas verlinkt wird.
- **Beschriftungen wurden abgeschnitten** („🚀 Los geht's!" erschien als „Los geht"). Ursache: Die Beschriftung stand als reiner Textknoten im Knopf und war damit ein *anonymes Flex-Item* – Safari misst so ein Item falsch, sobald ein Emoji darin vorkommt. Knöpfe verwenden jetzt kein Flexbox mehr, sondern Block-Layout mit `text-align: center`.
- **Erste Textzeile lag hinter der Uhr.** Die Seite nutzt `viewport-fit=cover`, hatte aber keine Safe-Area-Abstände. `#app`, die klebende Timer-Leiste, das Verbindungs-Banner und die Overlays berücksichtigen jetzt `env(safe-area-inset-*)`.
- **Titel „WAHLWÄCHTER" lief über den Rand** – auf dem Handy sichtbar abgeschnitten, auf dem Desktop unbemerkt über den Container hinaus. Schriftgröße so gewählt, dass das Wort in jeder Breite in eine Zeile passt.
- **Weitere Überläufe beseitigt:** lange URLs im Rechtliches-Screen, der Raum-Code auf sehr schmalen Geräten, die Kopfzeile des Dossiers und die Spaltenbreite der Fall-Ansicht. Ein Prüfskript geht jetzt alle Screens bei 320 px und 390 px durch – beide Breiten sind frei von horizontalem Überlauf.
- **Nachschlage-Tabellen** stapeln sich auf dem Handy untereinander statt zweispaltig zu quetschen.
- Verweis auf die „Anleitung" am Ende der Einweisung auf „Hilfe" korrigiert.

## v4.2 – Lobbys, Showdown-Timing, Hilfe entflochten

**Lobbys für Duell und Klassenraum**
- Das **Online-Duell** startet nicht mehr automatisch, sobald jemand beitritt. Stattdessen landen beide in einer Lobby: Spielerliste, Raum-Code, Regeln. Nur der Host kann die Regeln ändern (jede Änderung ist beim Gegenüber sofort sichtbar) und nur der Host hat den Start-Knopf.
- Im **Klassenraum** sind die Regeln aus dem Erstellen-Dialog in die Lobby gewandert – dort ändert sie der Host, während sich der Raum füllt. Alle anderen sehen die Regeln als Nur-Lese-Zeile und haben keinen Start-Knopf.
- Neue Duell-Nachrichten `lobbyInfo` und `cfg`; im Klassenraum schreibt `ClassNet.setCfg` die Regeln in den Raum-Zustand.

**Showdown im Klassenraum**
- Wartezeit bis zum automatisch gebauten HYDRA-Fake von 30 auf **60 Sekunden** verlängert, damit man den Feed in Ruhe lesen kann.
- **Nachzügler werden hineingeholt:** Sobald 60 % der Klasse im Showdown sind, läuft für die Übrigen eine Frist von 45 Sekunden; danach werden sie aus den Fällen geholt und mit dem Hinweis „Du warst zu langsam" in die Bauphase gesetzt. Auslöser ist bewusst nicht die erste fertige Person – sonst würde eine einzelne schnelle Person die halbe Klasse mitten aus der Runde reißen.
- **Live-Anzeige**, wie viele Fakes schon abgegeben wurden – in der Bauphase im HUD und im Wartebildschirm.
- Bonus für unentdeckte Fakes wird jetzt nachgezahlt, wenn später noch ein zweites Opfer dazukommt.

**Hilfe und Einweisung entflochten**
- Die In-Game-„Anleitung" heißt jetzt **„❓ Hilfe & Nachschlagen"** und erklärt bewusst **nichts** mehr: Sie enthält nur noch Nachschlage-Tabellen (Punkte, Ränge, Tarnungskosten, Modi-Kennzahlen), Antworten auf konkrete Probleme und den Fiktionshinweis.
- Alles, was die Einweisung vermittelt, ist dort entfernt. Oben steht ein Knopf zur Einweisung, damit die Rollenverteilung klar ist: Einweisung = lernen, Hilfe = nachschlagen.

**Doku**
- Neu: `CLAUDE.md` als Einstieg für neue Sitzungen (Projekt, Arbeitsweise, Teststrategie, Fallstricke, Stand).

## v4.1 – Animationskonzept, Rangliste, Profil

**Animationskonzept „Lagezentrum" (neu: `js/anim.js`)**
- Durchgängiges Konzept statt Einzeleffekten: Jede Bewegung beantwortet eine Frage (woher kam das / was hat sich geändert / was passiert gerade / war das richtig), dauert 120–320 ms und nutzt nur `transform` und `opacity`.
- Sechs Ebenen: Screen (mit Richtung – vorwärts steigt auf, zurück sinkt), Overlay (Ein- **und** Ausblendung), Inhalt (gestaffeltes Einlaufen von Listen), Zustand (geänderte HUD-Werte pulsen, Index-Schaden zittert rot), Feedback (Knopfdruck, Chip-Einrasten, Scan-Streifen über benutzte Werkzeuge, Beweise gleiten von links ein), Ambiente (driftendes Raster, glimmender Titel, atmender Raum-Code, pulsierender Timer unter 22 %).
- Signature-Momente: Das Urteil wird gestempelt, die Endpunktzahl zählt hoch, das Klassenraum-Podium läuft gestaffelt ein.
- Umgesetzt in allen Modi, in der Einweisung und auf allen Nebenscreens. Statische Screens staffeln rein deklarativ über die Klasse `stagger-css`.
- `prefers-reduced-motion: reduce` schaltet alles ab – live ausgewertet, nicht nur beim Laden.
- Hintergrundraster liegt jetzt auf einer eigenen `position: fixed`-Ebene und wird per `transform` bewegt (GPU statt Neuzeichnen).

**Rangliste**
- Klassenraum-Ergebnisse landen in der globalen Rangliste (neuer Schlüssel `wahlwaechter_kr_x7k2m9`) und erscheinen unter „Alle" sowie unter dem neuen Filter „Klassenraum". „Alle" zeigt damit wirklich alle Modi.
- Ergebnis-Einträge haben eine stabile ID und werden aktualisiert statt doppelt angelegt – nötig, weil der Klassenraum-Bonus für unentdeckte Fakes erst nach dem Speichern eintreffen kann.
- Modusnamen werden ausgeschrieben („Klassisch" statt „klassisch"), Klassenraum-Einträge nennen den Raum-Code.
- Emoji aus dem Aktualisieren-Knopf und den Statuszeilen entfernt.

**Profil**
- Duell-Bilanz zeigt die **Top 10**, darunter ein „Mehr sehen"-Knopf (klappt auf und wieder zu).
- Emoji aus Aktualisieren-Knopf, Statuszeile, Profilnamen und Zwischenüberschrift entfernt.

**Knöpfe**
- Beschriftungen sind jetzt auch mehrzeilig mittig ausgerichtet (`text-align: center` statt nur Flex-Zentrierung).

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
