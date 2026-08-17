"use strict";
/* =========================================================================
   WAHLWÄCHTER – Spiellogik (v3)
   Solo (Klassisch / Endlos mit Fall-Generator), Tages-Challenge,
   Online-Duell mit konfigurierbaren Regeln + Showdown-Budget,
   Klassenraum (bis 30), Fall-Auswertung, Profile, globale Ranglisten.
   ========================================================================= */

/* ---------- Kurz-Helfer ---------- */
const $ = (id) => document.getElementById(id);
const S = DATA.scoring;

/* Screens haben eine Richtung: vorwärts steigen sie auf, zurück sinken sie.
   „back" setzen alle Zurück-/Hauptmenü-Wege (siehe goBack). */
function showScreen(id, dir) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active", "nav-back"));
  const el = $(id);
  el.classList.toggle("nav-back", dir === "back");
  el.classList.add("active");
  window.scrollTo(0, 0);
}
function goBack(id) { showScreen(id, "back"); }

/* Overlays blenden auch beim Schließen aus. Weil an mehreren Stellen geprüft
   wird, ob ein Overlay offen ist, gibt es dafür overlayOpen() – während der
   Ausblendung gilt es bereits als geschlossen. */
function showOverlay(id, on) {
  const el = $(id);
  if (on) {
    el.classList.remove("closing");
    el.classList.remove("hidden");
    return;
  }
  if (el.classList.contains("hidden") || el.classList.contains("closing")) return;
  if (Anim.reduced) { el.classList.add("hidden"); return; }
  el.classList.add("closing");
  setTimeout(() => {
    if (!el.classList.contains("closing")) return;   // zwischenzeitlich wieder geöffnet
    el.classList.add("hidden");
    el.classList.remove("closing");
  }, 150);
}
function overlayOpen(id) {
  const el = $(id);
  return !el.classList.contains("hidden") && !el.classList.contains("closing");
}
function esc(str) {
  const d = document.createElement("div");
  d.textContent = String(str);
  return d.innerHTML;
}
const MEDIUM_LABEL = { video: "🎬 Video", bild: "🖼️ Bild", artikel: "📰 Artikel", post: "💬 Post", anzeige: "📢 Anzeige" };
/* Alle Datumsangaben laufen über die deutsche Zeit, nicht über UTC – sonst
   würde die Tages-Challenge nicht um Mitternacht wechseln, sondern um 01:00
   bzw. 02:00 Uhr. "en-CA" liefert das Format JJJJ-MM-TT. */
const BERLIN_FMT = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit",
});
const todayStr = (d) => BERLIN_FMT.format(d || new Date());

/* Fortlaufende Tagesnummer – Grundlage für die Rotation der Tages-Challenge */
function dayNumber(dateStr) {
  const [y, m, d] = (dateStr || todayStr()).split("-").map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
}
function strHash(s) {
  let h = 0;
  for (let i = 0; i < String(s).length; i++) h = (Math.imul(h, 31) + String(s).charCodeAt(i)) >>> 0;
  return h >>> 0;
}

/* Exklusive Auswahl-Chips (Duell-/Klassenraum-Einstellungen) */
function initChipGroup(groupId) {
  document.querySelectorAll("#" + groupId + " .chip").forEach(chip => {
    chip.addEventListener("click", () => {
      document.querySelectorAll("#" + groupId + " .chip").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
    });
  });
}
function chipVal(groupId) {
  const el = document.querySelector("#" + groupId + " .chip.active");
  return el ? parseInt(el.dataset.v, 10) : 0;
}

/* ---------- Spielzustand ---------- */
let G = null;
let myName = "";
let reviewReturn = "screen-result";

function freshState(mode, name, seed) {
  resetHud();
  return {
    mode, name,                  // mode: "solo" | "duel"
    variant: "klassisch",        // solo: klassisch | endlos | tages | klasse
    seed,
    deck: [], sections: [],
    secIdx: 0, caseIdx: 0, caseNo: 0,
    score: 0, index: 100, energy: 0, streak: 0, maxStreak: 0,
    correct: 0, total: 0,
    usedEnergy: 0, freeProbeUsed: false, resolved: false,
    effects: { energyPerWeek: 0, timerPlus: 0, freeProbe: false, damageShield: 0, flagPenaltyPlus: 0 },
    offeredDilemmas: [],
    lastEnergyBonus: 0, lastPerfectBonus: 0,
    shift: 0, shiftErrors: 0, usedCaseIds: [],
    crisis: false,
    history: [],                 // Fall-Auswertung
    boss: null,
    duel: null,
    finalScore: 0, resultSaved: false,
  };
}

/* ---------- Deck-Aufbau ---------- */
function buildSoloDeck(seed) {
  const rng = mulberry32(seed);
  const deck = [], sections = [];
  DATA.weeks.forEach(w => {
    const pool = DATA.cases.filter(c => c.week === w.nr);
    deck.push(seededShuffle(pool, rng).slice(0, w.cases));
    sections.push({ title: w.title, intro: w.intro, energy: w.energy, timer: w.timer, kicker: "LAGEBERICHT · WOCHE " + w.nr });
  });
  return { deck, sections };
}

/* Gemischtes Deck für Duell / Tages-Challenge / Klassenraum */
function buildMixedDeck(seed, cfg, kickerBase) {
  const rng = mulberry32(seed);
  const total = cfg.cases || 10;
  const per = Math.ceil(total / 2);
  let pool;
  if (cfg.hard) {
    pool = [
      ...seededShuffle(DATA.cases.filter(c => c.week === 2), rng),
      ...seededShuffle(DATA.cases.filter(c => c.week === 3), rng),
    ];
  } else {
    const n1 = Math.round(total * 0.3), n3 = Math.round(total * 0.3);
    const n2 = total - n1 - n3;
    pool = [
      ...seededShuffle(DATA.cases.filter(c => c.week === 1), rng).slice(0, n1),
      ...seededShuffle(DATA.cases.filter(c => c.week === 2), rng).slice(0, n2),
      ...seededShuffle(DATA.cases.filter(c => c.week === 3), rng).slice(0, n3),
    ];
  }
  const all = pool.slice(0, total);
  const deck = [all.slice(0, per), all.slice(per)];
  const energy = Math.max(4, Math.round(per * 1.8));
  const timer = cfg.timer || 35;
  const sections = [
    { title: "Welle 1 – Gleiche Fälle, gleiche Chance", intro: "Alle prüfen exakt dieselben Beiträge. Genauigkeit schlägt Hektik – aber die Uhr tickt.", energy, timer, kicker: kickerBase + " · WELLE 1/2" },
    { title: "Welle 2 – HYDRA legt nach", intro: "Die zweite Welle ist subtiler. Konzentration!", energy, timer, kicker: kickerBase + " · WELLE 2/2" },
  ];
  return { deck, sections };
}

/* Endlos: nächste Schicht (ab Schicht 3 zunehmend generierte Fälle) */
function buildShift(s) {
  const E = DATA.endless;
  const rng = mulberry32((G.seed + s * 104729) >>> 0);
  const weeks = E.poolForShift(s);
  let pool = DATA.cases.filter(c => weeks.includes(c.week) && !G.usedCaseIds.includes(c.id));
  if (pool.length < E.casesPerShift) {
    G.usedCaseIds = G.usedCaseIds.filter(id => {
      const c = DATA.cases.find(x => x.id === id);
      return c && !weeks.includes(c.week);
    });
    pool = DATA.cases.filter(c => weeks.includes(c.week) && !G.usedCaseIds.includes(c.id));
  }
  const shuffled = seededShuffle(pool, rng);
  const genChance = s < 3 ? 0 : Math.min(0.75, 0.25 + 0.12 * (s - 3));
  const cases = [];
  for (let i = 0; i < E.casesPerShift; i++) {
    if ((rng() < genChance || !shuffled.length) && s >= 3) {
      cases.push(generateCase(rng));
    } else {
      const c = shuffled.shift();
      if (c) { cases.push(c); G.usedCaseIds.push(c.id); }
      else cases.push(generateCase(rng));
    }
  }
  G.deck.push(cases);
  G.sections.push({
    title: "Schicht " + s + " – HYDRA beschleunigt",
    intro: s === 1
      ? "Der Endlos-Einsatz beginnt. Jede Schicht wird härter: weniger Zeit, weniger Energie, subtilere Fälle – und ab Schicht 3 generiert HYDRA laufend neue. Eine fehlerfreie Schicht gibt +4 Demokratie-Index zurück."
      : s === 3
        ? "Ab jetzt mischt HYDRA automatisch generierte, nie gesehene Fälle in den Feed. Bleib bei deiner Methode: Indizien kombinieren!"
        : "HYDRA skaliert die Angriffe hoch. Timer und Energie schrumpfen – Präzision ist jetzt alles.",
    energy: E.energyForShift(s), timer: E.timerForShift(s),
    kicker: "ENDLOS-EINSATZ · SCHICHT " + s,
  });
}

/* =========================================================================
   START & MENÜ
   ========================================================================= */
/* Der Name geht in Ranglisten, Profile, Duell und Klassenraum - also durch
   den Speicherdienst, der sich an "+" und "%" verschluckt (siehe js/tdb.js).
   Bereinigt wird deshalb schon hier und sichtbar im Feld: Was dort steht,
   steht spaeter genauso in der Rangliste. Wuerde erst beim Senden gefiltert,
   saehe man den eigenen Namen nachher anders als eingetippt. */
function getPlayerName() {
  const el = $("player-name");
  // Der Rueckfall greift nur, wenn jemand eine alte index.html im Cache hat
  // und js/tdb.js deshalb fehlt - dann soll der Start trotzdem klappen.
  const name = (typeof TDB !== "undefined" ? TDB.sauber(el.value) : el.value).trim();
  if (name !== el.value.trim()) el.value = name;
  if (!name) {
    el.style.borderColor = "var(--red)";
    el.placeholder = "Bitte zuerst Namen eingeben!";
    showScreen("screen-start");
    el.focus();
    return null;
  }
  el.style.borderColor = "";
  myName = name;
  localStorage.setItem("ww_name", name);
  return name;
}

/* =========================================================================
   EINWEISUNG: Wer noch nie gespielt hat, wird vor dem ersten Spiel eingewiesen.

   Erkennung in drei Stufen (jede allein genügt als „hat schon gespielt“):
     1. Einweisung wurde auf diesem Gerät schon abgeschlossen/übersprungen
     2. es liegen lokale Ergebnisse vor (ww_board_v1)
     3. zum eingegebenen Namen existiert ein globales Profil mit >= 1 Runde
        (deckt Wiederkehrende auf einem fremden/neuen Gerät ab)
   ========================================================================= */
let profileKnown = false;
let profileCheckedFor = "";

function tutorialDone() {
  try { const t = JSON.parse(localStorage.getItem("ww_tut_v1")); return !!(t && t.done); }
  catch (e) { return false; }
}
function hasLocalHistory() {
  try { return loadLocalBoard().length > 0; } catch (e) { return false; }
}
function tutorialShouldRun() {
  return !tutorialDone() && !hasLocalHistory() && !profileKnown;
}
function refreshFirstTimeCard() {
  const card = $("firsttime-card");
  if (card) card.classList.toggle("hidden", !tutorialShouldRun());
}

/* Läuft im Hintergrund – blockiert nie den Spielstart. */
async function checkProfileKnown(name) {
  if (!name || name === profileCheckedFor) return;
  profileCheckedFor = name;
  try {
    const data = await tdbRead(PROFILE_KEY);
    const p = ((data && data.profiles) || []).find(x => x.n === name);
    if (p && (p.g || 0) > 0) profileKnown = true;
  } catch (e) { /* offline -> es entscheidet der lokale Stand */ }
  refreshFirstTimeCard();
}

/* Einstieg in einen Spielmodus – ggf. mit vorgeschalteter Einweisung. */
function beginMode(action) {
  const name = getPlayerName();
  if (!name) return;
  checkProfileKnown(name);
  if (tutorialShouldRun()) return Tutorial.open(action);
  action();
}

function startSolo(variant) {
  const name = getPlayerName();
  if (!name) return;
  const seed = randomSeed();
  G = freshState("solo", name, seed);
  G.variant = variant;
  if (variant === "klassisch") {
    const { deck, sections } = buildSoloDeck(seed);
    G.deck = deck; G.sections = sections;
  } else {
    G.shift = 1;
    buildShift(1);
  }
  showSectionIntro();
}

/* =========================================================================
   TAGES-CHALLENGE

   Der Fallsatz muss zwei Dinge zugleich erfüllen: für alle Spieler:innen
   eines Tages **identisch** sein und sich trotzdem **jeden Tag wirklich
   erneuern**. Deshalb:

   · Der Seed hängt nur am deutschen Datum -> alle bekommen dasselbe.
   · 6 handgeschriebene Fälle laufen in einer festen Rotation durch den
     ganzen Bestand: Innerhalb eines Zyklus kommt kein Fall zweimal, und
     jeder Zyklus mischt die Reihenfolge neu. (Vorher wurde jeden Tag frei
     aus allen 47 gezogen – dabei tauchte derselbe Fall im Schnitt alle
     fünf Tage wieder auf, teils schon am Folgetag.)
   · 4 Fälle kommen aus demselben Generator wie im Endlosmodus. Die sind
     jeden Tag neu – dadurch ist keine Challenge je eine Wiederholung.
   ========================================================================= */
const DAILY_CASES = 10;
const DAILY_HANDWRITTEN = 6;    // Rest kommt aus dem Generator
const DAILY_TIMER = 38;

function dailySeed(dateStr) {
  const str = "wahlwaechter-" + (dateStr || todayStr());
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(h, 31) + str.charCodeAt(i)) >>> 0;
  return h;
}

function buildDailyDeck(seed, dayNr) {
  const rng = mulberry32(seed);
  const pool = DATA.cases;
  const perCycle = Math.max(1, Math.floor(pool.length / DAILY_HANDWRITTEN));
  const cycle = Math.floor(dayNr / perCycle);
  const slot = dayNr % perCycle;

  // Reihenfolge des Zyklus – pro Zyklus neu gemischt, aber für alle gleich
  const order = seededShuffle(pool, mulberry32((cycle * 2654435761) >>> 0));
  const hand = order.slice(slot * DAILY_HANDWRITTEN, slot * DAILY_HANDWRITTEN + DAILY_HANDWRITTEN);

  const fresh = [];
  for (let i = 0; i < DAILY_CASES - hand.length; i++) fresh.push(generateCase(rng));

  const all = seededShuffle(hand.concat(fresh), rng);
  const per = Math.ceil(all.length / 2);
  const energy = Math.max(4, Math.round(per * 1.8));
  return {
    deck: [all.slice(0, per), all.slice(per)],
    sections: [
      { title: "Welle 1 – Gleiche Fälle für alle", intro: "Heute prüft die ganze Welt denselben Satz. Genauigkeit schlägt Hektik – aber die Uhr tickt.", energy, timer: DAILY_TIMER, kicker: "TAGES-CHALLENGE · WELLE 1/2" },
      { title: "Welle 2 – HYDRA legt nach", intro: "Die zweite Welle ist subtiler. Ein Teil der Fälle wurde heute frisch generiert – die hat noch nie jemand gesehen.", energy, timer: DAILY_TIMER, kicker: "TAGES-CHALLENGE · WELLE 2/2" },
    ],
  };
}

function startDaily() {
  const name = getPlayerName();
  if (!name) return;
  const heute = todayStr();
  if (localStorage.getItem("ww_daily_" + heute)) {
    netBanner("Du hast die heutige Challenge schon gespielt – morgen gibt's neue Fälle!", "info");
    boardFilter = "tages";
    syncBoardChips();
    renderBoard();
    return;
  }
  localStorage.setItem("ww_daily_" + heute, "1");
  const seed = dailySeed(heute);
  G = freshState("solo", name, seed);
  G.variant = "tages";
  const { deck, sections } = buildDailyDeck(seed, dayNumber(heute));
  G.deck = deck; G.sections = sections;
  showSectionIntro();
}

/* =========================================================================
   ABSCHNITTS-INTRO
   ========================================================================= */
function showSectionIntro() {
  const sec = G.sections[G.secIdx];
  G.energy = Math.max(0, sec.energy + G.effects.energyPerWeek);
  G.shiftErrors = 0;
  $("week-kicker").textContent = sec.kicker;
  $("week-title").textContent = sec.title;
  $("week-intro").textContent = sec.intro;
  const timer = sec.timer + G.effects.timerPlus;
  let stats = `
    <div class="week-stat"><b>${G.deck[G.secIdx].length}</b>Fälle</div>
    <div class="week-stat"><b>⚡ ${G.energy}</b>Prüf-Energie</div>
    <div class="week-stat"><b>⏱️ ${timer}s</b>pro Fall</div>`;
  if (G.lastEnergyBonus > 0) {
    stats += `<div class="week-stat"><b>+${G.lastEnergyBonus}</b>Restenergie-Bonus</div>`;
    G.lastEnergyBonus = 0;
  }
  if (G.lastPerfectBonus > 0) {
    stats += `<div class="week-stat"><b>🏛️ +${G.lastPerfectBonus}</b>Fehlerfreie Schicht!</div>`;
    G.lastPerfectBonus = 0;
  }
  $("week-stats").innerHTML = stats;
  Anim.stagger($("week-stats"), ".week-stat", 70);
  showScreen("screen-week");
}

/* =========================================================================
   FALL-ANSICHT
   ========================================================================= */
let timerInt = null, timeLeft = 0, timerTotal = 1;

function startTimer(seconds, textEl, fillEl, onEnd) {
  stopTimer();
  timeLeft = seconds; timerTotal = seconds;
  const tick = () => {
    timeLeft = Math.max(0, timeLeft - 0.1);
    const pct = (timeLeft / timerTotal) * 100;
    fillEl.style.width = pct + "%";
    fillEl.classList.toggle("warn", pct <= 50 && pct > 22);
    fillEl.classList.toggle("crit", pct <= 22);
    textEl.textContent = Math.ceil(timeLeft);
    if (timeLeft <= 0) { stopTimer(); onEnd(); }
  };
  tick();
  timerInt = setInterval(tick, 100);
}
function stopTimer() { if (timerInt) { clearInterval(timerInt); timerInt = null; } }

function currentCase() { return G.deck[G.secIdx][G.caseIdx]; }

function showCase() {
  const c = currentCase();
  G.usedEnergy = 0; G.freeProbeUsed = false; G.resolved = false;
  G.caseNo++;

  $("hud-week").textContent =
    G.mode === "duel" ? "WELLE " + (G.secIdx + 1)
    : G.variant === "endlos" ? "SCHICHT " + (G.secIdx + 1)
    : G.variant === "tages" ? "TAGES-CH."
    : G.variant === "klasse" ? "KLASSE"
    : "WOCHE " + (G.secIdx + 1);
  $("hud-case").textContent = "Fall " + (G.caseIdx + 1) + "/" + G.deck[G.secIdx].length;
  updateHud();

  $("dossier-medium").textContent = MEDIUM_LABEL[c.medium] || c.medium;
  $("dossier-source").textContent = c.source;
  $("dossier-avatar").textContent = (c.author || "?").charAt(0).toUpperCase();
  $("dossier-author").textContent = c.author;
  $("dossier-handle").textContent = c.handle || "";
  $("dossier-reach").textContent = c.reach;
  $("dossier-title").textContent = c.title;
  $("dossier-text").textContent = c.text;

  renderTools(c);
  $("evidence-log").innerHTML = "";
  $("btn-approve").disabled = false;
  $("btn-flag").disabled = false;

  showScreen("screen-case");
  // Ein neuer Fall soll sich vom Screen-Wechsel unterscheiden: er kommt von
  // rechts herein wie die nächste Seite einer Akte.
  Anim.next(document.querySelector(".case-layout"), ":scope > *");
  Anim.pulse($("hud-case"), "flat");
  const sec = G.sections[G.secIdx];
  startTimer(sec.timer + G.effects.timerPlus, $("timer-text"), $("timerbar-fill"), () => judge(null));
}

/* Geänderte HUD-Werte melden sich selbst: Punkte pulsen grün, Index-Schaden
   zittert rot, verbrauchte Energie blitzt amber. So sieht man die Folge einer
   Entscheidung, ohne die Zahlen zu vergleichen. */
let hudLast = {};
function resetHud() { hudLast = { score: null, energy: null, index: null, oppScore: null }; }
function hudSet(id, value, key, kindDown) {
  const el = $(id);
  const before = hudLast[key];
  el.textContent = value;
  if (before !== null && before !== undefined && before !== value) {
    Anim.pulse(el, value < before ? (kindDown || "down") : "up");
  }
  hudLast[key] = value;
}

function updateHud() {
  hudSet("hud-score", G.score, "score");
  hudSet("hud-energy", G.energy, "energy", "flat");
  hudSet("hud-index", G.index, "index");
  const opp = $("hud-opponent");
  if (G.mode === "duel" && G.duel) {
    opp.classList.remove("hidden");
    $("opp-name").textContent = G.duel.oppName || "Gegner";
    hudSet("opp-score", G.duel.oppScore, "oppScore", "flat");
  } else if (G.mode === "solo" && G.variant === "klasse") {
    const lead = ClassNet.leader();
    opp.classList.remove("hidden");
    $("opp-name").textContent = lead ? "👑 " + lead.n : "👑 Führung";
    $("opp-score").textContent = lead ? (lead.s || 0) : 0;
  } else {
    opp.classList.add("hidden");
  }
}

function probeCost() {
  return (G.effects.freeProbe && !G.freeProbeUsed) ? 0 : 1;
}

function renderTools(c) {
  const wrap = $("tool-buttons");
  wrap.innerHTML = "";
  DATA.tools.forEach(t => {
    const btn = document.createElement("button");
    btn.className = "tool-btn";
    btn.dataset.tool = t.id;
    const applicable = c.evidence[t.id] !== null && c.evidence[t.id] !== undefined;
    const cost = probeCost();
    btn.innerHTML = `<span>${t.icon}</span>
      <span><span class="tool-name">${t.name}</span><span class="tool-desc">${t.desc}</span></span>
      <span class="tool-cost">${applicable ? (cost === 0 ? "gratis" : "1 ⚡") : "n. a."}</span>`;
    if (!applicable) {
      btn.disabled = true;
      btn.querySelector(".tool-desc").textContent = "Bei diesem Beitrag nicht anwendbar (kein Material).";
    }
    btn.addEventListener("click", () => useTool(t, btn));
    wrap.appendChild(btn);
  });
  Anim.stagger(wrap, ".tool-btn", 45);
  refreshToolCosts();
}

function refreshToolCosts() {
  const cost = probeCost();
  document.querySelectorAll("#tool-buttons .tool-btn").forEach(btn => {
    if (btn.disabled || btn.classList.contains("used")) return;
    const el = btn.querySelector(".tool-cost");
    el.textContent = cost === 0 ? "gratis" : "1 ⚡";
    btn.classList.toggle("free", cost === 0);
    if (cost > 0 && G.energy < 1) btn.disabled = true;
  });
}

function useTool(tool, btn) {
  if (G.resolved) return;
  const c = currentCase();
  const cost = probeCost();
  if (cost > 0 && G.energy < cost) return;
  if (cost === 0) G.freeProbeUsed = true;
  G.energy -= cost;
  G.usedEnergy += 1;
  btn.classList.add("used");
  btn.disabled = true;
  const item = document.createElement("div");
  item.className = "evidence-item";
  item.innerHTML = `<b>${tool.icon} ${tool.name.toUpperCase()}</b>${esc(c.evidence[tool.id])}`;
  $("evidence-log").appendChild(item);
  item.scrollIntoView({ block: "nearest", behavior: "smooth" });
  updateHud();
  refreshToolCosts();
}

/* ---------- Urteil & Auflösung ---------- */
function applyIndexDamage(dmg) {
  const shielded = Math.max(1, dmg - G.effects.damageShield);
  G.index = Math.max(0, G.index - shielded);
  return shielded;
}

function setRealRef(text) {
  const el = $("reveal-realref");
  if (text) {
    el.innerHTML = `<b>📚 Reales Vorbild (Spielinhalt fiktiv):</b> ${esc(text)}`;
    el.classList.remove("hidden");
  } else {
    el.classList.add("hidden");
  }
}

function judge(verdict) {   // "approve" | "flag" | null (Timeout)
  if (G.resolved) return;
  G.resolved = true;
  stopTimer();
  $("btn-approve").disabled = true;
  $("btn-flag").disabled = true;
  ["btn-approve", "btn-flag"].forEach(id => $(id).classList.remove("chosen"));
  if (verdict) $(verdict === "flag" ? "btn-flag" : "btn-approve").classList.add("chosen");

  const c = currentCase();
  G.total++;
  const correct = verdict !== null && ((verdict === "flag") === c.isFake);
  let lines = [];
  let gained = 0;

  if (correct) {
    G.correct++;
    G.streak++;
    G.maxStreak = Math.max(G.maxStreak, G.streak);
    const timeB = Math.round(timeLeft) * S.timeBonusPerSec;
    const sleuth = G.usedEnergy <= S.sleuthMaxEnergy ? S.sleuthBonus : 0;
    const streakB = Math.min(G.streak, S.streakCap) * S.streakBonus;
    gained = S.base + timeB + sleuth + streakB;
    lines.push(`Basis: +${S.base}`);
    lines.push(`Zeitbonus (${Math.round(timeLeft)}s übrig): +${timeB}`);
    if (sleuth) lines.push(`🕵️ Spürnasen-Bonus (max. 1 ⚡ genutzt): +${sleuth}`);
    lines.push(`Serie ×${Math.min(G.streak, S.streakCap)}: +${streakB}`);
    G.score += gained;
  } else {
    G.streak = 0;
    G.shiftErrors++;
    let dmg;
    if (verdict === null) {
      dmg = applyIndexDamage(S.dmgTimeout);
      lines.push(`⏱️ Zeit abgelaufen – keine Entscheidung ist auch eine Entscheidung.`);
    } else if (c.isFake) {
      dmg = applyIndexDamage(S.dmgFakeApproved);
      lines.push(`Ein KI-Fake ging ungebremst viral.`);
    } else {
      dmg = applyIndexDamage(S.dmgRealFlagged + G.effects.flagPenaltyPlus);
      lines.push(`Ein legitimer Beitrag wurde zensiert – Vertrauensverlust.`);
    }
    lines.push(`🏛️ Demokratie-Index: −${dmg}`);
  }

  // Fall-Auswertung protokollieren
  G.history.push({ c, verdict, correct, gained });

  const lastOfSection = G.caseIdx === G.deck[G.secIdx].length - 1;
  if (lastOfSection && G.energy > 0) {
    const eb = G.energy * S.energyLeftBonus;
    G.score += eb;
    G.lastEnergyBonus = eb;
    lines.push(`⚡ Restenergie (${G.energy}): +${eb}`);
  }

  updateHud();
  if (G.mode === "duel") Net.send("progress", { score: G.score, caseNo: G.caseNo, index: G.index });
  if (G.mode === "solo" && G.variant === "klasse") ClassNet.reportSelf({ s: G.score, x: G.index, c: G.total });

  const v = $("reveal-verdict");
  if (verdict === null) { v.textContent = "ZEIT ABGELAUFEN"; v.className = "reveal-verdict bad"; }
  else if (correct) { v.textContent = "RICHTIG ✓" + (gained ? "  +" + gained : ""); v.className = "reveal-verdict good"; }
  else { v.textContent = "FALSCH ✗"; v.className = "reveal-verdict bad"; }
  $("reveal-truth").textContent = "Der Beitrag war: " + (c.isFake ? "🚫 KI-DESINFORMATION" : "✅ ECHT / LEGITIM") + " · Kategorie: " + c.category;
  $("reveal-points").textContent = lines.join("\n");
  $("reveal-text").textContent = c.resolution;
  setRealRef(DATA.realRefs[c.id] || null);
  showOverlay("overlay-reveal", true);
  Anim.stamp(v);                                        // das Urteil wird gestempelt
  Anim.flash($("reveal-card"), correct ? "good" : "bad");
}

function nextCase() {
  showOverlay("overlay-reveal", false);

  if (G.index <= 0 && G.mode === "solo") { G.crisis = true; return finishSoloRun(); }
  if (G.mode === "duel" && G.index <= 0) G.index = 5;

  G.caseIdx++;
  if (G.caseIdx < G.deck[G.secIdx].length) return showCase();

  G.caseIdx = 0;
  G.secIdx++;
  if (G.mode === "duel") {
    if (G.secIdx < G.deck.length) return showSectionIntro();
    return (G.duel.cfg && !G.duel.cfg.showdown) ? finishDuel() : startBuildPhase();
  }
  if (G.variant === "endlos") {
    if (G.shiftErrors === 0) {
      const bonus = DATA.endless.perfectShiftIndexBonus;
      G.index = Math.min(100, G.index + bonus);
      G.lastPerfectBonus = bonus;
    }
    G.shift++;
    buildShift(G.shift);
    return showSectionIntro();
  }
  if (G.variant === "tages" || G.variant === "klasse") {
    if (G.secIdx < G.deck.length) return showSectionIntro();
    if (G.variant === "klasse" && G.class && G.class.cfg.showdown) return startBuildPhase();
    return finishSoloRun();
  }
  // Solo klassisch
  if (G.secIdx < G.deck.length) return showDilemma();
  return startBossHunt();
}

/* Solo-/Tages-/Klassen-Lauf beenden */
function finishSoloRun() {
  if (G.variant === "klasse") {
    classStopWaitTicker();
    classReportFinal();
    saveResult(null);            // Profil-Statistik, keine globale Rangliste
    return showClassResult();
  }
  showResult();
}

/* =========================================================================
   DILEMMA-UPGRADES (nur Solo klassisch)
   ========================================================================= */
function showDilemma() {
  const rng = mulberry32(G.seed + G.secIdx * 7919);
  const pool = DATA.dilemmas.filter(d => !d.isPass && !G.offeredDilemmas.includes(d.id));
  const offer = seededShuffle(pool, rng).slice(0, 3);
  offer.push(DATA.dilemmas.find(d => d.isPass));
  offer.forEach(d => G.offeredDilemmas.push(d.id));

  const grid = $("dilemma-grid");
  grid.innerHTML = "";
  offer.forEach(d => {
    const card = document.createElement("button");
    card.className = "dilemma-card" + (d.isPass ? " pass" : "");
    card.innerHTML = `<span class="d-icon">${d.icon}</span><h4>${esc(d.name)}</h4>
      <p>${esc(d.offer)}</p>
      <span class="d-effect">▲ ${esc(d.effectText)}</span>
      <span class="d-cost">▼ ${esc(d.costText)}</span>`;
    card.addEventListener("click", () => chooseDilemma(d));
    grid.appendChild(card);
  });
  Anim.stagger(grid, ".dilemma-card", 60);
  showScreen("screen-dilemma");
}

function chooseDilemma(d) {
  const e = d.effects || {};
  if (e.energyPerWeek) G.effects.energyPerWeek += e.energyPerWeek;
  if (e.timerPlus) G.effects.timerPlus += e.timerPlus;
  if (e.freeProbe) G.effects.freeProbe = true;
  if (e.damageShield) G.effects.damageShield += e.damageShield;
  if (e.flagPenaltyPlus) G.effects.flagPenaltyPlus += e.flagPenaltyPlus;
  if (e.indexNow) G.index = Math.max(0, Math.min(100, G.index + e.indexNow));

  $("dilemma-chosen-name").textContent = d.icon + " " + d.name;
  $("dilemma-effects").textContent = "▲ " + d.effectText + "\n▼ " + d.costText;
  $("dilemma-debrief").textContent = d.debrief;
  showOverlay("overlay-dilemma", true);
}

function afterDilemma() {
  showOverlay("overlay-dilemma", false);
  if (G.index <= 0) { G.crisis = true; return showResult(); }
  showSectionIntro();
}

/* =========================================================================
   SHOWDOWN-BAUKASTEN (Budget-System)
   ========================================================================= */
const build = { theme: null, format: null, cloaks: [] };

function cloakById(id) { return DATA.sabotage.cloaks.find(c => c.id === id); }
function buildCostSum() { return build.cloaks.reduce((s, id) => s + (cloakById(id).cost || 2), 0); }

function startBuildPhase() {
  build.theme = null; build.format = null; build.cloaks = [];
  lastBudget = null;
  const sab = DATA.sabotage;

  const klasse = G.variant === "klasse";
  const notice = $("build-notice");
  notice.classList.toggle("hidden", !(klasse && G.class && G.class.wasPulled));
  if (klasse && G.class && G.class.wasPulled) {
    notice.innerHTML = "<b>⏱️ Du warst zu langsam.</b> Der Großteil der Klasse ist schon im Showdown – " +
      "deine restlichen Fälle entfallen, damit niemand warten muss. Der Showdown zählt für dich ganz normal.";
  }
  if (klasse) {
    ClassNet.reportSelf({ sd: 1 });     // „ich bin im Showdown" – zählt für die Nachzügler-Frist
    updateClassLive();
  } else {
    $("build-live-item").classList.add("hidden");
  }

  const target = klasse
    ? "Er wird in den Feed einer <strong>anderen Person aus der Klasse</strong> geschleust – zugeteilt wird reihum, deinen eigenen Fake bekommst du nie."
    : "Er wird in den Feed deines Gegners geschleust.";
  $("build-intro").innerHTML = target + ` Wähle <strong>1 Thema, 1 Format und genau ${sab.maxCloaks} Tarnungen</strong>. ` +
    `Jede Tarnung löscht eine Beweisspur – aber sie kosten unterschiedlich viel Budget (💰 ${sab.budget}), ` +
    "und die zwei stärksten passen nicht zusammen. Welche Spuren verwischst du – und welche lässt du offen?";

  const mkCard = (obj, kind) => {
    const b = document.createElement("button");
    b.className = "build-card";
    b.dataset.kind = kind; b.dataset.id = obj.id;
    const cost = kind === "cloak" ? ` <span class="b-cost">💰 ${obj.cost}</span>` : "";
    b.innerHTML = `<span class="b-name">${obj.icon} ${esc(obj.name)}${cost}</span><span class="b-desc">${esc(obj.desc)}</span>`;
    b.addEventListener("click", () => pickBuild(kind, obj.id, b));
    return b;
  };
  const themes = $("build-themes"); themes.innerHTML = "";
  sab.themes.forEach(t => themes.appendChild(mkCard(t, "theme")));
  const formats = $("build-formats"); formats.innerHTML = "";
  sab.formats.forEach(f => formats.appendChild(mkCard(f, "format")));
  const cloaks = $("build-cloaks"); cloaks.innerHTML = "";
  sab.cloaks.forEach(c => cloaks.appendChild(mkCard(c, "cloak")));
  [themes, formats, cloaks].forEach(g => Anim.stagger(g, ".build-card", 45));
  refreshBuildUI();

  showScreen("screen-build");
  startTimer(sab.buildTime, $("build-timer"), document.createElement("div"), () => finishBuild(true));
}

let lastBudget = null;
function refreshBuildUI() {
  const sab = DATA.sabotage;
  const spent = buildCostSum();
  const rest = sab.budget - spent;
  $("build-budget").textContent = rest + "/" + sab.budget;
  if (lastBudget !== null && lastBudget !== rest) Anim.pulse($("build-budget"), rest < lastBudget ? "flat" : "up");
  lastBudget = rest;
  $("cloak-counter").textContent = `(${build.cloaks.length}/${sab.maxCloaks} gewählt · 💰 ${sab.budget - spent} übrig)`;
  document.querySelectorAll('.build-card[data-kind="cloak"]').forEach(btn => {
    const c = cloakById(btn.dataset.id);
    const selected = build.cloaks.includes(c.id);
    btn.classList.toggle("selected", selected);
    btn.disabled = !selected && (build.cloaks.length >= sab.maxCloaks || spent + (c.cost || 2) > sab.budget);
  });
  $("btn-build-done").disabled = !(build.theme && build.format && build.cloaks.length === sab.maxCloaks);
}

function pickBuild(kind, id, btn) {
  if (kind === "theme" || kind === "format") {
    document.querySelectorAll(`.build-card[data-kind="${kind}"]`).forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    build[kind] = id;
  } else {
    const i = build.cloaks.indexOf(id);
    if (i >= 0) build.cloaks.splice(i, 1);
    else build.cloaks.push(id);
  }
  refreshBuildUI();
}

function finishBuild(timeout) {
  stopTimer();
  const rng = mulberry32(randomSeed());
  const rnd = randomBuild(rng);
  const spec = {
    themeId: build.theme || rnd.themeId,
    formatId: build.format || rnd.formatId,
    cloakIds: build.cloaks.length === DATA.sabotage.maxCloaks ? build.cloaks.slice() : rnd.cloakIds,
  };
  if (G.variant === "klasse") return classSubmitBuild(spec);
  G.duel.myBuild = spec;
  Net.send("sabotage", { build: spec });
  if (G.duel.oppBuild) startShowdownHunt();
  else if (G.duel.dropped) { G.duel.oppBuild = randomBuild(mulberry32(randomSeed())); startShowdownHunt(); }
  else { $("wait-text").textContent = "Dein Fake ist unterwegs… Warte, bis der Gegner seinen fertig gebaut hat."; showOverlay("overlay-wait", true); }
}

/* =========================================================================
   JAGD: Boss-Feed (Solo) / Showdown (Duell)
   ========================================================================= */
function buildHuntFeed(fakeCard) {
  const rng = mulberry32(randomSeed());
  const reals = seededShuffle(DATA.feedReals, rng).slice(0, DATA.sabotage.feedSize - 1)
    .map(r => Object.assign({ isFake: false }, r));
  const feed = seededShuffle([...reals, fakeCard], rng);
  return { feed, fakeIdx: feed.indexOf(fakeCard) };
}

function startBossHunt() {
  const rng = mulberry32(G.seed ^ 0xBADC0DE);
  const spec = randomBuild(rng);
  startHunt(craftFake(spec), "FINALE · HYDRAS MEISTERSTÜCK",
    "HYDRA hat einen maßgeschneiderten Fake gebaut und in diesen Feed geschleust. Du hast <strong>eine einzige</strong> Markierung – und doppelte Punkte, wenn du triffst. Wähle weise.");
}

function startShowdownHunt() {
  showOverlay("overlay-wait", false);
  startHunt(craftFake(G.duel.oppBuild), "SHOWDOWN",
    `Das ist der Feed, in den <strong>${esc(G.duel.oppName || "dein Gegner")}</strong> einen selbstgebauten Fake geschleust hat. Eine Markierung, keine zweite Chance. Wer schneller trifft, gewinnt den Showdown.`);
}

function startHunt(fakeCard, kicker, introHtml) {
  const { feed, fakeIdx } = buildHuntFeed(fakeCard);
  G.boss = { feed, fakeIdx, energy: DATA.sabotage.huntEnergy, done: false };
  $("hunt-kicker").textContent = kicker;
  $("hunt-intro").innerHTML = introHtml;
  $("hunt-energy").textContent = G.boss.energy;
  $("hunt-score").textContent = G.score;

  const wrap = $("hunt-feed");
  wrap.innerHTML = "";
  feed.forEach((item, idx) => {
    const el = document.createElement("div");
    el.className = "hunt-item";
    el.dataset.idx = idx;
    const tools = DATA.tools.map(t => {
      const na = item.evidence[t.id] === null || item.evidence[t.id] === undefined;
      return `<button class="mini-tool" data-tool="${t.id}" data-idx="${idx}" ${na ? "disabled title='nicht anwendbar'" : ""}>${t.icon} ${t.name} · 1⚡</button>`;
    }).join("");
    el.innerHTML = `
      <div class="hunt-item-head"><span class="medium-badge">${MEDIUM_LABEL[item.medium] || item.medium}</span>
        <b>${esc(item.title)}</b><span class="muted">${esc(item.author)} · ${esc(item.reach)}</span></div>
      <p class="hunt-text">${esc(item.text)}</p>
      <div class="hunt-tools">${tools}<button class="mini-tool mini-flag" data-flag="${idx}">🚩 Das ist der Fake!</button></div>
      <div class="hunt-evidence"></div>`;
    wrap.appendChild(el);
  });

  Anim.stagger(wrap, ".hunt-item", 80);
  wrap.querySelectorAll(".mini-tool[data-tool]").forEach(btn => btn.addEventListener("click", () => huntProbe(btn)));
  wrap.querySelectorAll(".mini-flag").forEach(btn => btn.addEventListener("click", () => huntResolve(parseInt(btn.dataset.flag, 10))));

  showScreen("screen-hunt");
  startTimer(DATA.sabotage.huntTime, $("hunt-timer-text"), $("hunt-timerbar-fill"), () => huntResolve(null));
}

function huntProbe(btn) {
  if (G.boss.done || G.boss.energy < 1) return;
  const idx = parseInt(btn.dataset.idx, 10);
  const toolId = btn.dataset.tool;
  const tool = DATA.tools.find(t => t.id === toolId);
  const item = G.boss.feed[idx];
  G.boss.energy--;
  btn.disabled = true;
  $("hunt-energy").textContent = G.boss.energy;
  Anim.pulse($("hunt-energy"), "flat");
  const log = document.querySelectorAll(".hunt-item")[idx].querySelector(".hunt-evidence");
  const div = document.createElement("div");
  div.className = "evidence-item";
  div.innerHTML = `<b>${tool.icon} ${tool.name.toUpperCase()}</b>${esc(item.evidence[toolId])}`;
  log.appendChild(div);
  if (G.boss.energy < 1) {
    document.querySelectorAll(".mini-tool[data-tool]").forEach(b => b.disabled = true);
  }
}

function huntResolve(pickedIdx) {
  if (G.boss.done) return;
  G.boss.done = true;
  stopTimer();
  const found = pickedIdx === G.boss.fakeIdx;
  const items = document.querySelectorAll(".hunt-item");
  items[G.boss.fakeIdx].classList.add("flagged-right");
  if (pickedIdx !== null && !found) items[pickedIdx].classList.add("flagged-wrong");

  const fake = G.boss.feed[G.boss.fakeIdx];
  const sab = DATA.sabotage;
  const cloakNames = fake.build.cloakIds.map(id => (cloakById(id) || {}).name).join(" + ");
  let lines = [], gained = 0;

  G.total++;
  if (found) {
    G.correct++;
    const timeB = Math.round(timeLeft) * S.timeBonusPerSec;
    const energyB = G.boss.energy * S.energyLeftBonus;
    gained = 300 + timeB + energyB;
    lines.push("Volltreffer: +300");
    lines.push(`Zeitbonus (${Math.round(timeLeft)}s übrig): +${timeB}`);
    if (energyB) lines.push(`⚡ Restenergie (${G.boss.energy}): +${energyB}`);
    G.score += gained;
  } else {
    const dmg = applyIndexDamage(15);
    lines.push(pickedIdx === null ? "⏱️ Zeit abgelaufen – der Fake blieb unentdeckt." : "Daneben – der echte Beitrag wurde markiert, der Fake blieb online.");
    lines.push(`🏛️ Demokratie-Index: −${dmg}`);
  }

  const attacker = G.mode === "duel" ? (G.duel.oppName || "Dein Gegner")
    : (G.variant === "klasse" && G.class && G.class.donorName) ? G.class.donorName
    : "HYDRA";
  const resolutionText = attacker +
    " hat die Spuren mit „" + cloakNames + "“ verwischt – die übrigen Beweiskanäle hätten den Fake verraten. " +
    "Merke: Perfekte Tarnung ist unmöglich, irgendwo bleibt immer eine Spur.";
  G.history.push({ c: Object.assign({}, fake, { resolution: resolutionText }), verdict: found ? "flag" : (pickedIdx === null ? null : "approve"), correct: found, gained, isBoss: true });

  const v = $("reveal-verdict");
  v.textContent = found ? "GEFUNDEN ✓  +" + gained : "NICHT GEFUNDEN ✗";
  v.className = "reveal-verdict " + (found ? "good" : "bad");
  $("reveal-truth").textContent = "Der Fake war: " + fake.title + " (" + fake.category + ")";
  $("reveal-points").textContent = lines.join("\n");
  $("reveal-text").textContent = resolutionText;
  setRealRef(null);
  updateHud();
  $("hunt-score").textContent = G.score;

  if (G.mode === "duel") {
    G.duel.myHunt = { found, timeLeft: Math.round(timeLeft) };
    Net.send("huntResult", G.duel.myHunt);
  } else if (G.variant === "klasse") {
    ClassNet.reportSelf({ hr: found ? 1 : 0 });
  }
  showOverlay("overlay-reveal", true);
}

function afterHuntReveal() {
  showOverlay("overlay-reveal", false);
  if (G.mode === "solo") {
    if (G.index <= 0) G.crisis = true;
    return finishSoloRun();
  }
  if (G.duel.oppHunt || G.duel.dropped) finishDuel();
  else { $("wait-text").textContent = "Warte, ob dein Fake beim Gegner unentdeckt bleibt…"; showOverlay("overlay-wait", true); }
}

/* =========================================================================
   ERGEBNIS
   ========================================================================= */
function rankFor(score) { return DATA.ranks.find(r => score >= r.min) || DATA.ranks[DATA.ranks.length - 1]; }

function computeFinal() {
  if (G.variant === "endlos" && G.mode === "solo") {
    G.finalScore = G.score;
    return 1;
  }
  const mult = G.crisis ? 0.5 : S.finalMultiplier(G.index);
  G.finalScore = Math.round(G.score * mult);
  return mult;
}

function showResult() {
  stopTimer();
  const mult = computeFinal();
  const acc = G.total ? Math.round((G.correct / G.total) * 100) : 0;
  const rank = rankFor(G.finalScore);
  const endless = G.mode === "solo" && G.variant === "endlos";
  const daily = G.mode === "solo" && G.variant === "tages";

  const shifts = Math.max(1, G.secIdx + (G.caseIdx > 0 || G.crisis ? 1 : 0));
  if (endless) {
    $("result-kicker").textContent = "ENDLOS-PROTOKOLL";
    $("result-headline").textContent = "HYDRA hat dich überrannt";
    $("result-story").textContent = `Du hast ${shifts} Schicht${shifts === 1 ? "" : "en"} und ${G.total} Fälle durchgehalten, bevor das Vertrauen zusammenbrach. Jede Schicht war schneller und subtiler als die letzte – irgendwann erwischt HYDRA jeden. Wie weit kommst du beim nächsten Mal?`;
  } else if (daily) {
    $("result-kicker").textContent = "TAGES-CHALLENGE · " + todayStr();
    $("result-headline").textContent = G.crisis ? "Heute nicht dein Tag" : "Deine Tageswertung steht";
    $("result-story").textContent = "Alle spielen heute exakt dieselben Fälle – dein Ergebnis zählt für die Tages-Rangliste. Morgen gibt es einen neuen Fallsatz und eine neue Chance.";
  } else if (G.crisis) {
    $("result-kicker").textContent = "ABBRUCH · VERTRAUENSKRISE";
    $("result-headline").textContent = "Die Wahl wird angefochten";
    $("result-story").textContent = "Der Demokratie-Index ist auf null gefallen: zu viel Desinformation, zu viel Zensur – oder zu viele Grundrechte geopfert. Das Vertrauen in die Wahl ist zerstört. Deine Punkte werden halbiert. Beim nächsten Mal: genauer prüfen, klüger haushalten.";
  } else {
    $("result-kicker").textContent = "ABSCHLUSSBERICHT · WAHLSONNTAG";
    $("result-headline").textContent = G.index >= 75 ? "Die Wahl war sauber – dank dir" : G.index >= 40 ? "Die Wahl fand statt – mit Schrammen" : "Die Wahl war knapp am Abgrund";
    $("result-story").textContent = G.index >= 75
      ? "HYDRA hat alles versucht – und ist an deiner Prüfstelle gescheitert. Die Wahlbeteiligung erreicht ein Rekordhoch, das Vertrauen hält."
      : G.index >= 40
        ? "Einige Fälschungen kamen durch, einige echte Stimmen wurden gebremst. Die Wahl gilt – aber die Zweifel bleiben im Netz kleben."
        : "Anfechtungsklagen, Demos, Misstrauen: Die Demokratie hat überlebt, aber sie blutet. Beim nächsten Mal zählt jede Entscheidung.";
  }

  // Signature-Moment: die Endpunktzahl zählt hoch, der Rang kommt danach
  Anim.countUp($("result-final"), G.finalScore);
  $("result-rank").textContent = rank.icon + " " + rank.name;
  $("result-rank").classList.add("anim-in");
  $("result-rank").style.setProperty("--i", 22);
  let breakdown = `
    <div><span>Rohpunkte</span><span>${G.score}</span></div>
    <div><span>Richtige Urteile</span><span>${G.correct}/${G.total} (${acc} %)</span></div>
    <div><span>Demokratie-Index</span><span>${G.index}/100</span></div>`;
  if (endless) {
    breakdown += `<div><span>Erreichte Schicht</span><span>${shifts}</span></div>`;
  } else {
    breakdown += `<div><span>Multiplikator</span><span>× ${mult.toFixed(2)}</span></div>`;
  }
  breakdown += `<div class="total"><span>Endpunktzahl</span><span>${G.finalScore}</span></div>`;
  $("result-breakdown").innerHTML = breakdown;
  Anim.stagger($("result-breakdown"), "div");
  reviewReturn = "screen-result";
  saveResult("result-sync");
  showScreen("screen-result");
}

/* =========================================================================
   FALL-AUSWERTUNG (Review)
   ========================================================================= */
function showReview(returnScreen) {
  reviewReturn = returnScreen || reviewReturn;
  const acc = G.total ? Math.round((G.correct / G.total) * 100) : 0;
  $("review-summary").innerHTML = `
    <div class="week-stat"><b>${G.correct}/${G.total}</b>richtig (${acc} %)</div>
    <div class="week-stat"><b>🔥 ${G.maxStreak}</b>beste Serie</div>
    <div class="week-stat"><b>${G.finalScore || G.score}</b>Punkte</div>
    <div class="week-stat"><b>🏛️ ${G.index}</b>Index</div>`;

  const list = $("review-list");
  list.innerHTML = "";
  G.history.forEach((h, i) => {
    const row = document.createElement("button");
    row.className = "review-row " + (h.correct ? "ok" : "bad");
    const yourCall = h.verdict === null ? "⏱️ Zeit abgelaufen" : h.verdict === "flag" ? "🚫 Gekennzeichnet" : "✅ Freigegeben";
    const truth = h.c.isFake ? "🚫 Fake" : "✅ Echt";
    row.innerHTML = `
      <span class="review-mark">${h.correct ? "✓" : "✗"}</span>
      <span class="review-main"><b>${esc(h.c.title)}</b>
        <span class="bmeta">${h.isBoss ? "🎯 Finale · " : ""}${esc(h.c.category)} · Du: ${yourCall} · War: ${truth}</span></span>
      <span class="review-pts">${h.gained ? "+" + h.gained : "±0"}</span>`;
    row.addEventListener("click", () => showReviewDetail(h, i));
    list.appendChild(row);
  });
  Anim.stagger(list, ".review-row");
  showScreen("screen-review");
}

function showReviewDetail(h, i) {
  const c = h.c;
  const yourCall = h.verdict === null ? "⏱️ Zeit abgelaufen" : h.verdict === "flag" ? "🚫 Gekennzeichnet" : "✅ Freigegeben";
  const ref = DATA.realRefs[c.id];
  $("review-detail").innerHTML = `
    <div class="reveal-verdict ${h.correct ? "good" : "bad"}">${h.correct ? "RICHTIG ✓" : "FALSCH ✗"} <span class="muted" style="font-size:.9rem">· Fall ${i + 1}</span></div>
    <div class="reveal-truth">${esc(c.category)} · ${MEDIUM_LABEL[c.medium] || esc(c.medium)} · ${esc(c.author || "")}</div>
    <div class="review-case-text"><b>${esc(c.title)}</b><br>${esc(c.text)}</div>
    <div class="reveal-points">Deine Antwort: ${yourCall}\nWahrheit: ${c.isFake ? "🚫 KI-DESINFORMATION" : "✅ ECHT / LEGITIM"}${h.gained ? "\nPunkte: +" + h.gained : ""}</div>
    <p class="reveal-text">${esc(c.resolution)}</p>
    ${ref ? `<div class="real-ref"><b>📚 Reales Vorbild (Spielinhalt fiktiv):</b> ${esc(ref)}</div>` : ""}
    <button class="btn btn-primary" id="btn-review-close">Schließen</button>`;
  $("btn-review-close").addEventListener("click", () => showOverlay("overlay-review", false));
  showOverlay("overlay-review", true);
}

/* =========================================================================
   RANGLISTE – lokal + global
   ========================================================================= */
const BOARD_BASE = "https://textdb.online/";
const BOARD_KEYS = {
  klassisch: "wahlwaechter_kl_x7k2m9",
  endlos:    "wahlwaechter_el_x7k2m9",
  duell:     "wahlwaechter_du_x7k2m9",
  tages:     "wahlwaechter_tc_x7k2m9",
  klasse:    "wahlwaechter_kr_x7k2m9",
};
const MODE_ICON  = { klassisch: "🛡️", endlos: "♾️", duell: "⚔️", tages: "📅", klasse: "🏟️" };
const MODE_LABEL = { klassisch: "Klassisch", endlos: "Endlos", duell: "Duell", tages: "Tages-Challenge", klasse: "Klassenraum" };
const PROFILE_KEY = "wahlwaechter_pr_x7k2m9";
const BOARD_MAX = 30;
let boardFilter = "klassisch";   // „Alle" gibt es nicht mehr: Die Modi sind nicht vergleichbar

function normMode(m) { return m === "solo" ? "klassisch" : m === "duel" ? "duell" : m; }
function packEntry(e) { return { i: e.id, n: e.name, s: e.score, a: e.acc, x: e.index, m: e.mode, e: e.extra || "", d: e.date }; }
function unpackEntry(p) { return { id: p.i, name: p.n, score: p.s, acc: p.a, index: p.x, mode: p.m, extra: p.e || "", date: p.d }; }

function loadLocalBoard() {
  try { return (JSON.parse(localStorage.getItem("ww_board_v1")) || []).map(e => Object.assign({}, e, { mode: normMode(e.mode) })); }
  catch (e) { return []; }
}
function saveLocalBoard(list) { localStorage.setItem("ww_board_v1", JSON.stringify(list.slice(0, 50))); }

/* Lesen und Schreiben liegen in js/tdb.js - gemeinsam mit Duell und
   Klassenraum. Wichtig: tdbRead gibt null nur zurueck, wenn der Schluessel
   leer ist. Unlesbares wirft, damit niemand eine kaputte Liste als leere
   Liste missversteht und sie beim Zurueckschreiben ueberschreibt. */
function tdbRead(key)       { return TDB.lies(key); }
function tdbWrite(key, obj) { return TDB.schreib(key, obj); }

/* Wirft weiter, wenn die Liste nicht lesbar ist - pushGlobalScore darf
   daraus keine leere Liste machen und zurueckschreiben. */
async function fetchModeBoard(mode) {
  const data = await tdbRead(BOARD_KEYS[mode]);
  return data && Array.isArray(data.scores) ? data.scores.map(unpackEntry) : [];
}

async function fetchGlobalBoard(mode) {
  if (mode && mode !== "alle") return fetchModeBoard(mode);
  const lists = await Promise.all(Object.keys(BOARD_KEYS).map(m => fetchModeBoard(m).catch(() => null)));
  if (lists.every(l => l === null)) throw new Error("offline");
  return lists.flatMap(l => l || []);
}

/* Trägt das Ergebnis ein – oder aktualisiert es, falls es schon dort steht.
   Der Klassenraum nutzt das: dort kann der Bonus für unentdeckte Fakes erst
   eintreffen, wenn das Ergebnis längst gespeichert ist. */
async function pushGlobalScore(entry) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const scores = await fetchModeBoard(entry.mode);
      const idx = scores.findIndex(e => e.id === entry.id);
      if (idx < 0 || scores[idx].score !== entry.score) {
        if (idx >= 0) scores[idx] = entry; else scores.push(entry);
        scores.sort((a, b) => b.score - a.score);
        if (!scores.slice(0, BOARD_MAX).some(e => e.id === entry.id)) return true;  // zu schwach für die Liste
        await tdbWrite(BOARD_KEYS[entry.mode], { scores: scores.slice(0, BOARD_MAX).map(packEntry) });
      }
      const mine = (await fetchModeBoard(entry.mode)).find(e => e.id === entry.id);
      if (mine && mine.score === entry.score) return true;
    } catch (e) { /* nächster Versuch */ }
    await new Promise(r => setTimeout(r, 400 + Math.random() * 1600));
  }
  return false;
}

function makeBoardEntry() {
  const acc = G.total ? Math.round((G.correct / G.total) * 100) : 0;
  const mode = G.mode === "duel" ? "duell"
    : G.variant === "endlos" ? "endlos"
    : G.variant === "tages" ? "tages"
    : G.variant === "klasse" ? "klasse"
    : "klassisch";
  // Die ID bleibt pro Lauf stabil, damit ein nachgereichter Bonus den
  // vorhandenen Eintrag aktualisiert statt einen zweiten anzulegen.
  if (!G.entryId) G.entryId = Math.random().toString(36).slice(2) + Date.now().toString(36);
  return {
    id: G.entryId,
    name: G.name, score: G.finalScore, acc, index: G.index, mode,
    extra: mode === "endlos" ? "Schicht " + Math.max(1, G.secIdx + (G.caseIdx > 0 || G.crisis ? 1 : 0))
      : mode === "klasse" && G.class && G.class.roomCode ? "Raum " + G.class.roomCode : "",
    date: todayStr(),
  };
}

/* ---------- Profil-Statistik (global) ---------- */
async function updateProfile(mutate) {
  const name = myName || "Anonym";
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const data = (await tdbRead(PROFILE_KEY)) || { profiles: [] };
      const list = Array.isArray(data.profiles) ? data.profiles : [];
      let p = list.find(x => x.n === name);
      if (!p) { p = { n: name, g: 0, w: 0, l: 0, d: 0, bs: 0, c: 0, t: 0 }; list.push(p); }
      mutate(p);
      p.u = todayStr();
      await tdbWrite(PROFILE_KEY, { profiles: list.slice(0, 120) });
      const check = (await tdbRead(PROFILE_KEY)) || {};
      const mine = (check.profiles || []).find(x => x.n === name);
      if (mine && mine.u === todayStr()) return true;
    } catch (e) { /* retry */ }
    await new Promise(r => setTimeout(r, 400 + Math.random() * 1600));
  }
  return false;
}

function saveResult(syncElId) {
  if (G.resultSaved) return;
  G.resultSaved = true;
  const entry = makeBoardEntry();

  // Profil-Statistik immer aktualisieren
  const acc = { correct: G.correct, total: G.total, best: G.finalScore };
  updateProfile(p => {
    p.g += 1; p.c += acc.correct; p.t += acc.total;
    p.bs = Math.max(p.bs || 0, acc.best);
  });

  storeEntry(syncElId);
}

/* Ergebnis in lokale + globale Rangliste schreiben. Wird im Klassenraum ein
   zweites Mal aufgerufen, sobald der Bonus für unentdeckte Fakes feststeht –
   der Eintrag wird dann aktualisiert (stabile ID, siehe makeBoardEntry). */
function storeEntry(syncElId) {
  const entry = makeBoardEntry();

  const local = loadLocalBoard().filter(e => e.id !== entry.id);
  local.push(entry);
  local.sort((a, b) => b.score - a.score);
  saveLocalBoard(local);

  if (!syncElId) { pushGlobalScore(entry); return; }
  const el = $(syncElId);
  el.textContent = "Speichere in globaler Rangliste…";
  pushGlobalScore(entry).then(ok => {
    el.textContent = ok ? "✓ In der globalen Rangliste gespeichert" : "Keine Verbindung – Ergebnis nur auf diesem Gerät gespeichert";
    el.classList.toggle("sync-ok", ok);
    el.classList.toggle("sync-fail", !ok);
  });
}

function syncBoardChips() {
  document.querySelectorAll("#board-filters .chip").forEach(c =>
    c.classList.toggle("active", c.dataset.filter === boardFilter));
}

async function renderBoard() {
  showScreen("screen-board");
  const sync = $("board-sync");
  const list = $("board-list");
  sync.className = "board-sync";
  sync.textContent = "Lade globale Rangliste…";
  list.innerHTML = "";

  let entries = [];
  let global = true;
  try { entries = await fetchGlobalBoard(boardFilter); }
  catch (e) { global = false; }
  const local = loadLocalBoard();
  local.forEach(le => { if (!entries.some(e => e.id === le.id)) entries.push(le); });
  entries = entries.map(e => Object.assign({}, e, { mode: normMode(e.mode) }));

  sync.textContent = global
    ? `Globale Rangliste · Stand ${new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}`
    : "Offline – zeige nur Einträge dieses Geräts";
  sync.classList.toggle("sync-fail", !global);

  const filtered = entries
    .filter(e => e.mode === boardFilter)
    .filter(e => boardFilter !== "tages" || e.date === todayStr())
    .sort((a, b) => b.score - a.score)
    .slice(0, 25);

  // Im Duell zählt nicht nur die Punktzahl, sondern auch die Bilanz.
  const bilanz = boardFilter === "duell" ? await fetchDuelRecords() : null;

  if (!filtered.length) {
    list.innerHTML = `<div class="board-empty">Noch keine Einträge in dieser Kategorie. Spiel eine Runde – dann steht dein Name hier.</div>`;
  } else {
    list.innerHTML = filtered.map((e, i) => {
      const meta = boardFilter === "duell"
        ? duelMeta(bilanz && bilanz[e.name], e)
        : `${MODE_ICON[e.mode] || ""} ${esc(MODE_LABEL[e.mode] || e.mode || "")}${e.extra ? " · " + esc(e.extra) : ""} · ${e.acc} % · Index ${e.index} · ${esc(e.date || "")}`;
      return `
      <div class="board-row${e.name === myName ? " me" : ""}">
        <span class="pos">${i + 1}.</span>
        <span class="bname">${esc(e.name)} <span class="bmeta">${meta}</span></span>
        <span class="bscore">${e.score}</span>
      </div>`;
    }).join("");
  }
  Anim.stagger(list, ".board-row");
}

/* ---------- Duell-Rangliste: Ergebnis + Bilanz in einer Zeile ---------- */
async function fetchDuelRecords() {
  try {
    const data = await tdbRead(PROFILE_KEY);
    const map = {};
    ((data && data.profiles) || []).forEach(p => { map[p.n] = p; });
    return map;
  } catch (e) { return null; }
}

function duelMeta(p, e) {
  const teile = [];
  if (p) {
    const duelle = (p.w || 0) + (p.l || 0) + (p.d || 0);
    teile.push(`<b class="rec">${p.w || 0}–${p.l || 0}–${p.d || 0}</b> S-N-U`);
    if (duelle) teile.push(Math.round(((p.w || 0) / duelle) * 100) + " % gewonnen");
  }
  teile.push(e.acc + " % richtig");
  teile.push("Index " + e.index);
  return teile.join(" · ");
}

/* ---------- Profil-Screen ---------- */
async function renderProfile() {
  const name = ($("player-name").value.trim()) || myName || localStorage.getItem("ww_name") || "";
  showScreen("screen-profile");
  const sync = $("profile-sync");
  sync.className = "board-sync";
  sync.textContent = "Lade Profile…";
  $("profile-card").innerHTML = "";

  let profiles = [];
  try {
    const data = await tdbRead(PROFILE_KEY);
    profiles = (data && data.profiles) || [];
    sync.textContent = profiles.length + " Spieler:innen mit Profil";
  } catch (e) {
    sync.textContent = "Offline – Profile nicht erreichbar";
    sync.classList.add("sync-fail");
    return;
  }

  const me = profiles.find(p => p.n === name);
  if (me) {
    const accAvg = me.t ? Math.round((me.c / me.t) * 100) : 0;
    const duels = (me.w || 0) + (me.l || 0) + (me.d || 0);
    const winrate = duels ? Math.round((me.w / duels) * 100) : 0;
    $("profile-card").innerHTML = `
      <div class="profile-name">${esc(me.n)}</div>
      <div class="week-stats">
        <div class="week-stat"><b>${me.g || 0}</b>Runden gespielt</div>
        <div class="week-stat"><b>${me.w || 0}-${me.l || 0}-${me.d || 0}</b>Duelle S-N-U</div>
        <div class="week-stat"><b>${winrate} %</b>Duell-Siegquote</div>
        <div class="week-stat"><b>${accAvg} %</b>Ø Genauigkeit</div>
        <div class="week-stat"><b>${me.bs || 0}</b>Bestleistung</div>
      </div>`;
    Anim.stagger($("profile-card"), ".week-stat");
  } else {
    $("profile-card").innerHTML = `<div class="board-empty">Noch kein Profil für „${esc(name || "…")}“ – spiel eine Runde, dann entsteht es automatisch.</div>`;
  }
}

/* =========================================================================
   ONLINE-DUELL
   ========================================================================= */
let duelCfg = null;          // die Regeln des Raums (der Host legt sie fest)
let duelPeerName = "";       // Name der Gegenseite

function readDuelCfg() {
  return {
    cases: chipVal("cfg-cases") || 10,
    timer: chipVal("cfg-timer") || 35,
    hard: chipVal("cfg-hard") === 1,
    showdown: chipVal("cfg-showdown") === 1,
  };
}

const DEFAULT_DUEL_CFG = { cases: 10, timer: 35, hard: false, showdown: true };

function cfgSummary(cfg) {
  const c = cfg || DEFAULT_DUEL_CFG;
  return `${c.cases} Fälle · ${c.timer}s pro Fall · ${c.hard ? "Profi (nur schwere Fälle)" : "Gemischt"} · Showdown ${c.showdown ? "an 🧪" : "aus"}`;
}

/* ---------- Duell-Lobby: beide verbunden, Host stellt ein und startet ---------- */
function showDuelLobby() {
  $("lobby-choice").classList.add("hidden");
  $("lobby-wait").classList.add("hidden");
  $("lobby-error").classList.add("hidden");
  $("lobby-ready").classList.remove("hidden");
  renderDuelLobby();
}

function renderDuelLobby() {
  const host = Net.isHost;
  const me = myName || localStorage.getItem("ww_name") || "Ich";
  $("duel-players").innerHTML =
    `<span class="t-name-pill">${host ? "🎓 " : ""}${esc(me)} (du)</span>` +
    `<span class="t-name-pill">${host ? "" : "🎓 "}${esc(duelPeerName || "…")}</span>`;
  $("duel-settings").classList.toggle("hidden", !host);
  $("duel-settings-readonly").classList.toggle("hidden", host);
  $("duel-settings-readonly").textContent = "Regeln des Hosts: " + cfgSummary(duelCfg);
  $("btn-duel-start").classList.toggle("hidden", !host);
  $("btn-duel-start").disabled = false;
  $("duel-lobby-hint").textContent = host
    ? "Du legst die Regeln fest – Änderungen sieht dein Gegner sofort. Starte, wenn ihr beide bereit seid."
    : "Der Host legt die Regeln fest und startet das Duell.";
}

/* Host hat an den Regeln gedreht -> sofort zur Gegenseite spiegeln */
function pushDuelCfg() {
  if (!Net.isHost || !Net.active) return;
  duelCfg = readDuelCfg();
  Net.send("cfg", { cfg: duelCfg });
  renderDuelLobby();
}

function lobbyError(msg) {
  const el = $("lobby-error");
  el.textContent = msg;
  el.classList.remove("hidden");
}

function lobbyStep(stepId, done, text) {
  const el = $(stepId);
  if (text) el.textContent = text;
  el.classList.toggle("done", !!done);
}

function resetLobbyUI() {
  $("lobby-choice").classList.remove("hidden");
  $("lobby-wait").classList.add("hidden");
  $("lobby-ready").classList.add("hidden");
  $("lobby-error").classList.add("hidden");
  duelPeerName = "";
  ["step-server", "step-room", "step-peer"].forEach(id => $(id).classList.remove("done"));
  lobbyStep("step-server", false, "Spielserver…");
  lobbyStep("step-room", false, "Raum öffnen…");
  lobbyStep("step-peer", false, "Auf Gegner warten…");
}

function openLobby() {
  const name = getPlayerName();
  if (!name) return;
  resetLobbyUI();
  $("join-code").value = "";
  showScreen("screen-lobby");
}

function wireNet() {
  Net.onStatus = (text) => { $("lobby-status").innerHTML = esc(text) + '<span class="dots"></span>'; };

  Net.onRoomReady = (code) => {
    $("room-code-display").textContent = code;
    $("duel-code-display").textContent = code;
    $("lobby-choice").classList.add("hidden");
    $("lobby-wait").classList.remove("hidden");
    $("lobby-error").classList.add("hidden");
    lobbyStep("step-server", true, "Spielserver verbunden ✓");
    lobbyStep("step-room", true, "Raum " + code + " ist offen ✓");
    lobbyStep("step-peer", false, "Warte auf Gegner – sag den Code an!");
    Net.onStatus("Warte auf Gegner");
  };

  Net.onConnected = () => {
    lobbyStep("step-server", true, "Spielserver verbunden ✓");
    lobbyStep("step-room", true, "Raum gefunden ✓");
    lobbyStep("step-peer", true, "Gegner verbunden ✓");
    if (!Net.isHost) {
      $("lobby-choice").classList.add("hidden");
      $("lobby-wait").classList.remove("hidden");
      Net.onStatus("Verbunden – warte auf die Lobby");
      Net.send("hello", { name: myName || "Gast" });
    } else {
      Net.onStatus("Gegner verbunden");
    }
  };

  Net.onMessage = (msg) => {
    switch (msg.type) {
      // Der Gast meldet sich -> Host schickt Namen und Regeln, beide in die Lobby
      case "hello":
        duelPeerName = msg.name || "Gast";
        duelCfg = readDuelCfg();
        Net.send("lobbyInfo", { name: myName || "Host", cfg: duelCfg });
        showDuelLobby();
        break;
      case "lobbyInfo":
        duelPeerName = msg.name || "Host";
        duelCfg = msg.cfg || DEFAULT_DUEL_CFG;
        $("duel-code-display").textContent = $("room-code-display").textContent;
        showDuelLobby();
        break;
      case "cfg":                       // Host hat die Regeln geändert
        duelCfg = msg.cfg || DEFAULT_DUEL_CFG;
        renderDuelLobby();
        break;
      case "start":
        startDuel(msg.seed, msg.name, msg.cfg || DEFAULT_DUEL_CFG);
        break;
      case "progress":
        if (G && G.duel) { G.duel.oppScore = msg.score; G.duel.oppIndex = msg.index; updateHud(); }
        break;
      case "sabotage":
        if (G && G.duel) {
          G.duel.oppBuild = msg.build;
          if (G.duel.myBuild && !G.boss) startShowdownHunt();
        }
        break;
      case "huntResult":
        if (G && G.duel) {
          G.duel.oppHunt = { found: msg.found, timeLeft: msg.timeLeft };
          if (G.duel.myHunt && overlayOpen("overlay-wait")) finishDuel();
        }
        break;
      case "final":
        if (G && G.duel) {
          G.duel.oppFinal = { score: msg.score, acc: msg.acc, index: msg.index };
          if (G.duel.waitingFinal) showDuelResult();
        }
        break;
    }
  };

  Net.onDropped = (reason) => {
    if (!G || G.mode !== "duel" || !G.duel) {
      resetLobbyUI();
      lobbyError("Verbindung verloren: " + reason);
      return;
    }
    if (G.finalScore && !G.duel.waitingFinal) return;
    G.duel.dropped = true;
    netBanner(reason + " – du spielst gegen HYDRA weiter, dein Ergebnis zählt für die Rangliste.", "error");
    if (overlayOpen("overlay-wait")) {
      showOverlay("overlay-wait", false);
      if (G.duel.myBuild && !G.duel.oppBuild) {
        G.duel.oppBuild = randomBuild(mulberry32(randomSeed()));
        startShowdownHunt();
      } else if (G.duel.myHunt && !G.duel.oppHunt) {
        finishDuel();
      } else if (G.duel.waitingFinal) {
        showDuelResult();
      }
    }
  };

  Net.onJoinFailed = (reason) => {
    resetLobbyUI();
    lobbyError(reason);
  };
}

/* Meldung am unteren Rand. `art` steuert nur die Farbe des Randstreifens:
   info (Standard) · warn · error · good. Antippen schließt sofort. */
let bannerTimer = null;
function netBanner(text, art) {
  const b = $("net-banner");
  const icon = { warn: "⚠️", error: "📡", good: "✓" }[art] || "ℹ️";
  b.className = "net-banner" + (art ? " " + art : "");
  b.innerHTML = `<span class="nb-icon">${icon}</span><span class="nb-text">${esc(text)}</span>`;
  clearTimeout(bannerTimer);
  bannerTimer = setTimeout(() => b.classList.add("hidden"), 8000);
}

function startDuel(seed, oppName, cfg) {
  const name = myName || localStorage.getItem("ww_name") || "Anonym";
  G = freshState("duel", name, seed);
  G.duel = { oppName: oppName || "Gegner", oppScore: 0, oppIndex: 100, oppBuild: null, oppHunt: null, oppFinal: null, myBuild: null, myHunt: null, dropped: false, waitingFinal: false, cfg };
  const { deck, sections } = buildMixedDeck(seed, cfg, "DUELL");
  G.deck = deck; G.sections = sections;
  sections.forEach(s => { s.intro += cfg.showdown ? " Danach: der Showdown." : ""; });
  showSectionIntro();
}

function finishDuel() {
  showOverlay("overlay-wait", false);
  if (G.duel.oppHunt && !G.duel.oppHunt.found) {
    G.score += 250;
    netBanner("Dein Fake blieb unentdeckt: +250 Punkte!", "good");
  }
  computeFinal();
  const acc = G.total ? Math.round((G.correct / G.total) * 100) : 0;
  Net.send("final", { score: G.finalScore, acc, index: G.index });
  saveResult("duel-sync");
  G.duel.waitingFinal = true;
  if (G.duel.oppFinal || G.duel.dropped) showDuelResult();
  else { $("wait-text").textContent = "Warte auf das Endergebnis des Gegners…"; showOverlay("overlay-wait", true); }
}

function showDuelResult() {
  showOverlay("overlay-wait", false);
  G.duel.waitingFinal = false;
  const me = { name: G.name, score: G.finalScore, acc: G.total ? Math.round((G.correct / G.total) * 100) : 0, index: G.index };
  const opp = G.duel.oppFinal;

  if (!opp) return showResult();

  const iWin = me.score > opp.score;
  const draw = me.score === opp.score;
  updateProfile(p => { if (draw) p.d = (p.d || 0) + 1; else if (iWin) p.w = (p.w || 0) + 1; else p.l = (p.l || 0) + 1; });

  $("duel-verdict").textContent = draw ? "🤝 Unentschieden!" : iWin ? "🏆 SIEG!" : "Niederlage…";
  $("duel-compare").innerHTML = `
    <div class="duel-side ${iWin && !draw ? "winner" : ""}"><div class="name">${esc(me.name)} (du)</div><div class="pts">${me.score}</div>
      <div class="bmeta muted small">${me.acc} % richtig · Index ${me.index}</div></div>
    <div class="duel-vs">VS</div>
    <div class="duel-side ${!iWin && !draw ? "winner" : ""}"><div class="name">${esc(G.duel.oppName)}</div><div class="pts">${opp.score}</div>
      <div class="bmeta muted small">${opp.acc} % richtig · Index ${opp.index}</div></div>`;
  $("duel-breakdown").innerHTML = `
    <div><span>Deine Rohpunkte</span><span>${G.score}</span></div>
    <div><span>Dein Multiplikator</span><span>× ${(G.crisis ? 0.5 : S.finalMultiplier(G.index)).toFixed(2)}</span></div>
    <div class="total"><span>Endpunktzahl</span><span>${G.finalScore}</span></div>`;
  Anim.stagger($("duel-compare"), ".duel-side", 120);
  Anim.stagger($("duel-breakdown"), "div");
  reviewReturn = "screen-duel-result";
  setTimeout(() => Net.close(), 4000);  // großzügig, damit die letzte Nachricht sicher gelesen wird
  showScreen("screen-duel-result");
}

/* =========================================================================
   KLASSENRAUM
   ========================================================================= */
let classGameStarted = false;
let classResultShown = false;   // Podium nur beim ersten Aufbau einlaufen lassen

function classError(msg) {
  const el = $("class-error");
  el.textContent = msg;
  el.classList.remove("hidden");
}

function openClass() {
  const name = getPlayerName();
  if (!name) return;
  $("class-error").classList.add("hidden");
  $("class-join-code").value = "";
  classGameStarted = false;
  showScreen("screen-class");
}

function wireClassNet() {
  ClassNet.onFailed = (reason) => { showScreen("screen-class"); classError(reason); };
  ClassNet.onLost = (reason) => netBanner(reason, "error");

  ClassNet.onUpdate = (st) => {
    const active = document.querySelector(".screen.active").id;

    // Runde startet
    if (st.started && !classGameStarted) {
      classGameStarted = true;
      startClassGame(st.seed, st.cfg || {});
      return;
    }

    if (active === "screen-class-lobby") renderClassLobby(st);
    if (active === "screen-case" && G && G.variant === "klasse") updateHud();
    if (active === "screen-class-result") renderClassResult(st);

    if (G && G.variant === "klasse") {
      classCheckPull(st);
      classTryAssign();
      classFakeBonus(st);
      if (active === "screen-build" || overlayOpen("overlay-wait")) updateClassLive();
    }
  };
}

function renderClassLobby(st) {
  const players = (st.players || []);
  const cfg = st.cfg || {};
  const host = ClassNet.isHost;
  $("class-count").textContent = players.length + " von " + ClassNet.MAX_PLAYERS + " Spieler:innen im Raum";
  const before = $("class-players").childElementCount;
  $("class-players").innerHTML = players.map(p =>
    `<span class="t-name-pill">${p.g === st.host ? "🎓 " : ""}${esc(p.n)}</span>`).join("");
  // nur neu Hinzugekommene einlaufen lassen, sonst zappelt die Liste bei jedem Poll
  Array.from($("class-players").children).slice(before).forEach(el => el.classList.add("anim-in"));

  const rules = `${cfg.cases || 10} Fälle · ${cfg.timer || 35}s pro Fall · Showdown ${cfg.showdown ? "an 🧪" : "aus"}`;
  $("class-settings").classList.toggle("hidden", !host);
  $("class-settings-readonly").classList.toggle("hidden", host);
  $("class-settings-readonly").textContent = "Regeln des Hosts: " + rules;

  const startBtn = $("btn-class-start");
  if (host) {
    startBtn.classList.remove("hidden");
    startBtn.disabled = players.length < 2;
    startBtn.textContent = players.length < 2 ? "🚀 Runde starten (mind. 2)" : `🚀 Runde starten (${players.length} Spieler:innen)`;
    $("class-lobby-hint").textContent = "Stell die Regeln ein – alle sehen die Änderung sofort. Starte, sobald alle drin sind; Nachzügler können danach nicht mehr beitreten.";
  } else {
    startBtn.classList.add("hidden");
    $("class-lobby-hint").textContent = "Warte, bis der Host die Runde startet…";
  }
}

function readClassCfg() {
  return {
    cases: chipVal("ccfg-cases") || 10,
    timer: chipVal("ccfg-timer") || 35,
    showdown: chipVal("ccfg-showdown") === 1 ? 1 : 0,
  };
}

/* Host hat in der Lobby an den Regeln gedreht -> in den Raum schreiben */
function pushClassCfg() {
  if (!ClassNet.isHost || !ClassNet.code) return;
  const cfg = readClassCfg();
  if (ClassNet.state) ClassNet.state.cfg = cfg;      // sofort anzeigen, Server zieht nach
  renderClassLobby(ClassNet.state || { players: [], cfg });
  ClassNet.setCfg(cfg);
}

async function classCreate() {
  const cfg = readClassCfg();
  $("class-error").classList.add("hidden");
  const ok = await ClassNet.create(cfg);
  if (!ok) return;
  $("class-code-display").textContent = ClassNet.code;
  classGameStarted = false;
  showScreen("screen-class-lobby");
  renderClassLobby(ClassNet.state);
}

async function classJoin() {
  const code = $("class-join-code").value.trim().toUpperCase();
  if (code.length !== 5) return classError("Der Raum-Code hat 5 Zeichen.");
  $("class-error").classList.add("hidden");
  const ok = await ClassNet.join(code);
  if (!ok) return;
  $("class-code-display").textContent = code;
  classGameStarted = false;
  showScreen("screen-class-lobby");
  if (ClassNet.state) renderClassLobby(ClassNet.state);
}

function startClassGame(seed, cfg) {
  const name = myName || localStorage.getItem("ww_name") || "Anonym";
  G = freshState("solo", name, seed);
  G.variant = "klasse";
  G.class = {
    roomCode: ClassNet.code,
    cfg: { cases: cfg.cases || 10, timer: cfg.timer || 35, showdown: !!cfg.showdown },
    myBuild: null, assigned: false, donorGid: null, donorName: null,
    waitStart: 0, stagger: 0, finished: false, bonusPts: 0, bonusCounted: 0, bonusClosed: false, bonusDeadline: 0,
    pullSeenAt: 0, pulled: false, wasPulled: false,
  };
  const { deck, sections } = buildMixedDeck(seed, { cases: G.class.cfg.cases, timer: G.class.cfg.timer, hard: 0 }, "KLASSENRAUM " + ClassNet.code);
  G.deck = deck; G.sections = sections;
  if (G.class.cfg.showdown) {
    sections[sections.length - 1].intro += " Danach: der Showdown – jede:r baut einen eigenen Fake für jemand anderen aus der Klasse.";
  }
  showSectionIntro();
}

/* =========================================================================
   KLASSENRAUM-SHOWDOWN

   Jede:r baut einen Fake und legt ihn in den gemeinsamen Raum-Zustand.
   Verteilung (jede:r rechnet sie selbst aus, ohne Server-Logik):

     1. RING: Alle Raum-Mitglieder werden nach ihrer Spieler-ID sortiert;
        jede:r nimmt den Fake der nächsten Person im Ring. Das ist eine
        reine Funktion der Teilnehmerliste – ohne Absprache, ohne Rennen,
        und es geht mathematisch perfekt auf: jeder Fake genau einmal,
        niemand bekommt den eigenen. Gilt, sobald die Person abgegeben hat
        und noch niemand sonst ihren Fake genommen hat.
     2. SONST der Fake mit den WENIGSTEN bisherigen Zuteilungen (jede:r
        trägt seine Zuteilung als "ta" ein, alle sehen sie). Gleichstand
        wird pro Person unterschiedlich aufgelöst (Hash). Ein bereits
        vergebener Fake wird nur als letzte Option genommen.
     3. Nach CLASS_FAKE_WAIT_MS ohne freien Fake baut HYDRA einen
        -> niemand wartet auf Trödler, keine Downtime.

   Dazu zwei Kleinigkeiten gegen Rennen: ein kurzer, pro Person
   unterschiedlicher Versatz vor der Zuteilung und schnelleres Polling
   während des Showdowns (Zuteilungen müssen zügig sichtbar sein).
   Simuliert mit 30 Spieler:innen: ~25 von 30 Fakes gehen an genau eine
   Person, praktisch nie derselbe Fake an drei, Wartezeit im Schnitt ~2 s.
   ========================================================================= */
const CLASS_FAKE_WAIT_MS = 60000;    // so lange auf einen Fake aus der Klasse warten
const CLASS_STAGGER_MS = 4000;       // Spanne des Versatzes vor der Zuteilung
const CLASS_BONUS_WAIT_MS = 150000;  // so lange auf das Urteil des Gegenübers warten
const CLASS_FAKE_BONUS = 200;        // Punkte, wenn der eigene Fake unentdeckt bleibt

/* Nachzügler in den Showdown holen.
   Trigger ist NICHT die erste fertige Person – sonst würde eine einzelne
   schnelle Person die halbe Klasse mitten aus der Runde reißen. Erst wenn
   der überwiegende Teil im Showdown ist, läuft für die Übrigen eine Frist. */
const CLASS_PULL_SHARE = 0.6;        // ab diesem Anteil im Showdown läuft die Frist
const CLASS_PULL_MS = 45000;         // danach werden Nachzügler hineingeholt

/* Bauplan platzsparend als Index-Liste ablegen (der Raum-Zustand ist EIN Wert
   für bis zu 30 Spieler:innen – Kürze ist hier Funktion, nicht Kosmetik). */
function packBuild(spec) {
  const sab = DATA.sabotage;
  return [
    sab.themes.findIndex(t => t.id === spec.themeId),
    sab.formats.findIndex(f => f.id === spec.formatId),
  ].concat((spec.cloakIds || []).map(id => sab.cloaks.findIndex(c => c.id === id)));
}
function unpackBuild(arr) {
  const sab = DATA.sabotage;
  if (!Array.isArray(arr) || arr.length < 3) return randomBuild(mulberry32(randomSeed()));
  const at = (list, i) => list[i] || list[0];
  return {
    themeId: at(sab.themes, arr[0]).id,
    formatId: at(sab.formats, arr[1]).id,
    cloakIds: arr.slice(2, 2 + sab.maxCloaks).map(i => at(sab.cloaks, i).id),
  };
}

let classWaitTimer = null;
function classStopWaitTicker() { clearInterval(classWaitTimer); classWaitTimer = null; }

function classSubmitBuild(spec) {
  const cl = G.class;
  cl.myBuild = spec;
  cl.waitStart = Date.now();
  cl.bonusDeadline = Date.now() + CLASS_BONUS_WAIT_MS;
  cl.stagger = strHash(ClassNet.gid || "x") % CLASS_STAGGER_MS;
  ClassNet.reportSelf({ bd: packBuild(spec) });
  ClassNet.setPace(ClassNet.POLL_FAST_MS);   // Zuteilungen müssen jetzt zügig ankommen
  showOverlay("overlay-wait", true);
  updateClassLive();
  classWaitTick(false);
  if (!classWaitTimer) classWaitTimer = setInterval(classTryAssign, 1000);
  classTryAssign();
}

function classWaitTick(onlyTaken) {
  const cl = G && G.class;
  if (!cl || cl.assigned) return;
  const left = Math.max(0, Math.ceil((CLASS_FAKE_WAIT_MS - (Date.now() - cl.waitStart)) / 1000));
  $("wait-text").textContent = "Dein Fake ist unterwegs – du bekommst gleich den Fake einer anderen Person.";
  $("wait-sub").textContent = left <= 0
    ? "HYDRA übernimmt…"
    : onlyTaken
      ? "Noch " + left + " s: Die vorhandenen Fakes sind schon vergeben – wir warten kurz auf einen frischen, damit sie sich gleichmäßig verteilen."
      : "Noch " + left + " s. Ist bis dahin niemand fertig, baut HYDRA automatisch einen – damit du nicht warten musst.";
}

function classTryAssign() {
  const cl = G && G.variant === "klasse" ? G.class : null;
  if (!cl || !cl.myBuild || cl.assigned) return classStopWaitTicker();

  const players = (ClassNet.state && ClassNet.state.players) || [];
  const me = ClassNet.gid;
  const waited = Date.now() - cl.waitStart;
  const last = waited >= CLASS_FAKE_WAIT_MS;

  if (waited < cl.stagger) return classWaitTick(false);

  const claims = {};
  players.forEach(p => { if (p.ta && p.g !== me) claims[p.ta] = (claims[p.ta] || 0) + 1; });
  const cands = players.filter(p => p.g !== me && p.bd);
  let pick = null;

  // 1. Ring-Partner:in (siehe Kommentar oben) – wenn abgegeben und noch frei
  const ring = players.map(p => p.g).sort();
  const ringDonor = ring.length > 1 ? ring[(ring.indexOf(me) + 1) % ring.length] : null;
  const ringCand = cands.find(p => p.g === ringDonor);
  if (ringCand && !claims[ringDonor]) pick = ringCand;

  // 2. Sonst der am wenigsten beanspruchte vorhandene Fake
  if (!pick && cands.length) {
    const best = cands.slice().sort((a, b) =>
      ((claims[a.g] || 0) - (claims[b.g] || 0)) ||
      (strHash(me + a.g) - strHash(me + b.g)))[0];
    if (!claims[best.g] || last) pick = best;
    else return classWaitTick(true);         // alles vergeben -> kurz auf einen frischen warten
  }

  // 3. Noch gar nichts da -> warten, danach übernimmt HYDRA
  if (!pick && !last) return classWaitTick(false);

  cl.assigned = true;
  classStopWaitTicker();
  ClassNet.setPace(ClassNet.POLL_MS);
  const spec = pick ? unpackBuild(pick.bd) : randomBuild(mulberry32((G.seed ^ strHash(me)) >>> 0));
  cl.donorGid = pick ? pick.g : null;
  cl.donorName = pick ? pick.n : "HYDRA";
  ClassNet.reportSelf({ ta: pick ? pick.g : "auto" });

  showOverlay("overlay-wait", false);
  $("wait-sub").textContent = "";
  $("wait-live").textContent = "";
  startHunt(craftFake(spec), "SHOWDOWN · KLASSENRAUM", pick
    ? `In diesem Feed steckt der Fake, den <strong>${esc(pick.n)}</strong> gebaut hat. Eine Markierung, keine zweite Chance.`
    : "Niemand war rechtzeitig fertig – <strong>HYDRA</strong> hat selbst einen Fake gebaut und hier versteckt. Eine Markierung, keine zweite Chance.");
}

/* ---------- Live-Anzeige: wie viele Fakes liegen schon vor? ---------- */
function updateClassLive() {
  const cl = G && G.variant === "klasse" ? G.class : null;
  if (!cl || !cl.cfg.showdown) return;
  const players = (ClassNet.state && ClassNet.state.players) || [];
  const done = players.filter(p => p.bd).length;
  const total = players.length || 1;
  $("build-live-item").classList.remove("hidden");
  $("build-live").textContent = done + "/" + total;
  $("wait-live").textContent = `🧪 ${done} von ${total} Spieler:innen haben ihren Fake abgegeben.`;
}

/* ---------- Nachzügler in den Showdown holen ---------- */
function classCheckPull(st) {
  const cl = G && G.variant === "klasse" ? G.class : null;
  if (!cl || !cl.cfg.showdown || cl.pulled || cl.myBuild) return;
  const active = document.querySelector(".screen.active");
  if (!active || (active.id !== "screen-case" && active.id !== "screen-week")) return;

  const players = (st && st.players) || [];
  if (players.length < 2) return;
  const ready = players.filter(p => p.sd || p.bd || p.f === 1).length;
  const need = Math.max(2, Math.ceil(players.length * CLASS_PULL_SHARE));

  if (ready < need) { cl.pullSeenAt = 0; return; }
  // Die Frist läuft ab dem Moment, in dem ICH den Schwellwert sehe – so ist
  // sie unabhängig davon, ob die Uhren der Geräte gleich gehen.
  if (!cl.pullSeenAt) { cl.pullSeenAt = Date.now(); return; }
  if (Date.now() - cl.pullSeenAt < CLASS_PULL_MS) return;

  cl.pulled = true;
  cl.wasPulled = true;
  stopTimer();
  showOverlay("overlay-reveal", false);
  netBanner("Du warst zu langsam – die Klasse ist schon im Showdown.", "warn");
  startBuildPhase();
}

function classReportFinal() {
  computeFinal();
  const cl = G.class;
  if (cl) cl.finished = true;
  const acc = G.total ? Math.round((G.correct / G.total) * 100) : 0;
  ClassNet.reportSelf({ f: 1, s: G.finalScore, a: acc, x: G.index });
}

/* Bonus, wenn der eigene Fake beim Gegenüber unentdeckt geblieben ist.
   Wird erst nach dem eigenen Rundenende ausgewertet (das Gegenüber ist
   oft später fertig) – notfalls nach Ablauf der Wartefrist ohne Urteil.
   Kommt später noch jemand dazu (in seltenen Fällen bekommen zwei denselben
   Fake), wird die Differenz nachgezahlt – deshalb bonusCounted. */
function classFakeBonus(st) {
  const cl = G && G.variant === "klasse" ? G.class : null;
  if (!cl || !cl.myBuild || !cl.finished || cl.bonusClosed) return;
  const victims = ((st && st.players) || []).filter(p => p.ta === ClassNet.gid);
  const expired = Date.now() > cl.bonusDeadline;
  const pending = victims.some(p => p.hr == null);
  if (!expired && (pending || !victims.length)) return;
  if (expired) cl.bonusClosed = true;

  const missed = victims.filter(p => p.hr === 0).length;
  if (missed <= cl.bonusCounted) return;

  const add = (missed - cl.bonusCounted) * CLASS_FAKE_BONUS;
  cl.bonusCounted = missed;
  cl.bonusPts += add;
  G.score += add;
  classReportFinal();
  storeEntry(null);                 // Ranglisten-Eintrag auf den Bonus nachziehen
  netBanner("Dein Fake blieb unentdeckt: +" + add + " Punkte!", "good");
  if (document.querySelector(".screen.active").id === "screen-class-result") renderClassResult(st);
}

function showClassResult() {
  stopTimer();
  classResultShown = false;
  reviewReturn = "screen-class-result";
  showScreen("screen-class-result");
  if (ClassNet.state) renderClassResult(ClassNet.state);
}

function renderClassResult(st) {
  const players = (st.players || []).slice();
  const done = players.filter(p => p.f === 1);
  const playing = players.filter(p => p.f !== 1);
  $("class-result-status").textContent = playing.length
    ? `⏳ ${done.length} von ${players.length} fertig – ${playing.length} spielen noch… (aktualisiert sich automatisch)`
    : `🏁 Alle ${players.length} Spieler:innen sind fertig!`;
  $("class-result-headline").textContent = playing.length ? "🏁 Zwischenstand" : "🏁 Endstand";
  $("class-showdown-info").innerHTML = classShowdownInfo(players);

  const medals = ["🥇", "🥈", "🥉"];
  const sorted = done.sort((a, b) => (b.s || 0) - (a.s || 0));
  let html = sorted.map((p, i) => `
    <div class="board-row ${p.g === ClassNet.gid ? "me" : ""}">
      <span class="pos">${medals[i] || (i + 1) + "."}</span>
      <span class="bname">${esc(p.n)} <span class="bmeta">${p.a || 0} % richtig · Index ${p.x != null ? p.x : "–"}</span></span>
      <span class="bscore">${p.s || 0}</span>
    </div>`).join("");
  html += playing.map(p => `
    <div class="board-row pending">
      <span class="pos">…</span>
      <span class="bname">${esc(p.n)} <span class="bmeta class-phase">${classPhaseLabel(p)}</span></span>
      <span class="bscore">${p.s || 0}</span>
    </div>`).join("");
  $("class-result-list").innerHTML = html || `<div class="board-empty">Noch keine Ergebnisse.</div>`;
  if (!classResultShown) { classResultShown = true; Anim.stagger($("class-result-list"), ".board-row", 70); }
}

function classPhaseLabel(p) {
  if (p.hr != null) return "🎯 im Showdown-Finale";
  if (p.bd) return "🧪 Fake gebaut – auf der Jagd";
  return "spielt noch · Fall " + (p.c || 0);
}

/* Was ist mit meinem eigenen Fake passiert? */
function classShowdownInfo(players) {
  const cl = G && G.variant === "klasse" ? G.class : null;
  if (!cl || !cl.myBuild) return "";
  const victims = players.filter(p => p.ta === ClassNet.gid);
  const judged = victims.filter(p => p.hr != null);
  const missed = victims.filter(p => p.hr === 0).length;

  let line;
  if (!victims.length) line = "Dein Fake liegt bereit – er wird der nächsten Person zugeteilt, die den Showdown erreicht.";
  else if (!judged.length) line = `Dein Fake liegt im Feed von <strong>${esc(victims.map(v => v.n).join(", "))}</strong> – Urteil steht noch aus.`;
  else if (missed) {
    const blind = judged.filter(p => p.hr === 0);
    line = `🎭 <strong>Unentdeckt geblieben!</strong> ${esc(blind.map(v => v.n).join(", "))} ` +
      `${blind.length > 1 ? "haben" : "hat"} deinen Fake übersehen.${cl.bonusPts ? " Bonus: +" + cl.bonusPts + " Punkte." : ""}`;
  } else {
    const seher = judged.map(v => v.n);
    line = `Dein Fake wurde von <strong>${esc(seher.join(", "))}</strong> enttarnt – kein Bonus. Perfekte Tarnung gibt es eben nicht.`;
  }

  const got = cl.donorName
    ? ` Du hast den Fake von <strong>${esc(cl.donorName)}</strong> bekommen.`
    : "";
  return `<div class="tut-callout">${line}${got}</div>`;
}

/* =========================================================================
   EVENT-VERDRAHTUNG
   ========================================================================= */
function init() {
  $("player-name").value = localStorage.getItem("ww_name") || "";
  myName = localStorage.getItem("ww_name") || "";

  $("btn-solo").addEventListener("click", () => beginMode(() => showScreen("screen-solomode")));
  $("btn-mode-classic").addEventListener("click", () => startSolo("klassisch"));
  $("btn-mode-endless").addEventListener("click", () => startSolo("endlos"));
  $("btn-daily").addEventListener("click", () => beginMode(startDaily));
  $("btn-duel").addEventListener("click", () => beginMode(openLobby));
  $("btn-class").addEventListener("click", () => beginMode(openClass));
  $("btn-board").addEventListener("click", renderBoard);
  $("btn-profile").addEventListener("click", renderProfile);
  $("btn-howto").addEventListener("click", () => showScreen("screen-howto"));
  $("btn-legal").addEventListener("click", () => showScreen("screen-legal"));

  // Interaktive Einweisung
  $("btn-tutorial").addEventListener("click", () => Tutorial.open(null));
  $("btn-howto-tutorial").addEventListener("click", () => Tutorial.open(null));
  $("btn-firsttime").addEventListener("click", () => Tutorial.open(null));
  $("btn-tut-next").addEventListener("click", () => Tutorial.next());
  $("btn-tut-back").addEventListener("click", () => Tutorial.back());
  $("btn-tut-skip").addEventListener("click", () => Tutorial.skip());
  $("player-name").addEventListener("change", (e) => checkProfileKnown(e.target.value.trim()));
  $("net-banner").addEventListener("click", () => $("net-banner").classList.add("hidden"));
  refreshFirstTimeCard();
  checkProfileKnown(myName);

  // Alle [data-goto]-Knöpfe sind Zurück-/Hauptmenü-Wege -> Screen sinkt statt zu steigen
  document.querySelectorAll("[data-goto]").forEach(b =>
    b.addEventListener("click", () => goBack(b.dataset.goto)));

  // Einstellungs-Chips
  ["cfg-cases", "cfg-timer", "cfg-hard", "cfg-showdown",
   "ccfg-cases", "ccfg-timer", "ccfg-showdown"].forEach(initChipGroup);

  // Duell-Lobby
  $("btn-create-room").addEventListener("click", () => {
    duelCfg = readDuelCfg();
    $("lobby-error").classList.add("hidden");
    $("lobby-choice").classList.add("hidden");
    $("lobby-wait").classList.remove("hidden");
    $("room-code-display").textContent = "·····";
    Net.createRoom();
  });
  // Host dreht an den Regeln -> sofort zur Gegenseite spiegeln
  ["cfg-cases", "cfg-timer", "cfg-hard", "cfg-showdown"].forEach(id =>
    document.querySelectorAll("#" + id + " .chip").forEach(c =>
      c.addEventListener("click", pushDuelCfg)));
  $("btn-duel-start").addEventListener("click", () => {
    if (!Net.isHost) return;
    $("btn-duel-start").disabled = true;
    const seed = randomSeed();
    duelCfg = readDuelCfg();
    Net.send("start", { seed, name: myName || "Host", cfg: duelCfg });
    startDuel(seed, duelPeerName, duelCfg);
  });
  const doJoin = () => {
    const code = $("join-code").value.trim().toUpperCase();
    if (code.length !== 5) return lobbyError("Der Raum-Code hat 5 Zeichen.");
    $("lobby-error").classList.add("hidden");
    $("lobby-choice").classList.add("hidden");
    $("lobby-wait").classList.remove("hidden");
    $("room-code-display").textContent = code;
    Net.joinRoom(code);
  };
  $("btn-join-room").addEventListener("click", doJoin);
  $("join-code").addEventListener("keydown", (e) => { if (e.key === "Enter") doJoin(); });
  $("join-code").addEventListener("input", (e) => { e.target.value = e.target.value.toUpperCase(); });
  $("btn-copy-code").addEventListener("click", () => {
    const code = $("room-code-display").textContent;
    if (navigator.clipboard) navigator.clipboard.writeText(code).then(() => {
      $("btn-copy-code").textContent = "✓ Kopiert!";
      setTimeout(() => { $("btn-copy-code").textContent = "📋 Code kopieren"; }, 1500);
    });
  });
  $("btn-lobby-back").addEventListener("click", () => { Net.close(); goBack("screen-start"); });

  // Klassenraum
  $("btn-class-create").addEventListener("click", classCreate);
  // Host stellt die Regeln in der Lobby ein -> in den Raum schreiben
  ["ccfg-cases", "ccfg-timer", "ccfg-showdown"].forEach(id =>
    document.querySelectorAll("#" + id + " .chip").forEach(c =>
      c.addEventListener("click", pushClassCfg)));
  $("btn-class-join").addEventListener("click", classJoin);
  $("class-join-code").addEventListener("keydown", (e) => { if (e.key === "Enter") classJoin(); });
  $("class-join-code").addEventListener("input", (e) => { e.target.value = e.target.value.toUpperCase(); });
  $("btn-class-start").addEventListener("click", async () => {
    $("btn-class-start").disabled = true;
    try { await ClassNet.start(randomSeed()); }
    catch (e) { $("btn-class-start").disabled = false; netBanner("Start fehlgeschlagen – bitte erneut versuchen.", "warn"); }
  });
  $("btn-class-leave").addEventListener("click", () => { classStopWaitTicker(); ClassNet.close(); goBack("screen-start"); });
  $("btn-class-menu").addEventListener("click", () => { classStopWaitTicker(); ClassNet.close(); goBack("screen-start"); });
  $("btn-class-review").addEventListener("click", () => showReview("screen-class-result"));

  // Spiel
  $("btn-week-start").addEventListener("click", showCase);
  $("btn-approve").addEventListener("click", () => judge("approve"));
  $("btn-flag").addEventListener("click", () => judge("flag"));
  $("btn-reveal-next").addEventListener("click", () => {
    if (G.boss && G.boss.done) return afterHuntReveal();
    nextCase();
  });
  $("btn-dilemma-next").addEventListener("click", afterDilemma);
  $("btn-build-done").addEventListener("click", () => finishBuild(false));

  // Ergebnis, Review & Rangliste
  $("btn-result-review").addEventListener("click", () => showReview("screen-result"));
  $("btn-duel-review").addEventListener("click", () => showReview("screen-duel-result"));
  $("btn-review-back").addEventListener("click", () => goBack(reviewReturn));
  $("btn-result-board").addEventListener("click", renderBoard);
  $("btn-result-menu").addEventListener("click", () => goBack("screen-start"));
  $("btn-duel-board").addEventListener("click", renderBoard);
  $("btn-duel-menu").addEventListener("click", () => goBack("screen-start"));
  $("btn-board-refresh").addEventListener("click", renderBoard);
  $("btn-profile-refresh").addEventListener("click", renderProfile);
  $("btn-profile-toboard").addEventListener("click", () => { boardFilter = "duell"; syncBoardChips(); renderBoard(); });
  document.querySelectorAll("#board-filters .chip").forEach(chip => {
    chip.addEventListener("click", () => {
      boardFilter = chip.dataset.filter;
      syncBoardChips();
      renderBoard();
    });
  });

  wireNet();
  wireClassNet();
}

document.addEventListener("DOMContentLoaded", init);
