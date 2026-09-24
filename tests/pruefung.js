"use strict";
/* =========================================================================
   PRÜFUNG – läuft mit Node, ohne Netz und ohne Abhängigkeiten.

     node tests/pruefung.js

   Rückgabewert 1, sobald eine Prüfung scheitert. Jede Gruppe steht für
   etwas, das in diesem Projekt schon einmal schiefging oder leicht
   schiefgehen kann. Wer einen neuen Fehler findet, ergänzt hier eine Gruppe.

   Die Spielskripte werden in einer Sandbox mit Attrappen für window,
   document und localStorage geladen – in derselben Reihenfolge wie im
   Browser. Der Speicherdienst wird dabei nie angesprochen.
   ========================================================================= */

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");
const lies = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const html = lies("index.html");
const css = lies("css/style.css");

let fehler = 0;
let gruppe = "";
function start(name) { gruppe = name; console.log("\n" + name); }
function pruefe(ok, text) {
  if (ok) console.log("  ok    " + text);
  else { fehler++; console.log("  FEHLER " + text); }
}

/* ---------- 1. Skripte: Reihenfolge, Version, Syntax ---------- */
start("Skripte in index.html");
const ERWARTET = ["anim", "rng", "data", "tdb", "net", "gen", "classroom", "tutorial", "game"];
const skripte = [...html.matchAll(/<script src="js\/([a-z]+)\.js\?v=([\d.]+)"><\/script>/g)];
pruefe(skripte.map(m => m[1]).join(",") === ERWARTET.join(","),
  "Ladereihenfolge " + ERWARTET.join(" → ") + " (tdb vor net, game zuletzt)");
const versionen = new Set(skripte.map(m => m[2]));
const cssVersion = (html.match(/css\/style\.css\?v=([\d.]+)/) || [])[1];
versionen.add(cssVersion);
pruefe(versionen.size === 1, "alle ?v= gleich (" + [...versionen].join(", ") + ")");
const jsDateien = fs.readdirSync(path.join(ROOT, "js")).filter(f => f.endsWith(".js"));
pruefe(jsDateien.length === ERWARTET.length && ERWARTET.every(n => jsDateien.includes(n + ".js")),
  "jede Datei in js/ wird geladen, keine verwaiste Datei");
for (const f of jsDateien) {
  let ok = true;
  try { new vm.Script(lies("js/" + f), { filename: f }); } catch (e) { ok = false; console.log("        " + e.message); }
  pruefe(ok, "Syntax js/" + f);
}

/* ---------- Sandbox laden ---------- */
const speicher = {};
const attrappe = () => new Proxy(function () {}, { get: (t, k) => (k === Symbol.toPrimitive ? () => "" : attrappe()), apply: () => attrappe() });
const ctx = vm.createContext({
  console, Math, JSON, Date, Intl, Promise, setTimeout, clearTimeout, setInterval, clearInterval,
  URL, encodeURIComponent, decodeURIComponent, AbortController,
  window: { addEventListener() {}, matchMedia: () => ({ matches: false, addEventListener() {} }) },
  document: { addEventListener() {}, getElementById: attrappe, querySelector: attrappe, querySelectorAll: () => [] },
  localStorage: { getItem: k => speicher[k] ?? null, setItem: (k, v) => { speicher[k] = String(v); }, removeItem: k => { delete speicher[k]; } },
  navigator: {},
  fetch: () => { throw new Error("Die Prüfung darf nicht ins Netz"); },
});
for (const n of ERWARTET) vm.runInContext(lies("js/" + n + ".js"), ctx, { filename: n + ".js" });
const imSpiel = (ausdruck) => vm.runInContext(ausdruck, ctx);
const DATA = imSpiel("DATA");

/* ---------- 2. Fälle ---------- */
start("Fall-Dossiers");
const WERKZEUGE = DATA.tools.map(t => t.id);
const ids = DATA.cases.map(c => c.id);
pruefe(new Set(ids).size === ids.length, ids.length + " Fälle, keine doppelte ID");
const proWoche = [1, 2, 3].map(w => DATA.cases.filter(c => c.week === w).length);
pruefe(DATA.weeks.every((w, i) => proWoche[i] >= w.cases * 2),
  "je Woche genug Fälle für Abwechslung (" + proWoche.join(" / ") + ")");
const unvollstaendig = DATA.cases.filter(c =>
  typeof c.isFake !== "boolean" || !c.title || !c.text || !c.resolution || !c.category || !c.medium ||
  !c.evidence || WERKZEUGE.some(t => !(t in c.evidence)));
pruefe(!unvollstaendig.length, "alle Pflichtfelder und alle vier Beweiskanäle vorhanden" +
  (unvollstaendig.length ? ": " + unvollstaendig.map(c => c.id).join(", ") : ""));
const ohneVorbild = DATA.cases.filter(c => !DATA.realRefs[c.id]);
pruefe(!ohneVorbild.length, "jeder Fall hat ein reales Vorbild in DATA.realRefs" +
  (ohneVorbild.length ? ": " + ohneVorbild.map(c => c.id).join(", ") : ""));
const verwaisteVorbilder = Object.keys(DATA.realRefs).filter(id => !ids.includes(id));
pruefe(!verwaisteVorbilder.length, "kein Vorbild ohne Fall" +
  (verwaisteVorbilder.length ? ": " + verwaisteVorbilder.join(", ") : ""));
const tutIds = Object.values(imSpiel("TUT_CASES")).map(c => c.id);
pruefe(tutIds.every(id => !ids.includes(id)), "Einweisung verrät keinen echten Fall (eigene Übungsfälle)");

/* ---------- 3. Showdown-Baukasten ---------- */
start("Showdown-Baukasten");
const sab = DATA.sabotage;
pruefe(sab.cloaks.every(c => WERKZEUGE.includes(c.channel) && c.cost > 0), "jede Tarnung hat Kanal und Kosten");
pruefe(sab.maxCloaks < WERKZEUGE.length, "nie alle Spuren tarnbar (" + sab.maxCloaks + " von " + WERKZEUGE.length + " Kanälen)");
const teuerste = sab.cloaks.map(c => c.cost).sort((a, b) => b - a);
pruefe(teuerste[0] + teuerste[1] > sab.budget, "die zwei stärksten Tarnungen passen nicht ins Budget (" + sab.budget + ")");
const rng = imSpiel("mulberry32")(4711);
let bauOk = true;
for (let i = 0; i < 300; i++) {
  const plan = imSpiel("randomBuild")(rng);
  const kosten = plan.cloakIds.reduce((s, id) => s + sab.cloaks.find(c => c.id === id).cost, 0);
  const karte = imSpiel("craftFake")(plan);
  if (kosten > sab.budget || plan.cloakIds.length !== sab.maxCloaks || WERKZEUGE.some(t => !(t in karte.evidence))) bauOk = false;
}
pruefe(bauOk, "300 Zufallsbaupläne: budgetkonform, vollständige Beweislage");

/* ---------- 4. Fall-Generator ---------- */
start("Fall-Generator");
let genOk = true, platzhalter = 0, fakes = 0;
const genRng = imSpiel("mulberry32")(99);
for (let i = 0; i < 500; i++) {
  const c = imSpiel("generateCase")(genRng);
  if (typeof c.isFake !== "boolean" || !c.title || !c.text || !c.resolution || WERKZEUGE.some(t => !(t in c.evidence))) genOk = false;
  if (/\{(stadt|person|zahl)\}/.test(c.title + c.text + c.resolution + Object.values(c.evidence).join(" "))) platzhalter++;
  if (c.isFake) fakes++;
}
pruefe(genOk, "500 erzeugte Fälle vollständig");
pruefe(platzhalter === 0, "keine offenen Platzhalter {stadt}/{person}/{zahl}");
pruefe(fakes > 150 && fakes < 350, "Mischung echt/Fake ausgewogen (" + fakes + " von 500 Fakes)");

/* ---------- 5. Tages-Challenge ---------- */
start("Tages-Challenge");
const deck = (d) => imSpiel("buildDailyDeck")(imSpiel("dailySeed")(d), imSpiel("dayNumber")(d)).deck.flat();
// Die ID erzeugter Fälle enthält einen Zähler pro Seite – verglichen wird der Inhalt.
const inhalt = (d) => deck(d).map(c => c.title + "|" + c.text).join("#");
pruefe(inhalt("2026-09-24") === inhalt("2026-09-24"), "gleiches Datum → gleicher Fallsatz für alle");
/* Fingerabdrücke fester Tage. Ändert sich einer, bekommt nach dem Hochladen
   ein Teil der Klasse am selben Tag andere Fälle als der Rest. Absichtlich
   ändern nur ab einem künftigen Zyklus (siehe DAILY_SEAM_FROM_CYCLE). */
const FINGERABDRUCK = { "2026-09-24": 4105920455, "2026-10-01": 3208183375 };
for (const [d, soll] of Object.entries(FINGERABDRUCK)) {
  pruefe(imSpiel("strHash")(inhalt(d)) === soll, "Fallsatz vom " + d + " unverändert");
}
let wiederholt = 0, haeufigster = 0, vorher = null;
const fenster = [];
for (let i = 0; i < 730; i++) {
  const datum = new Date(Date.UTC(2026, 9, 1 + i)).toISOString().slice(0, 10);
  const hand = deck(datum).filter(c => !c.generated).map(c => c.id);
  if (vorher) wiederholt += hand.filter(id => vorher.includes(id)).length;
  vorher = hand;
  fenster.push(hand);
  if (fenster.length > 30) fenster.shift();
  if (fenster.length === 30) {
    const z = {};
    fenster.flat().forEach(id => { z[id] = (z[id] || 0) + 1; });
    haeufigster = Math.max(haeufigster, ...Object.values(z));
  }
}
pruefe(wiederholt === 0, "730 Tage ab 01.10.2026: kein handgeschriebener Fall vom Vortag");
pruefe(haeufigster <= 6, "häufigster Fall in einem 30-Tage-Fenster höchstens 6× (gemessen " + haeufigster + "×)");
pruefe(imSpiel("todayStr")(new Date("2026-03-28T23:30:00Z")) === "2026-03-29", "Tageswechsel nach deutscher Zeit, nicht UTC");

/* ---------- 6. Speicherdienst ---------- */
start("Speicherdienst (js/tdb.js)");
const TDB = imSpiel("TDB");
const dienst = (wert) => decodeURIComponent(decodeURIComponent(encodeURIComponent(wert)).replace(/\+/g, " "));
const heikel = { n: "Anna+Ben 100%ig %22", s: 1e27, l: [{ n: "a+b" }] };
const wert = TDB.baueWert(heikel);
pruefe(!/[+%]/.test(wert), "hinausgehender Wert enthält weder + noch %");
let zurueck = null;
try { zurueck = JSON.parse(dienst(wert)); } catch (e) { /* unten */ }
pruefe(zurueck && zurueck.n === "Anna Ben 100ig 22" && zurueck.s === 1e27,
  "übersteht die doppelte Dekodierung des Dienstes unverändert");
pruefe(TDB.deute('{"s":1e 27}') && TDB.deute('{"s":1e 27}').s === 1e27, "alter Schaden „1e 27“ wird beim Lesen repariert");
pruefe(TDB.deute("{kaputt") === undefined, "Unlesbares wird als unlesbar gemeldet, nicht als leer");

/* ---------- 7. Profile: Größe und gleichzeitige Änderungen ---------- */
async function profilPruefungen() {
  start("Profile");
  const MAX_URL = imSpiel("TDB.MAX_URL"), GRENZE = imSpiel("PROFILE_MAX_URL");
  const KEY = imSpiel("PROFILE_KEY");
  const laenge = (profile) => TDB.adresslaenge(KEY, { profiles: profile });
  const profil = (n, g = 3) => ({ n, g, w: 1, l: 1, d: 0, bs: 2655, c: 20, t: 31, u: "2026-09-25" });
  const kapazitaet = (mach) => { const l = []; while (laenge(l.concat(mach(l.length))) <= GRENZE) l.push(mach(l.length)); return l; };
  const typisch = kapazitaet(i => profil("Spieler" + i));
  const breit = kapazitaet(i => profil("🦊Ärger🦊Öl🦊Übel🦊" + i));
  pruefe(typisch.length >= 120, "Platz für " + typisch.length + " typische Profile (mindestens 120)");
  pruefe(breit.length >= 50, "Platz für " + breit.length + " Profile mit 16 Zeichen Emoji/Umlauten (mindestens 50)");
  const gewachsen = typisch.map(p => Object.assign({}, p, { g: 999, w: 999, l: 999, d: 999, bs: 99999, c: 9999, t: 9999 }));
  pruefe(laenge(gewachsen) < MAX_URL, "volle Liste bleibt auch nach Jahren Spielbetrieb unter der Grenze des Dienstes (" + laenge(gewachsen) + " < " + MAX_URL + ")");

  // Speicher-Double statt textdb: speichert, was schreib() senden würde
  imSpiel(`globalThis.__speicher = {};
    TDB.lies = async (k) => (__speicher[k] === undefined ? null : TDB.deute(__speicher[k]));
    TDB.schreib = async (k, o) => { if (TDB.adresslaenge(k, o) > TDB.MAX_URL) throw new Error("zu groß"); __speicher[k] = TDB.baueWert(o); };`);
  const lege = (profile) => imSpiel("__speicher")[KEY] = JSON.stringify({ profiles: profile });
  const hole = () => JSON.parse(imSpiel("__speicher")[KEY]).profiles;

  lege([profil("Anna", 1)]);
  imSpiel('myName = "Anna"');
  await Promise.all([
    imSpiel("updateProfile")(p => { p.g += 1; }),
    imSpiel("updateProfile")(p => { p.l = (p.l || 0) + 1; }),
  ]);
  const anna = hole().find(p => p.n === "Anna");
  pruefe(anna.g === 2 && anna.l === 2, "zwei gleichzeitige Änderungen kommen beide an (Runden " + anna.g + ", Niederlagen " + anna.l + ")");

  // so weit füllen, dass auch ein frisches (kleines) Profil nicht mehr passt
  const frisch = { n: "Neuling", g: 1, w: 0, l: 0, d: 0, bs: 0, c: 0, t: 0, u: "2026-09-25" };
  const voll = typisch.slice();
  for (let i = 0; laenge(voll.concat(frisch)) <= GRENZE; i++) voll.push({ n: "F" + i, g: 1, u: "2026-09-25" });
  lege(voll);
  imSpiel('myName = "Neuling"');
  const neu = await imSpiel("updateProfile")(p => { p.g += 1; });
  pruefe(neu === false && hole().length === voll.length, "volle Liste: neuer Name wird abgewiesen, nichts überschrieben");
  imSpiel('myName = "Spieler0"');
  const alt = await imSpiel("updateProfile")(p => { p.g += 1; });
  pruefe(alt === true && hole().length === voll.length && hole()[0].g === 4, "volle Liste: bestehendes Profil wird weiter aktualisiert, keines fällt heraus");
}

/* ---------- 8. Commits unter Lasses Namen ---------- */
function commitPruefungen() {
  start("Commits seit 24.09.2026");
  const { execFileSync } = require("child_process");
  let log;
  try {
    log = execFileSync("git", ["log", "--since=2026-09-24T00:00:00", "--format=%H%x1f%an <%ae>%x1f%cn <%ce>%x1f%B%x1e"],
      { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  } catch (e) { console.log("  –     übersprungen (kein git oder kein Repository)"); return; }
  const ICH = "LasseToenjann <LasseToenjann@users.noreply.github.com>";
  const commits = log.split("\x1e").map(s => s.trim()).filter(Boolean).map(s => s.split("\x1f"));
  const fremd = commits.filter(([, autor, committer]) => autor !== ICH || committer !== ICH);
  const zeilen = commits.filter(([, , , text]) => /^(co-authored-by|[\w-]+-session):/im.test(text));
  pruefe(!fremd.length, commits.length + " Commits, alle unter " + ICH +
    (fremd.length ? " – abweichend: " + fremd.map(c => c[0].slice(0, 7) + " " + c[1]).join(", ") : ""));
  pruefe(!zeilen.length, "keine Mitautoren- oder Sitzungszeilen" +
    (zeilen.length ? ": " + zeilen.map(c => c[0].slice(0, 7)).join(", ") : ""));
}

/* ---------- 9. Ungenutzter Code ---------- */
start("Ungenutzter Code");
const alleJs = jsDateien.map(f => lies("js/" + f)).join("\n");
const ueberall = alleJs + "\n" + html;
const zaehle = (name, text) => (text.match(new RegExp("(?<![\\w$])" + name.replace(/\$/g, "\\$") + "(?![\\w$])", "g")) || []).length;
const tot = [];
for (const f of jsDateien) {
  const src = lies("js/" + f);
  for (const m of src.matchAll(/^(?:async\s+)?function\s+([A-Za-z_$][\w$]*)|^(?:const|let|var)\s+([A-Za-z_$][\w$]*)/gm)) {
    const n = m[1] || m[2];
    if (zaehle(n, ueberall) <= 1) tot.push(f + ": " + n);
  }
  if (["anim.js", "net.js", "classroom.js", "tdb.js"].includes(f)) {
    for (const m of src.matchAll(/^ {2}(?:async\s+)?([A-Za-z_$][\w$]*)\s*(?:\([^)]*\)\s*\{|:)/gm)) {
      if (zaehle(m[1], ueberall) <= 1) tot.push(f + ": " + m[1]);
    }
  }
}
pruefe(!tot.length, "keine Funktion, Konstante oder Methode ohne Verwendung" + (tot.length ? ": " + tot.join(", ") : ""));
const htmlIds = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
const idsOhneBezug = htmlIds.filter(id =>
  !alleJs.includes('"' + id + '"') && !alleJs.includes("'" + id + "'") && !alleJs.includes("#" + id) &&
  !new RegExp('(?:href="#|for="|aria-[a-z]+="|data-[a-z-]+=")' + id + '"').test(html) && !css.includes("#" + id));
pruefe(!idsOhneBezug.length, "jede id in index.html wird benutzt" + (idsOhneBezug.length ? ": " + idsOhneBezug.join(", ") : ""));
const jsIds = new Set([...alleJs.matchAll(/\bid="([^"$]+)"/g)].map(m => m[1]));
const fehlendeIds = [...alleJs.matchAll(/\$\(\s*"([^"]+)"\s*\)/g)].map(m => m[1]).filter(id => !htmlIds.includes(id) && !jsIds.has(id));
pruefe(!fehlendeIds.length, "jedes $(\"…\") findet sein Element" + (fehlendeIds.length ? ": " + [...new Set(fehlendeIds)].join(", ") : ""));
const klassen = new Set([...css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/\.([a-zA-Z_][\w-]*)/g)].map(m => m[1]).filter(k => !/^\d/.test(k)));
const tote = [...klassen].filter(k => { const re = new RegExp("(?<![\\w-])" + k + "(?![\\w-])"); return !re.test(html) && !re.test(alleJs); });
pruefe(!tote.length, "jede CSS-Klasse wird benutzt" + (tote.length ? ": " + tote.join(", ") : ""));

/* ---------- Ergebnis ---------- */
(async () => {
  try { await profilPruefungen(); }
  catch (e) { pruefe(false, "Profil-Prüfung abgebrochen: " + e.message); }
  commitPruefungen();
  console.log("\n" + (fehler ? fehler + " Prüfung(en) gescheitert." : "Alle Prüfungen bestanden."));
  process.exitCode = fehler ? 1 : 0;
})();
