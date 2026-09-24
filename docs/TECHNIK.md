# 🔧 Technik-Dokumentation

Alles, was man wissen muss, um am Code weiterzuarbeiten. Spielregeln stehen in der [Spielanleitung](SPIELANLEITUNG.md), die inhaltliche Begründung im [Konzept](../KONZEPT.md).

- [Grundsätze](#grundsätze)
- [Mobile zuerst](#mobile-zuerst)
- [Dateien und Zuständigkeiten](#dateien-und-zuständigkeiten)
- [Spielzustand](#spielzustand-g)
- [Datenmodell](#datenmodell-datajs)
- [Netzwerk](#netzwerk)
- [Klassenraum-Showdown: Verteilung der Fakes](#klassenraum-showdown-verteilung-der-fakes)
- [Tages-Challenge](#tages-challenge)
- [Einweisung](#einweisung-tutorialjs)
- [Ranglisten und Profile](#ranglisten-und-profile)
- [Animationen](#animationen)
- [Wichtige Entscheidungen](#wichtige-entscheidungen-und-warum)
- [Testen](#testen)
- [Erweitern](#erweitern)
- [Suchmaschinen](#suchmaschinen)
- [Bekannte Grenzen](#bekannte-grenzen)

---

## Grundsätze

- **Vanilla HTML/CSS/JS, kein Build, keine Abhängigkeiten.** Die Dateien, die im Repo liegen, sind exakt die, die im Browser laufen. Das ist Absicht: Das Projekt soll ohne Toolchain wartbar bleiben.
- **Kein eigenes Backend.** Alles Mehrspielerische läuft über einen kostenlosen öffentlichen Key-Value-Speicher.
- **Alles auf einer Seite.** `index.html` enthält jeden Screen als `<section class="screen">`; `showScreen(id)` schaltet um.
- **Mobile und iPad zuerst.** Gespielt wird auf Handys und Tablets; der Desktop ist die Zugabe. Layout-Entscheidungen fallen für die kleine Breite.
- **Deutsch im Code.** Kommentare, Bezeichner in den Daten und alle Texte sind deutsch – das Projekt wird von deutschsprachigen Menschen gelesen und abgegeben.

Ladereihenfolge der Skripte (wichtig, weil ohne Modulsystem gearbeitet wird):

```
anim.js → rng.js → data.js → tdb.js → net.js → gen.js → classroom.js → tutorial.js → game.js
```

`game.js` startet auf `DOMContentLoaded` mit `init()`. `tests/pruefung.js` prüft die Reihenfolge und dass alle Verweise denselben Versionsparameter `?v=` tragen – der muss bei jeder Änderung an CSS oder JS hochgezählt werden, sonst liefern GitHub Pages und die iPads die alte Fassung aus.

## Mobile zuerst

Das Spiel läuft im Unterricht auf Handys und iPads. Deshalb ist die kleine Breite der Maßstab, nicht der Desktop:

- Neue Screens zuerst bei **390 px** bauen, bei **320 px** gegenprüfen, erst dann am großen Bildschirm ansehen.
- Tippziele mindestens 44 px hoch (`.tool-btn`, `.mini-tool`, `.btn` sind entsprechend gesetzt), keine Funktion nur über Hover.
- `env(safe-area-inset-*)` an allen fest positionierten Elementen – sonst liegt Inhalt hinter Uhr und Home-Indikator.
- Nach jeder Layout-Änderung auf horizontalen Überlauf prüfen. Das Prüfmuster: jeden Screen kurz aktivieren und alle Elemente vergleichen –

```js
document.querySelectorAll('.screen').forEach(scr => {
  document.querySelector('.screen.active')?.classList.remove('active');
  scr.classList.add('active');
  const vw = document.documentElement.clientWidth;
  scr.querySelectorAll('*').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.width && (r.right > vw + 1 || el.scrollWidth > el.clientWidth + 1))
      console.warn(scr.id, el.tagName, el.className);
  });
  scr.classList.remove('active');
});
```

Beide Breiten müssen ohne Treffer durchlaufen. Häufigste Ursachen in der Vergangenheit: ein zu großer `clamp()`-Mindestwert bei Überschriften, Grid-/Flex-Kinder ohne `min-width: 0`, nicht umbrechende URLs.

## Dateien und Zuständigkeiten

| Datei | Zuständig für |
|---|---|
| `js/anim.js` | `Anim` – Animations-Helfer (Staffelung, Puls, Hochzählen, Stempel, Reihenfolge) |
| `js/rng.js` | `mulberry32` (deterministischer RNG), `seededShuffle`, `randomSeed`, `randomRoomCode` |
| `js/data.js` | Alle Inhalte: `cases`, `realRefs`, `weeks`, `ranks`, `tools`, `dilemmas`, `sabotage`, `feedReals`, `gen`, `scoring`, `endless` |
| `js/gen.js` | `randomBuild` (budgetkonformer Bauplan), `craftFake` (Bauplan → Fake-Karte mit Beweislage), `generateCase` (Generator für Endlos und Tages-Challenge) |
| `js/tdb.js` | `TDB` – Lesen und Schreiben auf textdb.online für Rangliste/Profile, Duell und Klassenraum |
| `js/net.js` | `Net` – Online-Duell über zwei Postfächer |
| `js/classroom.js` | `ClassNet` – Klassenraum, bis 30 Spieler:innen auf einem Raum-Key |
| `js/tutorial.js` | `Tutorial` – interaktive Einweisung mit eigenen Übungsfällen |
| `js/game.js` | Spiellogik, Screens, Timer, Punkte, Ranglisten, Profile, Verdrahtung |
| `sitemap.xml` | eine einzige URL – mehr gibt es nicht (siehe unten) |
| `robots.txt` | liegt bereit, wirkt im Projektpfad aber nicht (siehe unten) |
| `tests/pruefung.js` | Prüfungen ohne Netz (siehe [Testen](#testen)) |
| `tests/test-speicher.js` | ersetzt textdb beim Prüfen im Browser, damit keine echten Daten entstehen |

## Spielzustand (`G`)

Ein globales Objekt, erzeugt von `freshState(mode, name, seed)`. Die wichtigsten Felder:

| Feld | Bedeutung |
|---|---|
| `mode` | `"solo"` oder `"duel"` |
| `variant` | `"klassisch"` \| `"endlos"` \| `"tages"` \| `"klasse"` (nur bei `mode === "solo"`) |
| `seed` | Startwert des RNG – im Duell und Klassenraum geteilt, dadurch identische Fälle |
| `deck`, `sections` | Fälle je Abschnitt und die Abschnitts-Metadaten (Titel, Energie, Timer) |
| `secIdx`, `caseIdx` | aktueller Abschnitt / Fall darin |
| `score`, `index`, `energy`, `streak` | laufende Werte |
| `effects` | kumulierte Dilemma-Effekte |
| `history` | Protokoll für die Fall-Auswertung |
| `boss` | Zustand der Jagd (Feed, Index des Fakes, Energie) |
| `duel` | Duell-spezifisch: Gegnername, -punkte, Baupläne, Ergebnisse |
| `class` | Klassenraum-spezifisch: Konfiguration, eigener Bauplan, Zuteilung, Bonus |

Der Fluss durch die Screens läuft über `nextCase()`. Dort steht auch, welcher Modus wie endet – das ist die zentrale Weiche.

## Datenmodell (`data.js`)

Ein Fall-Dossier:

```js
{
  id: "w2_lokalzeitung", week: 2, isFake: true,
  category: "Gefälschtes Lokalmedium",
  medium: "artikel", source: "…", author: "…", handle: "…", reach: "…",
  title: "…", text: "…",              // Oberfläche – verrät NIE die Wahrheit
  evidence: {                          // null = Werkzeug nicht anwendbar
    forensik: null, quelle: "…", account: "…", fakten: "…",
  },
  resolution: "…",                     // Auflösung nach dem Urteil
}
```

**Regeln beim Schreiben neuer Fälle:**

1. `text` darf die Wahrheit nicht verraten – keine Rechtschreibfehler-Fakes, keine offensichtlichen Artefakte in der Oberfläche.
2. Indizien in `evidence` sollen einzeln mehrdeutig sein. Erst die Kombination trägt.
3. Zu jedem Fall gehört ein Eintrag in `DATA.realRefs[id]` mit dem realen, dokumentierten Vorbild – das ist der didaktische Kern.
4. `week` steuert die Schwierigkeit (1 = nachlässig, 3 = einzelne Kanäle gesäubert).

Aktueller Stand: **47 Fälle** (16 / 15 / 16 je Woche), 47 reale Vorbilder, 7 Dilemmas, Showdown-Baukasten mit 6 Themen × 4 Formaten × 4 Tarnungen.

Der Showdown-Baukasten liefert pro Format/Thema jeweils eine „schmutzige" und eine „saubere" Variante pro Beweiskanal (`*_dirty` / `*_clean`). `craftFake` wählt anhand der gesetzten Tarnungen aus – deshalb ist jeder gebaute Fake automatisch mit einer vollständigen, konsistenten Beweislage versehen.

## Netzwerk

Rangliste, Profile, Duell und Klassenraum laufen über **textdb.online**, einen kostenlosen öffentlichen Key-Value-Speicher:

- **Lesen:** `GET https://textdb.online/<key>?t=<zeitstempel>` (der Zeitstempel umgeht den Cache)
- **Schreiben:** `GET https://textdb.online/update/?key=<key>&value=<urlencoded JSON>`
  Schreiben per GET ist Absicht: kein CORS-Preflight, funktioniert überall.
- **Größe:** Weil der ganze Wert in der Adresse steckt, begrenzt deren Länge alles. Gemessen am 25.09.2026 mit einem Wegwerf-Schlüssel: bis rund 32.200 Zeichen geht es durch, ab etwa 32.270 antwortet der Dienst mit 500, ab 33.000 mit 414. `TDB.MAX_URL` (32.000) hält das fest; `TDB.schreib` sendet Größeres gar nicht erst, sondern wirft. `TDB.adresslaenge(key, obj)` rechnet vorher nach. Zum Vergleich: Ein voller Klassenraum mit 30 Spieler:innen kommt auf rund 8.200 Zeichen (gerechnet mit 16 Zeichen langen Namen und allen Feldern gefüllt).

Beides läuft ausschließlich über **`js/tdb.js`**. Rangliste, Duell und Klassenraum
hatten früher je eine eigene Kopie davon — mit denselben zwei Fehlern. Einzige
Ausnahme ist das `bye` beim Schließen der Seite (`Net._sayBye`): Es braucht
`keepalive` und darf nicht abgebrochen werden, baut seinen Wert aber ebenfalls mit
`TDB.baueWert()`.

### Der Dienst dekodiert zweimal

**Teuer erkauft, deshalb hier festgehalten.** textdb.online dekodiert den
übergebenen Wert zwei Mal und macht dabei im zweiten Durchgang aus jedem `+` ein
Leerzeichen. Nachgemessen mit einem Wegwerf-Schlüssel:

| gesendet | kommt an |
|---|---|
| `A+B` | `A B` |
| `%2B` | `+` |
| `e+27` | `e 27` |
| `&` `#` `/` `=` `~` | unverändert |

Ein Name mit `%` wird im zweiten Durchgang als Prozent-Code gelesen: Aus `%22`
wird ein Anführungszeichen, und das zerreißt das gespeicherte JSON. Bei `100%ig`
scheitert die Dekodierung des Dienstes ganz und der Wert geht verloren.

**Regel: Was hinausgeht, enthält weder `+` noch `%`.** Dafür sorgt
`TDB.baueWert()`; `TDB.sauber()` macht aus `+` ein Leerzeichen und entfernt `%`.
Angewendet wird das auf jede Zeichenkette im Datensatz — Namen, Raumcodes,
Nachrichten. Der Spielname wird zusätzlich schon im Eingabefeld bereinigt, damit
man ihn später so wiederfindet, wie er dort steht.

### Unlesbar ist nicht leer

Die alten Lesefunktionen gaben bei einem Lesefehler `null` zurück. Die Aufrufer
machten daraus eine leere Liste, ergänzten den eigenen Eintrag und schrieben
zurück — womit ein einziger verstümmelter Eintrag die ganze Rangliste, alle
Profile oder einen laufenden Klassenraum gelöscht hätte.

`TDB.lies()` gibt `null` deshalb **nur** zurück, wenn der Schlüssel leer ist.
Alles, was sich nicht lesen lässt, wirft. Die Aufrufer sind darauf ausgelegt:

| Stelle | Verhalten bei unlesbarem Inhalt |
|---|---|
| `pushGlobalScore` | drei Versuche, dann `false` → „Ergebnis nur auf diesem Gerät gespeichert" |
| `updateProfile` | drei Versuche, dann `false` — die Profile bleiben stehen |
| `ClassNet._merge` | vier Versuche, dann `merge failed` — der Raum bleibt stehen |
| `Net._poll` | zählt als Lesefehler; nach sechs in Folge gilt die Verbindung als weg |
| `Net.joinRoom` | meldet „Spielserver nicht erreichbar" statt „Raum nicht gefunden" |

Bekannter Schaden aus alten Fassungen wird beim Lesen repariert
(`1e 27` → `1e+27`), damit bestehende Einträge nicht verloren gehen.

### Online-Duell (`net.js`)

Zwei Postfächer pro Raum: `wahlwaechter_room_<code>_h` (Host) und `_g` (Gast). Jede Seite schreibt **nur** in ihr eigenes Postfach und liest das der Gegenseite alle 1,8 s. Nachrichten tragen eine laufende Nummer (`q`), damit nichts doppelt verarbeitet wird.

Nachrichtentypen: `hello`, `lobbyInfo`, `cfg`, `start`, `progress`, `sabotage`, `huntResult`, `final`.

**Lobby-Ablauf:** Der Host erstellt den Raum und wartet. Der Gast tritt bei und sendet `hello` mit seinem Namen. Der Host antwortet mit `lobbyInfo` (eigener Name + Regeln) – beide sind jetzt in der Lobby. Ändert der Host eine Regel, geht sofort ein `cfg` an den Gast; beim Gast sind die Regeln nur lesbar und der Start-Knopf fehlt. Erst der Start-Knopf des Hosts sendet `start` mit Seed und Regeln, und beide beginnen. (Vor v4.2 startete das Duell automatisch, sobald der Gast beitrat.)

Drei Fallstricke, die im Code adressiert sind:

- **Hintergrund-Tabs werden vom Browser auf ca. 1 Timer pro Minute gedrosselt.** Deshalb `_STALE_MS = 90 s` (nicht kürzer!) und ein Resync bei `visibilitychange`. Absichtliches Verlassen meldet über `pagehide` sofort ein `bye`.
- **Nachrichten werden immer VOR `bye`/`stale` verarbeitet.** Sonst geht das Endergebnis verloren, wenn die Gegenseite direkt nach dem Senden die Seite schließt.
- **Ein Abbruch in der Lobby ist immer ein Lobby-Abbruch** (`Net.onDropped` fragt den aktiven Screen ab). `G` hält nach einem Duell noch das beendete Spiel; bis v4.7 wurde ein Abbruch in der Lobby des nächsten Duells deshalb als „schon fertig" übergangen, und der Host blieb mit einem Gegner in der Lobby, den es nicht mehr gab. Mitten im Spiel spielt man nach einem Abbruch gegen HYDRA weiter.

### Klassenraum (`classroom.js`)

**Ein** Schlüssel für den ganzen Raum: `wahlwaechter_class_<code>`. Alle lesen ihn, jede:r ändert darin nur den **eigenen** Eintrag – Lesen → Ändern → Schreiben → Rücklesen-Verifikation, mit Wiederholungen gegen Kollisionen (`_merge`).

Der eigene Eintrag wird bei jedem Schreibvorgang **vollständig** aus `ClassNet._self` neu aufgebaut. Grund: Scheitert ein Schreibversuch an einer Kollision und würde nur der letzte Patch nachgezogen, gingen frühere Felder (Bauplan, Zuteilung, Trefferergebnis) dauerhaft verloren. So heilt sich jeder Schreibvorgang selbst.

Felder pro Spieler:in (bewusst einbuchstabig – der ganze Raum ist **ein** Wert in einer URL):

| Feld | Bedeutung |
|---|---|
| `g` | Spieler-ID (zufällig, pro Sitzung) |
| `n` | Name |
| `s` `x` `c` `a` `f` | Punkte, Demokratie-Index, Fall-Nr., Genauigkeit, fertig (1) |
| `b` | Zeitstempel des letzten Lebenszeichens |
| `bd` | gebauter Fake als Index-Liste `[thema, format, tarnung1, tarnung2]` |
| `ta` | zugeteilter Fake: Spieler-ID der Urheberin bzw. `"auto"` |
| `sd` | `1` = im Showdown angekommen (zählt für die Nachzügler-Frist) |
| `hr` | Showdown-Ergebnis: `1` gefunden, `0` nicht gefunden |

Die Regeln stehen als `cfg` im Raum-Zustand. In der Lobby kann nur der Host sie ändern (`ClassNet.setCfg`); alle anderen sehen sofort die neue Fassung und haben keinen Start-Knopf.

Die Abrufrate ist normal 2,6 s und während des Showdowns 1,3 s (`ClassNet.setPace`) – dort müssen Zuteilungen zügig sichtbar sein.

## Klassenraum-Showdown: Verteilung der Fakes

Die Anforderung: bis zu 30 selbstgebaute Fakes gleichmäßig verteilen, niemand bekommt den eigenen, und niemand wartet auf Trödler. Es gibt keinen Server, der das zuteilen könnte – **jeder Client rechnet die Zuteilung selbst aus** (`classTryAssign` in `game.js`):

1. **Ring.** Alle Raum-Mitglieder werden nach Spieler-ID sortiert; jede:r nimmt den Fake der nächsten Person im Ring. Das ist eine reine Funktion der Teilnehmerliste – kein Rennen, keine Absprache – und geht mathematisch perfekt auf: jeder Fake genau einmal, niemand bekommt den eigenen. Gilt, sobald diese Person abgegeben hat und ihren Fake noch niemand sonst genommen hat.
2. **Sonst der am wenigsten beanspruchte Fake.** Jede:r trägt seine Zuteilung als `ta` ein, alle sehen sie. Gleichstand wird pro Person unterschiedlich aufgelöst (Hash aus eigener und fremder ID). Ein bereits vergebener Fake wird nur als letzte Option genommen.
3. **Auto-Fill.** Ist nach `CLASS_FAKE_WAIT_MS` (60 s) noch nichts verfügbar, baut HYDRA per `randomBuild` einen Fake – deterministisch aus Raum-Seed und eigener ID. Der Wartebildschirm zeigt den Countdown und daneben live, wie viele Fakes schon vorliegen.

Dazu zwei Kleinigkeiten gegen Rennen: ein kurzer, pro Person unterschiedlicher **Versatz** (0–4 s, `CLASS_STAGGER_MS`) vor der Zuteilung und das erwähnte schnellere Polling.

**Simulationsergebnis** (30 Spieler:innen, Poll-Verzögerung berücksichtigt, Ergebnisse aus je 12 Durchläufen):

| Szenario | Fakes an genau 1 Person | an 3+ Personen | Wartezeit Ø / max |
|---|---|---|---|
| Ende über 2 Min verteilt | ~24 von 30 | ~0,2 | 2,4 s / 6 s |
| Ende über 5 Min verteilt | ~27 von 30 | ~0 | 3,8 s / 20 s |
| alle binnen 20 s fertig | ~17 von 30 | ~1,2 | 2,3 s / 4 s |
| kleine Gruppe (4–8) | fast alle | 0 | ~4 s |

„Eigener Fake" trat in keinem Durchlauf auf – das ist strukturell ausgeschlossen.

### Nachzügler in den Showdown holen

Damit die Klasse nicht auf Einzelne wartet, werden Nachzügler aus den Fällen geholt und in den Showdown gesetzt (`classCheckPull`). Der Auslöser ist bewusst **nicht** die erste fertige Person – sonst würde eine einzelne schnelle Person die halbe Klasse mitten aus der Runde reißen. Stattdessen:

1. Sobald **`CLASS_PULL_SHARE`** (60 %) der Raum-Mitglieder im Showdown sind (Feld `sd`, `bd` oder `f`), startet die Frist.
2. Die Frist läuft ab dem Moment, in dem das **eigene** Gerät den Schwellwert sieht – dadurch ist sie unabhängig davon, ob die Uhren der Geräte gleich gehen.
3. Nach **`CLASS_PULL_MS`** (45 s) wird der Timer gestoppt, die Bauphase geöffnet und ein Hinweis „Du warst zu langsam" eingeblendet (`#build-notice`). Die restlichen Fälle entfallen; der Showdown zählt normal.

Wird der Schwellwert nie erreicht (z. B. viele haben den Tab geschlossen), wird niemand herausgeholt – der Auto-Fill verhindert Downtime dann allein.

Der **Bonus für unentdeckte Fakes** (`classFakeBonus`, +200 je Person) wird erst nach dem eigenen Rundenende ausgewertet, weil das Gegenüber oft später fertig ist. Bis `CLASS_BONUS_WAIT_MS` (150 s nach der eigenen Abgabe) wird auf alle Urteile gewartet, damit der Bonus in einem Schritt kommt; danach wird ausgezahlt, was vorliegt. Wer den Fake erst später bekommt – ein hereingeholter Nachzügler, oder in seltenen Fällen eine zweite Person –, zählt trotzdem noch: `bonusCounted` merkt sich, was schon gezahlt ist, und zahlt die Differenz nach. Bis v4.6 schloss die Frist die Auswertung endgültig ab; späte Opfer brachten dann keinen Bonus, obwohl die Auswertung „unentdeckt geblieben" meldete.

## Tages-Challenge

Zwei Anforderungen zugleich: Der Fallsatz muss für alle Spieler:innen eines Tages **identisch** sein und sich trotzdem **jeden Tag erneuern**.

- **Datum:** `todayStr()` formatiert über `Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin" })`. Vorher lief alles über `toISOString()`, also UTC – die Challenge wechselte dadurch um 01:00 bzw. 02:00 Uhr statt um Mitternacht. Dasselbe Datum steuert die Ein-Versuch-Sperre und die Datumsangabe der Ranglisten-Einträge.
- **Seed:** hängt nur am Datum, also bekommen alle denselben Satz.
- **Handgeschriebener Teil (6 Fälle):** feste Rotation durch den ganzen Bestand. Innerhalb eines Zyklus (⌊47/6⌋ = 7 Tage) kommt kein Fall zweimal; jeder Zyklus mischt die Reihenfolge neu (`dailyCycleOrder`).
- **Zykluswechsel:** Weil jeder Zyklus frei neu mischt, konnte sein erster Tag Fälle vom letzten Tag des vorigen enthalten. Solche Fälle tauschen seit dem Zyklus ab 01.10.2026 (`DAILY_SEAM_FROM_CYCLE`) mit einem späteren Tag desselben Zyklus. Welche Fälle im Zyklus drankommen, bleibt gleich. Frühere Zyklen sind absichtlich unverändert, damit ein Update nie den Satz des laufenden Tages ändert.
- **Generierter Teil (4 Fälle):** derselbe `generateCase()` wie im Endlosmodus, gespeist aus dem Tages-Seed. Diese Fälle hat noch nie jemand gesehen. Ihre ID enthält einen Zähler pro Seite und ist deshalb nicht auf allen Geräten gleich – der Inhalt schon.

Gemessen mit `tests/pruefung.js` bzw. über 730 Tage ab 01.10.2026:

| | bis v4.3 | v4.4 – v4.6 | ab v4.7 |
|---|---|---|---|
| Fälle vom Vortag wiederholt | 2–4 von 10, täglich | an 67 von 105 Zykluswechseln, zusammen 89 Fälle | **0** |
| häufigster Fall in einem 30-Tage-Fenster | 11× | 6× | **6×** (ein Fenster berührt bis zu 6 Zyklen) |
| Tage mit komplett neuem Satz | – | alle (dank generierter Fälle) | alle |

**Wer an `buildDailyDeck`, an der Rotation oder an `DATA.cases` etwas ändert, ändert die Sätze künftiger – und womöglich des laufenden – Tages.** `tests/pruefung.js` hält deshalb Fingerabdrücke fester Tage fest und schlägt an, sobald sich einer ändert. Auch ein neuer Fall verschiebt die Rotation; dann die Fingerabdrücke bewusst neu setzen und den Wechsel so legen, dass er nicht mitten in einen Tag fällt, an dem schon gespielt wurde.

## Einweisung (`tutorial.js`)

Ein schrittbasierter Screen (`#screen-tutorial`) mit 12 Schritten. Jeder Schritt ist ein Objekt mit `kicker`, `title`, `text`, optionalem `stage(host)` (baut interaktiven Inhalt) und `needs: true`, wenn „Weiter" erst nach einer Aktion freigeschaltet wird (`Tutorial.unlock(hinweis)`).

Die Übungsfälle stehen absichtlich **in `tutorial.js` und nicht in `DATA.cases`** – so verrät die Einweisung keinen der 47 echten Fälle. Für Dilemmas, Showdown-Baukasten und Feed greift sie dagegen auf die echten Daten zu, damit sie nie veraltet.

**Wann sie erzwungen wird** (`tutorialShouldRun` in `game.js`) – jede der drei Bedingungen allein genügt als „hat schon gespielt":

1. `localStorage.ww_tut_v1` ist gesetzt (abgeschlossen oder übersprungen)
2. es liegen lokale Ergebnisse vor (`ww_board_v1`)
3. zum eingegebenen Namen existiert ein globales Profil mit mindestens einer Runde

Punkt 3 deckt Wiederkehrende auf einem neuen Gerät ab. Die Prüfung (`checkProfileKnown`) läuft **im Hintergrund** und blockiert nie den Spielstart; sie wird beim Laden und bei jeder Namensänderung angestoßen.

`beginMode(action)` ist der Einstieg in jeden Spielmodus: Name prüfen → Profil-Check anstoßen → ggf. Einweisung mit `action` als Fortsetzung öffnen → sonst direkt starten.

## Ranglisten und Profile

Schlüssel (öffentlich schreibbar – für ein Schulprojekt vertretbar):

| Zweck | Schlüssel |
|---|---|
| Rangliste Klassisch | `wahlwaechter_kl_x7k2m9` |
| Rangliste Endlos | `wahlwaechter_el_x7k2m9` |
| Rangliste Duell | `wahlwaechter_du_x7k2m9` |
| Rangliste Tages-Challenge | `wahlwaechter_tc_x7k2m9` |
| Rangliste Klassenraum | `wahlwaechter_kr_x7k2m9` |
| Profile | `wahlwaechter_pr_x7k2m9` |
| Duell-Räume | `wahlwaechter_room_<code>_h` / `_g` |
| Klassenräume | `wahlwaechter_class_<code>` |

Pro Modus werden maximal 30 Einträge gehalten; bei Überlauf fällt der schwächste heraus (ein Ergebnis, das nicht unter die besten 30 kommt, wird gar nicht erst eingetragen). Schreibzugriffe laufen überall über Lesen → Mergen → Schreiben → Verifizieren mit Wiederholungen. Ohne Internet greift ein `localStorage`-Fallback (`ww_board_v1`).

**Profile haben eine Größen-, keine Anzahlgrenze.** Alle Profile stehen in einem Wert. Ein neues Profil kommt nur hinzu, solange die Schreib-Adresse unter `PROFILE_MAX_URL` (24.000 Zeichen) bleibt – bei heutiger Profilgröße (rund 165 Zeichen) etwa 140 Profile, bei langen Namen mit Emoji oder Umlauten weniger (Prüfung: mindestens 100). Ist die Liste voll, bekommt ein neuer Name kein Profil, der Profil-Screen sagt das; bestehende Profile werden weiter aktualisiert, und **gelöscht wird nie etwas**. Der Abstand zu `TDB.MAX_URL` fängt das Wachstum bestehender Profile ab (gerechnet: alle Zähler vierstellig → rund 25.700 Zeichen). Bis v4.7 stand hier eine feste Kappung auf 120, die einen neuen Namen ab dem 121. stillschweigend abschnitt.

**Profil-Änderungen eines Geräts laufen nacheinander** (`updateProfile` reiht in `profileQueue` ein). Am Duell-Ende kommen zwei Änderungen fast gleichzeitig – Runde +1 aus `saveResult` und Sieg/Niederlage aus `showDuelResult`. Parallel lasen beide denselben alten Stand, die zweite überschrieb die erste, und die Kontrolle danach prüfte nur, ob das Profil „heute" geändert wurde. Im Test stand beim Verlierer nach einem Duell „0 Runden gespielt". Jetzt vergleicht die Kontrolle die Zähler (`g w l d c t bs`) mit dem, was geschrieben werden sollte, und wiederholt sonst. Gegen Schreibvorgänge *anderer* Geräte, die nach der Kontrolle eintreffen, hilft das nicht – ohne echte Transaktionen beim Dienst bleibt das ein Best-Effort-Verfahren.

**Die Rangliste zeigt nur die Antwort des zuletzt gestarteten Abrufs** (`boardRequest`). Vorher konnte bei schnellem Filterwechsel eine späte Antwort die gerade gewählte Liste überschreiben.

**Es gibt bewusst keinen Filter „Alle" mehr.** Die Modi haben verschiedene Fallzahlen, Timer und Multiplikatoren – eine gemeinsame Liste hätte Zahlen nebeneinandergestellt, die nichts miteinander zu tun haben. Standardfilter ist „Klassisch".

Die **Duell-Rangliste** führt Ergebnis und Bilanz zusammen: Die Punktzahl kommt aus dem Duell-Schlüssel, die Bilanz (S–N–U und Siegquote) aus den Profilen (`fetchDuelRecords`, `duelMeta`). Im Profil-Screen steht die Bilanz aller Spieler:innen deshalb nicht mehr – dort bleiben nur die eigenen Kennzahlen.

Jeder Lauf bekommt eine **stabile Ergebnis-ID** (`G.entryId`). `pushGlobalScore` legt den Eintrag entweder neu an oder aktualisiert ihn, wenn er schon dort steht. Nötig ist das für den Klassenraum: Der Bonus für unentdeckte Fakes kann erst eintreffen, wenn das Ergebnis längst gespeichert ist – dann zieht `storeEntry` den vorhandenen Eintrag nach, statt einen zweiten anzulegen.

Alle Schreibzugriffe laufen über `js/tdb.js` — siehe „Der Dienst dekodiert
zweimal" und „Unlesbar ist nicht leer" im Kapitel Netzwerk. Ein unlesbarer
Schlüssel wird nie überschrieben.

> ⚠️ **Daten nie eigenmächtig löschen.** Ein „frisches Leeren" der Schlüssel hat schon einmal echte Spielstände unwiederbringlich vernichtet – textdb.online hat keine Historie. Leeren nur auf ausdrückliche Anweisung: `GET https://textdb.online/update/?key=<KEY>&value={"scores":[]}` (Profile: `{"profiles":[]}`).

## Animationen

Das Konzept heißt **„Lagezentrum"** und steht ausführlich im Kopf von `js/anim.js`; die Umsetzung liegt im Abschnitt „Animationen" von `css/style.css`. Kurzfassung:

**Drei Regeln.** (1) Jede Bewegung beantwortet eine Frage – woher kam das, was hat sich geändert, was passiert gerade, war das richtig. (2) Kurz (120–320 ms), außer es ist ein bewusster Moment. (3) Nur `transform` und `opacity`, damit es auf alten iPads flüssig bleibt.

**Sechs Ebenen:**

| Ebene | Umsetzung |
|---|---|
| Screen | `showScreen(id, dir)` – vorwärts steigt der Screen auf, `goBack(id)` lässt ihn sinken. Alle Zurück-/Hauptmenü-Wege nutzen `goBack` |
| Overlay | Backdrop blendet, Karte skaliert mit leichtem Überschwingen; beim Schließen 150 ms Ausblendung |
| Inhalt | `Anim.stagger(container, selector)` setzt `--i` und die Klasse `anim-in`. Statische Screens brauchen kein JS: die Klasse `stagger-css` staffelt per `nth-child` |
| Zustand | `hudSet()` vergleicht mit dem letzten Wert und pulst: Punkte grün, Index-Schaden rot zitternd, Energie amber |
| Feedback | Knopfdruck, Chip-Einrasten, Scan-Streifen über benutzte Werkzeuge, Beweise gleiten von links ein |
| Ambiente | Driftendes Raster (`body::before`, GPU-Transform), glimmender Titel, atmender Raum-Code, pulsierender Timer unter 22 % |

Die Inhalts-Ebene kennt **zwei Richtungen**: Neu aufgebaute Bereiche steigen auf (`anim-in`), das *nächste Element einer Reihe* kommt von rechts (`Anim.next` / `next-in`). Dadurch unterscheidet sich ein neuer Fall sichtbar von einem neuen Screen. Ergänzt sind außerdem: gewähltes Urteil bleibt markiert (`.chosen`), Budget in der Fake-Werkstatt und Energie in der Jagd pulsen bei Änderung, die Fall-Nummer pulst beim Wechsel.

Meldungen am unteren Rand (`netBanner(text, art)`) sind eine Karte mit farbigem Randstreifen – `info` (Standard), `warn`, `error`, `good`. Bewusst **kein** Pillen-Oval: Sobald der Text zwei Zeilen braucht, wird aus `border-radius: 999px` eine Ellipse.

**Signature-Momente:** Das Urteil wird gestempelt (`Anim.stamp`), die Endpunktzahl zählt hoch (`Anim.countUp`), das Klassenraum-Podium läuft gestaffelt ein.

**Zwei Fallstricke, die im Code adressiert sind:**

1. Overlays sind während der 150 ms Ausblendung noch im DOM, aber schon „zu". Deshalb prüft man Offenheit mit **`overlayOpen(id)`**, nicht mit `classList.contains("hidden")` – sonst wartet die Duell-Logik auf ein Overlay, das gerade verschwindet.
2. Das Hintergrundraster liegt auf einer eigenen `position: fixed`-Ebene und wird per `transform` bewegt. Ein animiertes `background-position` auf `<body>` würde bei jedem Bild neu gemalt.

`prefers-reduced-motion: reduce` schaltet alles ab (CSS-Regel plus `Anim.reduced`, das auch die JS-seitigen Effekte überspringt). Die Einstellung wird live ausgewertet, nicht nur beim Laden.

## Wichtige Entscheidungen (und warum)

1. **Kein WebRTC.** PeerJS/TURN ist real zwischen Geräten gescheitert (Schul-WLAN, Mobilnetze, NAT). Der HTTP-Relay über textdb funktioniert überall, wo die Website lädt. jsonblob und extendsclass fielen wegen CORS durch.
2. **Schreiben per GET-Query** statt POST – vermeidet den CORS-Preflight.
3. **Stale-Timeout 90 s statt 15 s**, weil Browser Hintergrund-Tabs massiv drosseln. Kurzes Wegwischen der App darf ein Duell nicht beenden.
4. **Fälle fiktiv, Techniken real.** Jede Auflösung nennt das reale Vorbild; das FIKTIV-Badge steht in jedem Dossier. Generierte Fälle sind in der Auflösung als solche gekennzeichnet.
5. **Profile identifizieren sich nur über den Namen.** Namensgleiche teilen sich ein Profil – bewusst simpel gehalten.
6. **Die gültige Live-URL ist `https://lassetoenjann.github.io/wahlwaechter/`**, das Repo liegt unter `LasseToenjann/wahlwaechter` (Privatkonto, ohne Bindestrich). Die alte Adresse `lasse-toenjann.github.io/wahlwaechter/` ist tot – `lasse-toenjann` mit Bindestrich ist Lasses Geschäftskonto und hat mit diesem Projekt nichts zu tun. Das lokale `git remote` zeigt bereits auf die neue Adresse.
7. **Spielzahlen stehen in `js/data.js`.** Auch die Werte des Finales (`DATA.scoring.huntHit` = 300, `huntMissDamage` = 15) – die Einweisung zeigt dieselben Zahlen an. Bis v4.6 standen sie fest im Code, während in den Daten ein nie benutztes `bossPointsBase: 200` stand.

## Testen

Zwei Stufen, beide ohne Abhängigkeiten:

**1. `node tests/pruefung.js`** – läuft ohne Netz in unter einer Sekunde und endet mit Rückgabewert 1, sobald etwas scheitert. Das Skript lädt alle Spielskripte in einer Node-Sandbox (Attrappen für `window`, `document`, `localStorage`; ein `fetch` dort bricht absichtlich ab) und prüft:

| Gruppe | Was |
|---|---|
| Skripte | Ladereihenfolge, gleicher `?v=` überall, keine verwaiste Datei in `js/`, Syntax |
| Fall-Dossiers | eindeutige IDs, Pflichtfelder, alle vier Beweiskanäle, reales Vorbild zu jedem Fall, Übungsfälle der Einweisung getrennt |
| Showdown-Baukasten | Kanal und Kosten je Tarnung, nie alle Spuren tarnbar, die zwei stärksten passen nicht ins Budget, 300 Zufallsbaupläne |
| Fall-Generator | 500 erzeugte Fälle vollständig, keine offenen Platzhalter, Mischung echt/Fake |
| Tages-Challenge | gleicher Satz für alle, Fingerabdrücke fester Tage, 730 Tage ohne Vortags-Wiederholung, Häufigkeit, deutsche Zeit |
| Speicherdienst | kein `+`/`%` hinaus, übersteht die doppelte Dekodierung, Reparatur von `1e 27`, Unlesbares ist nicht leer |
| Ungenutzter Code | Funktionen, Konstanten und Methoden ohne Verwendung, HTML-IDs ohne Bezug, `$("…")` ohne Element, CSS-Klassen ohne Verwendung |
| Profile | Platz für typische und für breite Namen, volle Liste bleibt nach Wachstum unter `TDB.MAX_URL`; mit einem Speicher-Double statt textdb: zwei gleichzeitige Änderungen kommen beide an, volle Liste weist neue Namen ab und aktualisiert bestehende |
| Commits seit 24.09.2026 | Autor und Committer `LasseToenjann <LasseToenjann@users.noreply.github.com>`, keine Mitautoren- oder Sitzungszeilen (ohne git: übersprungen) |

Wer einen neuen Fehler findet, ergänzt dort eine Gruppe.

**2. Durchspielen im Browser** – lokaler Server, Handy-Breite, und **vor dem ersten Klick `tests/test-speicher.js` in die Konsole einfügen.** Der Test-Speicher ersetzt textdb durch den `localStorage` der Test-Adresse und bildet die doppelte Dekodierung nach. Mehrere Tabs derselben Adresse teilen ihn; so lassen sich Duell (zwei Tabs) und Klassenraum (drei Tabs) komplett durchspielen, ohne echte Daten anzufassen. Die Spiellogik ist aus der Konsole steuerbar (`G`, `DATA`, `Net`, `ClassNet`, `Tutorial`, `currentCase()`, `judge()`, `nextCase()` sind global) – damit lassen sich lange Runden in Sekunden durchspielen.

```bash
node tests/pruefung.js            # Prüfungen ohne Netz
python -m http.server 8123        # dann http://localhost:8123, Test-Speicher einfügen
```

Mindestens abdecken: Einweisung von vorn bis hinten, Solo klassisch **bis ins Boss-Finale** (dazu muss man richtig antworten – sonst endet der Lauf vorher in der Vertrauenskrise), Endlos, Tages-Challenge samt Sperre, Duell mit Showdown (danach beide Profile: Runden **und** Bilanz), Klassenraum mit Showdown (jemand gibt nicht ab, jemand bleibt in den Fällen hängen), Rangliste mit schnellem Filterwechsel, Überlauf bei 320 und 390 px.

**Den ausgelieferten Stand prüfen.** GitHub Pages cacht JavaScript rund 10 Minuten – wer die Live-Seite im Browser kontrolliert, muss vorher hart neu laden. In manchen Entwicklungsumgebungen (Cloud-Sitzungen) ist `github.io` durch die Netz-Richtlinie gesperrt; dieselbe Prüfung geht dann gegen eine lokale Kopie des ausgelieferten Dateistands:

```bash
git archive origin/main | tar -x -C /tmp/livecopy
cd /tmp/livecopy && python -m http.server 8124
```

## Erweitern

**Neuen Fall hinzufügen:** Objekt in `DATA.cases` ergänzen, Eintrag in `DATA.realRefs` mit demselben `id`. Decks werden aus `week` gebaut. Aber: Ein neuer Fall verschiebt die Rotation der Tages-Challenge – `tests/pruefung.js` meldet dann geänderte Fingerabdrücke. Den Fall deshalb abends nach Unterrichtsschluss hochladen (nicht an einem Tag, an dem gerade gespielt wird), die Fingerabdrücke bewusst neu setzen und in `docs/AENDERUNGEN.md` vermerken, ab wann die neuen Sätze gelten.

**Neues Dilemma:** Objekt in `DATA.dilemmas`; die Effekte in `chooseDilemma` unterstützen `energyPerWeek`, `timerPlus`, `freeProbe`, `damageShield`, `flagPenaltyPlus`, `indexNow`.

**Neue Tarnung/Format/Thema:** in `DATA.sabotage` ergänzen. Wichtig: Jede Tarnung braucht einen `channel` (Werkzeug-ID) und `cost`; jedes Format/Thema braucht `*_dirty` und `*_clean` für die betroffenen Kanäle. Das Budget (`sabotage.budget`) muss so gesetzt bleiben, dass **nicht** alle Spuren verwischt werden können – das ist die Kernaussage des Showdowns.

**Neuen Schritt in der Einweisung:** Objekt in `Tutorial.steps` einfügen; die Fortschrittsanzeige rechnet automatisch mit.

## Suchmaschinen

Das Spiel ist **eine einzige Seite**: Alle Screens sind `<section>`s in `index.html`, umgeschaltet per JavaScript. Es gibt kein `location.hash`, kein `location.search`, kein `pushState` und keine Raum-Links – also **keine zweite URL**, die man indexieren könnte. Räume werden über eingetippte Codes betreten, nicht über Adressen.

| Datei / Tag | Zweck |
|---|---|
| `<meta name="google-site-verification">` | bestätigt die Property in der Google Search Console. Muss im `<head>` bleiben – ohne das Tag gilt die Seite dort als unbestätigt. |
| `<link rel="canonical">` | verhindert, dass `/` und `/index.html` getrennt im Index landen |
| `sitemap.xml` | enthält genau eine URL. In der Search Console einzureichen als `https://lassetoenjann.github.io/wahlwaechter/sitemap.xml` |
| `robots.txt` | **wirkt derzeit nicht** – siehe unten |

**Warum `robots.txt` hier folgenlos ist:** Suchmaschinen lesen die Datei ausschließlich im Wurzelverzeichnis einer Domain, also unter `https://lassetoenjann.github.io/robots.txt`. Das Spiel liegt aber im Projektpfad `/wahlwaechter/`; diese Wurzel gehört zum Repository `lassetoenjann.github.io`, nicht hierher. Die Datei liegt trotzdem im Repo: Unter einer eigenen Domain wird sie ohne Änderung wirksam, und wer den Ausschluss jetzt schon will, kopiert den Inhalt ins Wurzel-Repository.

Praktisch ist das unkritisch. Die Markdown-Dateien (`README.md`, `KONZEPT.md`, `docs/*.md`) sind über Pages zwar abrufbar, aber von der Seite aus **nirgends verlinkt** – Suchmaschinen finden sie nicht von allein. Wer sie wirklich aus der Auslieferung nehmen will, bräuchte ein `_config.yml` mit `exclude:`; das verändert den Jekyll-Build und ist für den Nutzen zu viel Risiko.

Nicht ausschließen sollte man `css/` und `js/`: Google rendert die Seite vor dem Indexieren und braucht beides. Rund 1.350 Wörter stehen fest im HTML (Start, Modi, Hilfe-Tabellen), sind also auch ohne JavaScript lesbar.

## Bekannte Grenzen

- **textdb.online** sichert weder Rate-Limits noch Persistenz zu. Bei 30 gleichzeitigen Spieler:innen entstehen grob 15–25 Anfragen pro Sekunde. Mit kleinen Gruppen problemlos. Ein Lasttest mit 30 simulierten Geräten wurde bewusst wieder entfernt: Er hat gegen den echten Dienst gemessen, das Ergebnis schwankte mit dessen Tagesform und der Aufwand stand in keinem Verhältnis zum Nutzen für ein Schulprojekt. Wenn es im Unterricht doch klemmt, wäre der Fallback ein Umzug auf einen skalierbareren Dienst (z. B. Firebase).
- Die Zuteilung im Klassenraum-Showdown ist ein **Best-Effort-Verfahren**: In seltenen Fällen (viele Abgaben in derselben Sekunde) kann ein Fake an zwei Personen gehen. Das ist unschädlich – niemand bekommt je den eigenen, und niemand wartet.
- Ranglisten sind öffentlich beschreibbar. Für ein Schulprojekt vertretbar, für einen echten Wettbewerb nicht.
- Der Klassenraum-Zustand ist **ein** JSON-Wert in einer URL. Deshalb sind die Feldnamen so kurz. Wer Felder ergänzt, sollte das im Blick behalten.
- **Dasselbe gilt für die Profile.** Alle Profile stehen in einem Wert, der beim Schreiben in der Adresse steckt. Stand 24.09.2026 (nur lesend): 17 Profile, 1.355 Zeichen JSON, URL-kodiert 2.803 Zeichen – rund 165 Zeichen pro Profil. Mit der gemessenen Grenze des Dienstes (rund 32.200 Zeichen, siehe „Netzwerk") ist Platz für etwa 140 Profile (`PROFILE_MAX_URL`). Die frühere Annahme „~7.500 Zeichen, also 40–45 Profile" war nie gemessen und falsch. Mehr Platz bekäme man, indem man Null-Zähler wegließe (−24 %) oder die Profile auf mehrere Schlüssel verteilte; beides ändert das gespeicherte Format, und Geräte mit noch zwischengespeicherter alter Fassung würden es falsch lesen (zum Beispiel „NaN %" als Siegquote). Für einen Kurs reicht die heutige Menge – Lasse: „40–45 reichen eigentlich".
- **Netze zwischen Gerät und Dienst** (Schul-Proxy o. Ä.) könnten kürzere Adressen erzwingen. Gemessen wurde nur vom Entwicklungsrechner aus.
- **Spiel-Timer zählen pro Takt, nicht nach der Uhr.** In einem verborgenen Tab drosselt der Browser die Takte, der Timer läuft dann langsamer. Im Unterricht egal (das iPad pausiert die Seite ohnehin), beim Testen mit mehreren Tabs aber auffällig: Die Fake-Werkstatt eines Hintergrund-Tabs läuft nicht nach 75 s ab.
