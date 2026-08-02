# WAHLWÄCHTER – Duell der Algorithmen

**Spielkonzept für den Projektkurs „KI meets Democracy"**

---

## 1. Leitidee

Künstliche Intelligenz kann heute Texte, Bilder und Videos erzeugen, die von echten Inhalten **nicht mehr auf den ersten Blick zu unterscheiden** sind. Für die Demokratie ist das eine doppelte Gefahr: Wahlen können durch KI-Desinformation manipuliert werden — aber auch der **Kampf dagegen** kann die Demokratie beschädigen, wenn er zu Überwachung und Zensur führt.

**WAHLWÄCHTER** macht genau dieses Spannungsfeld spielbar. Es ist kein Quiz („echt oder fake?"), sondern ein **Forensik- und Strategiespiel**: Die Oberfläche eines Beitrags verrät nichts — die Wahrheit steckt in Beweisebenen, die man mit echten Methoden der Medienforensik aufdecken muss. Und jede Entscheidung der eigenen Behörde wirft die Frage auf: *Wie viel Freiheit darf der Schutz der Demokratie kosten?*

## 2. Setting & Rahmenhandlung

**Deutschland, drei Wochen vor der Bundestagswahl 2032.** Ein adaptives Desinformations-Netzwerk mit dem Codenamen **HYDRA** flutet die sozialen Netzwerke mit KI-generierten Inhalten — Deepfake-Auftritte, gefälschte Lokalzeitungen, Botnetz-Kampagnen, Microtargeting-Anzeigen. Die Inhalte sind sprachlich perfekt und inhaltlich plausibel.

Der/die Spieler:in übernimmt die Leitung der Prüfstelle der (fiktiven) **Bundeszentrale für digitale Wahlintegrität (BDW)**. Auftrag: verdächtige Beiträge prüfen und korrekt einordnen — Desinformation stoppen, **ohne** legitime Meinungsäußerung, unbequeme Wahrheiten oder Satire zu zensieren.

Alle Inhalte des Spiels sind **fiktiv** (erfundene Parteien, Personen, Medien). Das Spiel bildet reale *Techniken* ab, aber keine realen Akteure.

## 3. Kernmechanik: Ermitteln statt Raten

### 3.1 Das Fall-Dossier

Pro Woche landen 6 gemeldete Beiträge („Fälle") auf dem Schreibtisch. Jeder Fall zeigt zunächst nur die **Oberfläche**: Absender, Beitragstext, Medium (Video/Bild/Artikel/Post/Anzeige) und Reichweite. **Echte und gefälschte Beiträge sehen an der Oberfläche gleich glaubwürdig aus** — es gibt keine Rechtschreibfehler-Fakes und keine offensichtlichen KI-Artefakte.

### 3.2 Die vier Prüfwerkzeuge

Die Wahrheit findet man nur durch aktive Ermittlung. Vier Werkzeuge stehen bereit — sie entsprechen realen Methoden der Verifikation (Medienkompetenz!):

| Werkzeug | Prüft | Reales Vorbild |
|---|---|---|
| 🔬 **Medienforensik** | Artefakte, Schatten, Lippensynchronität, Metadaten | Deepfake-Detektion, Fehlersuche in KI-Bildern |
| 📡 **Quellen-Check** | Domain-Alter, Impressum, existiert die Redaktion? | Whois-Abfrage, Impressumspflicht |
| 🤖 **Account-Analyse** | Alter, Posting-Muster, Follower-Struktur | Botometer, Netzwerkanalyse |
| 🧭 **Fakten-Abgleich** | Berichten unabhängige Quellen dasselbe? | Fact-Checking (Correctiv, dpa-Faktencheck) |

### 3.3 Prüf-Energie: die strategische Ressource

Jede Prüfung kostet **1 Prüf-Energie**. Das Wochen-Budget (Woche 1: 14, Woche 2: 12, Woche 3: 10) reicht **nicht** für Vollprüfung aller Fälle — man muss haushalten: Welcher Fall wirkt verdächtig genug für eine Tiefenprüfung? Wo reicht ein Indiz? Wo riskiere ich ein Urteil „blind"?

Entscheidend: **Einzelne Indizien sind bewusst ambivalent.** Ein zwei Wochen alter Account kann ein Bot sein — oder ein echter Erstwähler. Ein sauberes Impressum kann gefälscht sein. Erst die **Kombination** mehrerer Beweise ergibt ein belastbares Bild. Wer nur ein Werkzeug nutzt, kann getäuscht werden (einzelne Beweise sind bei manchen Fällen absichtlich irreführend).

### 3.4 Das Urteil

Pro Fall läuft ein Timer (Woche 1: 45 s, Woche 2: 40 s, Woche 3: 35 s). Vor Ablauf muss das Urteil fallen:

- ✅ **FREIGEBEN** – der Beitrag ist echt/legitim
- 🚫 **KENNZEICHNEN** – KI-Desinformation, wird markiert und gedrosselt

Nach jedem Urteil folgt die **Auflösung**: Was war der Beitrag wirklich, welche Indizien haben es verraten, welche Technik steckte dahinter? → Lerneffekt bei jedem einzelnen Fall.

## 4. Punktesystem (der kompetitive Kern)

| Ereignis | Wirkung |
|---|---|
| Richtiges Urteil | **+100 Basispunkte** |
| Zeitbonus | + Restsekunden × 4 |
| Spürnasen-Bonus | +40, wenn richtig mit ≤ 1 eingesetzter Energie |
| Serienbonus | + Streak × 20 (Streak max. 5) |
| Restenergie am Wochenende | +10 pro Punkt Energie |
| **Fake freigegeben** | 0 Punkte, **Demokratie-Index −12** (Desinformation verbreitet sich) |
| **Echtes gekennzeichnet** | 0 Punkte, **Demokratie-Index −6** (Zensur-Vorwurf, Vertrauensverlust) |
| Zeit abgelaufen | zählt als falsches Urteil (Index −8) |

### Der Demokratie-Index

Startet bei **100** und misst das Vertrauen der Öffentlichkeit in eine freie, faire Wahl. Er ist die zweite Währung des Spiels und verhindert reines Punkte-Grinden:

> **Endpunktzahl = Rohpunkte × (0,5 + Demokratie-Index / 200)**

Wer die Demokratie beschädigt — durch durchgelassene Fakes, Übersperren **oder skrupellose Behörden-Upgrades** — halbiert im Extremfall seinen Score. Fällt der Index auf 0, endet das Spiel vorzeitig in der **Vertrauenskrise** (die Wahl wird angefochten).

### Ränge

| Endpunktzahl | Rang |
|---|---|
| < 800 | Praktikant:in der Prüfstelle |
| 800–1499 | Junior-Analyst:in |
| 1500–2199 | Faktenjäger:in |
| 2200–2899 | Leitstellen-Profi |
| 2900–3599 | HYDRA-Schreck |
| ≥ 3600 | Legende der Wahlintegrität |

## 5. Ethik als Spielmechanik: die Dilemma-Upgrades

Nach Woche 1 und Woche 2 bietet das Ministerium je **eine von drei zufälligen Aufrüstungen** an. Jede ist ein echtes KI-Demokratie-Dilemma — mit **spürbaren Spielmechanik-Folgen** statt bloßem Text:

| Upgrade (Beispiele) | Nutzen | Preis |
|---|---|---|
| Massen-Scan-KI | +3 Energie/Woche | −10 Index (anlasslose Überwachung) |
| Automatische Vorab-Sperrung | Timer +10 s pro Fall | −12 Index (Löschung ohne Richtervorbehalt) |
| Transparenz-Offensive | +8 Index | −1 Energie/Woche (Offenlegung kostet Ressourcen) |
| Kooperation mit Plattformen | 1 Gratis-Prüfung pro Fall | −6 Index (Datenweitergabe an Konzerne) |
| Bürger:innen-Beirat | Fehlurteile kosten 3 Index weniger | −1 Energie/Woche (Beteiligung ist langsam) |
| Verzicht (immer wählbar) | +4 Index (Selbstbeschränkung schafft Vertrauen) | kein Bonus |

→ Die Kernfrage des Themas — *Effizienz durch KI vs. demokratische Grundrechte* — wird zur strategischen Entscheidung, die man am eigenen Score spürt.

## 5a. Der Einstieg: eine Einweisung statt einer Wand aus Text

Ein Spiel, dessen Kernaussage lautet „Die Oberfläche verrät nichts", hat ein Einstiegsproblem: Wer die Regeln nicht kennt, hält es für ein Quiz, rät – und lernt nichts. Ein Anleitungstext löst das nicht; er wird übersprungen.

WAHLWÄCHTER schaltet deshalb vor dem ersten Spiel eine **interaktive Einweisung** (eine Trainings-Schicht ohne Wertung). In zwölf Schritten wird jede Funktion einmal **selbst benutzt**, nicht nur beschrieben:

| Schritt | Was man tut |
|---|---|
| 1–2 | Auftrag lesen, ein Dossier ansehen und auf „echt oder gefälscht?" tippen – die Erfahrung, dass man es an der Oberfläche *nicht* wissen kann, ist der Aufhänger |
| 3–4 | Zwei Prüfwerkzeuge einsetzen (mit echtem Energieverbrauch), dann das Urteil fällen und die Auflösung samt realem Vorbild lesen |
| 5 | **Die Zensur-Falle:** ein legitimer Satire-Beitrag. Wer ihn kennzeichnet, erlebt sofort, dass Übersperren Demokratie-Index kostet |
| 6–7 | Punktesystem; der Demokratie-Index als **Regler**, an dem man sieht, wie 2.000 Rohpunkte auf 1.000 zusammenschrumpfen |
| 8 | Ein Dilemma-Upgrade wählen und das Debriefing lesen |
| 9 | Einen eigenen Fake bauen – und angezeigt bekommen, **welche Beweisspur trotzdem offen bleibt** |
| 10 | Denselben Fake in einem Feed wiederfinden |
| 11–12 | Überblick über alle Modi, Merkzettel mit fünf Sätzen |

Didaktisch entscheidend sind die Schritte 5 und 9: Die Zensur-Falle vermittelt die zweite Hälfte des Auftrags, bevor sie im echten Spiel Punkte kostet. Und wer einmal selbst gebaut hat, versteht die zentrale Einsicht des Spiels – perfekte Tarnung ist unmöglich, irgendein Kanal bleibt immer offen – als eigene Erfahrung statt als Behauptung.

Erstspieler:innen bekommen die Einweisung automatisch angeboten. Ob jemand schon gespielt hat, erkennt das Spiel an drei Dingen: einer abgeschlossenen Einweisung, lokalen Ergebnissen oder einem **globalen Profil zum eingegebenen Namen** – wer im Kurs schon gespielt hat, wird auch am fremden Gerät nicht erneut eingewiesen.

## 6. Spielmodi

### 6.1 Solo-Kampagne: „Drei Wochen gegen HYDRA"

3 Wochen × 6 Fälle, 2 Dilemma-Upgrades, Fälle werden pro Woche subtiler. **Finale:** HYDRA baut einen maßgeschneiderten Fake und versteckt ihn in einem **Boss-Feed** aus 4 Beiträgen — nur einer ist gefälscht, eine einzige Chance, doppelte Punkte. Das Ergebnis wandert in die **globale Rangliste** (Name, Endpunktzahl, Genauigkeit, Index); ohne Internet lokal als Fallback.

Alternativ: **♾️ Endlos-Modus** — Schicht um Schicht steigende Schwierigkeit; ab Schicht 3 erzeugt ein **Fall-Generator** immer neue, nie identische Fälle (in der Auflösung als generiert gekennzeichnet).

### 6.2 Online-Duell 1 vs 1

Zwei Spieler:innen verbinden sich über einen **kostenlosen HTTP-Spielserver** (Nachrichten-Postfächer mit Sekundentakt-Abruf – bewusst kein WebRTC, damit es auch in Schul-WLANs und Mobilnetzen zuverlässig funktioniert): Spieler:in A erstellt ein Duell und erhält einen **Raum-Code**, B tritt damit bei. Der Host legt vorher die **Regeln** fest: Fallzahl (6/10/14), Tempo (45/35/24 s), Schwierigkeit (gemischt/Profi) und Showdown an/aus.

- **Phase 1 – Wettermitteln:** Beide erhalten (per geteiltem Zufalls-Seed) **exakt dieselben Fälle** (2 Wellen) und spielen simultan. Der Punktestand des Gegners ist live sichtbar — Nervenkitzel durch direkten Vergleich.
- **Phase 2 – Showdown mit Rollentausch:** Jede:r baut **verdeckt in 75 Sekunden einen eigenen KI-Fake** aus Bausteinen (Thema × Format × Tarnmaßnahmen). Jede Tarnung löscht eine Beweisspur, aber das Budget ist knapp — perfekte Tarnung ist unmöglich, irgendeine Spur bleibt. Der gebaute Fake wird in einen Mini-Feed aus echten Beiträgen **beim Gegner** eingeschleust: Wer den gegnerischen Fake schneller findet, gewinnt die Showdown-Punkte.
- Sieger:in ist, wer nach Showdown die höhere **Endpunktzahl** hat (Demokratie-Index zählt auch hier — wer im Ermitteln schludert, verliert Multiplikator).

**Didaktischer Kniff des Showdowns:** Man versteht KI-Manipulation am tiefsten, wenn man sie einmal *selbst konstruiert* — und dabei merkt, welche Spuren sie zwangsläufig hinterlässt. Das Spiel lässt beide Seiten der Technologie erleben: Angriff und Verteidigung.

### 6.3 Tages-Challenge

Jeden Tag ein neuer, **für alle identischer Fallsatz** (Datums-Seed) — genau **1 Versuch pro Tag** und Gerät. Eigene Tages-Rangliste („Heute") macht den fairen Klassenvergleich möglich: Alle hatten dieselben Fälle.

### 6.4 Klassenraum

Bis zu **30 Spieler:innen** treten gleichzeitig in einer Runde an: ein Raum-Code für alle, identische Fälle, der/die Spitzenreiter:in ist live im Spiel sichtbar (👑). Zum Abschluss eine gemeinsame **Auswertung mit Podium**, die sich live aktualisiert, während Nachzügler:innen fertig spielen. Ideal für den Kurseinsatz auf iPads.

**Showdown in der Klasse.** Auf Wunsch des Hosts endet die Runde wie im Duell damit, dass jede:r einen eigenen KI-Fake baut — nur eben mit bis zu 30 Fakes gleichzeitig. Damit das im Unterricht funktioniert, muss die Verteilung drei Bedingungen erfüllen: niemand darf den eigenen Fake bekommen, die Fakes sollen sich gleichmäßig verteilen (nicht alle jagen denselben), und niemand darf auf Langsamere warten müssen.

Gelöst wird das ohne zentrale Instanz — jedes Gerät rechnet die Zuteilung selbst aus:

1. **Ring:** Alle Teilnehmenden bilden eine feste Reihenfolge; jede:r bekommt den Fake der nächsten Person darin. Das geht mathematisch perfekt auf und braucht keinerlei Absprache.
2. **Ausweichregel:** Ist diese Person noch nicht fertig, greift der Fake, der bisher am seltensten vergeben wurde.
3. **Auto-Fill gegen Leerlauf:** Ist nach 30 Sekunden noch nichts verfügbar, baut HYDRA automatisch einen Fake — mit sichtbarem Countdown. Der Unterricht steht nie still, auch wenn einzelne trödeln oder abbrechen.

Bleibt der eigene Fake beim Gegenüber unentdeckt, gibt es Bonuspunkte. In der Auswertung steht anschließend, wessen Fake man bekommen hat und wie es dem eigenen ergangen ist — ein natürlicher Gesprächsanlass darüber, welche Tarnung funktioniert hat und welche verraten wurde.

Ergänzend führt jede:r Spieler:in ein **Profil** (über den Spielnamen): Runden, Duell-Bilanz (Siege/Niederlagen/Unentschieden), Ø-Genauigkeit und Bestleistung — global gespeichert. Nach jeder Runde lässt sich in der **Fall-Auswertung** jeder Beitrag samt Auflösung und realem Vorbild nachlesen.

## 7. Warum das Konzept zum Thema passt

1. **KI als Angreifer:** Deepfakes, Botnetze, KI-Journalismus, Microtargeting — die realen KI-Bedrohungen für Wahlen sind der Spielinhalt.
2. **KI als Verteidiger — und die Kosten:** Die Dilemma-Upgrades zeigen, dass auch der Einsatz von KI *gegen* Desinformation demokratische Grundrechte gefährden kann. Das Spiel erzwingt diese Abwägung mechanisch.
3. **Medienkompetenz:** Die vier Prüfwerkzeuge sind reale Verifikationsmethoden; jede Auflösung erklärt echte Erkennungsmerkmale.
4. **Demokratie als Ressource:** Der Demokratie-Index macht „Vertrauen in Wahlen" zur spielbaren Größe — man kann nicht gewinnen, indem man sie opfert.
5. **Wettkampf:** Punktesystem, Rangliste und Online-Duell inkl. Showdown erfüllen den kompetitiven Anspruch des Kurses.
6. **Niedrige Einstiegshürde:** Die interaktive Einweisung sorgt dafür, dass die Aussage des Spiels ankommt, statt an unverstandenen Regeln zu scheitern — im Unterricht der Unterschied zwischen „raten" und „ermitteln".

## 8. Technische Umsetzung (Kurzüberblick)

- **Reines HTML/CSS/JavaScript** — läuft in jedem modernen Browser, keine Installation, kein Build-Schritt
- **Online-Duell:** Nachrichtenaustausch über einen kostenlosen Key-Value-Speicher (HTTP-Polling, „Postfach-Prinzip“) — kein eigenes Backend, keine Registrierung, funktioniert in jedem Netz, in dem die Website lädt
- **Klassenraum:** ein gemeinsamer Schlüssel für den ganzen Raum; jedes Gerät ändert darin nur den eigenen Eintrag (Lesen → Mergen → Schreiben → Verifizieren). Die Showdown-Zuteilung rechnet jedes Gerät selbst aus — dadurch braucht es keine Server-Logik
- **Gleiche Fälle im Duell und Klassenraum:** deterministischer Zufallsgenerator (Mulberry32) mit geteiltem Seed
- **Rangliste:** global über denselben Speicher (pro Modus), lokal als Fallback
- **Hosting:** GitHub Pages (kostenlos, HTTPS)

Ausführlich in [docs/TECHNIK.md](docs/TECHNIK.md).

## 9. Erweiterungsideen (Ausblick)

- Best-of-3-Revanche im Duell
- Team-Modus (Klasse gegen Klasse)
- Präsentationsmodus (Beamer-Ansicht für die Klassenraum-Auswertung)
- Eigene Fälle im Editor erstellen und als Datei teilen
- Bei Bedarf Umzug der Ranglisten auf einen skalierbareren Dienst (z. B. Firebase)
