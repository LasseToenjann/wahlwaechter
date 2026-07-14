"use strict";
/* =========================================================================
   WAHLWÄCHTER – Spiellogik
   Solo (Klassisch: 3 Wochen + Boss | Endlos: Schichten mit steigender
   Schwierigkeit), Online-Duell (2 Wellen + Showdown), Turnier-Verwaltung,
   globale Online-Rangliste.
   ========================================================================= */

/* ---------- Kurz-Helfer ---------- */
const $ = (id) => document.getElementById(id);
const S = DATA.scoring;

function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  $(id).classList.add("active");
  window.scrollTo(0, 0);
}
function showOverlay(id, on) { $(id).classList.toggle("hidden", !on); }
function esc(str) {
  const d = document.createElement("div");
  d.textContent = String(str);
  return d.innerHTML;
}
const MEDIUM_LABEL = { video: "🎬 Video", bild: "🖼️ Bild", artikel: "📰 Artikel", post: "💬 Post", anzeige: "📢 Anzeige" };

/* ---------- Spielzustand ---------- */
let G = null;
let myName = "";   // im Speicher statt localStorage: robust auch bei mehreren Tabs

function freshState(mode, name, seed) {
  return {
    mode, name,                  // mode: "solo" | "duel"
    variant: "klassisch",        // solo: "klassisch" | "endlos"
    seed,
    deck: [],                    // Array von Abschnitten (Wochen/Wellen/Schichten)
    sections: [],
    secIdx: 0, caseIdx: 0, caseNo: 0,
    score: 0, index: 100, energy: 0, streak: 0,
    correct: 0, total: 0,
    usedEnergy: 0, freeProbeUsed: false, resolved: false,
    effects: { energyPerWeek: 0, timerPlus: 0, freeProbe: false, damageShield: 0, flagPenaltyPlus: 0 },
    offeredDilemmas: [],
    lastEnergyBonus: 0, lastPerfectBonus: 0,
    shift: 0, shiftErrors: 0, usedCaseIds: [],   // Endlos
    crisis: false,
    boss: null,
    duel: null,
    finalScore: 0, resultSaved: false,
  };
}

/* ---------- Deck-Aufbau (seeded => im Duell identisch) ---------- */
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

function buildDuelDeck(seed) {
  const rng = mulberry32(seed);
  const pick = (week, n) => seededShuffle(DATA.cases.filter(c => c.week === week), rng).slice(0, n);
  const all = [...pick(1, 3), ...pick(2, 4), ...pick(3, 3)];
  const deck = [all.slice(0, 5), all.slice(5, 10)];
  const sections = [
    { title: "Welle 1 – Gleiche Fälle, gleiche Chance", intro: "Ihr prüft zeitgleich exakt dieselben Beiträge. Der Live-Punktestand des Gegners läuft mit. Genauigkeit schlägt Hektik – aber die Uhr tickt.", energy: 9, timer: 40, kicker: "DUELL · WELLE 1/2" },
    { title: "Welle 2 – HYDRA legt nach", intro: "Die zweite Welle ist subtiler. Danach wartet der Showdown: Du baust deinen eigenen Fake für den Feed des Gegners.", energy: 9, timer: 40, kicker: "DUELL · WELLE 2/2" },
  ];
  return { deck, sections };
}

/* Endlos: nächste Schicht erzeugen (immer schwerer) */
function buildShift(s) {
  const E = DATA.endless;
  const weeks = E.poolForShift(s);
  let pool = DATA.cases.filter(c => weeks.includes(c.week) && !G.usedCaseIds.includes(c.id));
  if (pool.length < E.casesPerShift) {
    // Pool erschöpft: Fälle dieser Schwierigkeit wieder freigeben
    G.usedCaseIds = G.usedCaseIds.filter(id => {
      const c = DATA.cases.find(x => x.id === id);
      return c && !weeks.includes(c.week);
    });
    pool = DATA.cases.filter(c => weeks.includes(c.week) && !G.usedCaseIds.includes(c.id));
  }
  const rng = mulberry32((G.seed + s * 104729) >>> 0);
  const cases = seededShuffle(pool, rng).slice(0, E.casesPerShift);
  cases.forEach(c => G.usedCaseIds.push(c.id));
  G.deck.push(cases);
  G.sections.push({
    title: "Schicht " + s + " – HYDRA beschleunigt",
    intro: s === 1
      ? "Der Endlos-Einsatz beginnt. Jede Schicht wird härter: weniger Zeit, weniger Energie, subtilere Fälle. Eine fehlerfreie Schicht gibt +4 Demokratie-Index zurück. Halte durch, so lange du kannst!"
      : "HYDRA skaliert die Angriffe hoch. Timer und Energie schrumpfen – Präzision ist jetzt alles.",
    energy: E.energyForShift(s), timer: E.timerForShift(s),
    kicker: "ENDLOS-EINSATZ · SCHICHT " + s,
  });
}

/* =========================================================================
   START & MENÜ
   ========================================================================= */
function getPlayerName() {
  const el = $("player-name");
  const name = el.value.trim();
  if (!name) {
    el.style.borderColor = "var(--red)";
    el.placeholder = "Bitte zuerst Namen eingeben!";
    el.focus();
    showScreen("screen-start");
    return null;
  }
  el.style.borderColor = "";
  myName = name;
  localStorage.setItem("ww_name", name);
  return name;
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
   ABSCHNITTS-INTRO (Woche / Welle / Schicht)
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

  $("hud-week").textContent = G.mode === "duel" ? "WELLE " + (G.secIdx + 1)
    : G.variant === "endlos" ? "SCHICHT " + (G.secIdx + 1)
    : "WOCHE " + (G.secIdx + 1);
  $("hud-case").textContent = "Fall " + (G.caseIdx + 1) + "/" + G.deck[G.secIdx].length;
  updateHud();

  $("dossier-medium").textContent = MEDIUM_LABEL[c.medium] || c.medium;
  $("dossier-source").textContent = c.source;
  $("dossier-avatar").textContent = c.author.charAt(0).toUpperCase();
  $("dossier-author").textContent = c.author;
  $("dossier-handle").textContent = c.handle;
  $("dossier-reach").textContent = c.reach;
  $("dossier-title").textContent = c.title;
  $("dossier-text").textContent = c.text;

  renderTools(c);
  $("evidence-log").innerHTML = "";
  $("btn-approve").disabled = false;
  $("btn-flag").disabled = false;

  showScreen("screen-case");
  const sec = G.sections[G.secIdx];
  startTimer(sec.timer + G.effects.timerPlus, $("timer-text"), $("timerbar-fill"), () => judge(null));
}

function updateHud() {
  $("hud-score").textContent = G.score;
  $("hud-energy").textContent = G.energy;
  $("hud-index").textContent = G.index;
  if (G.mode === "duel" && G.duel) {
    $("hud-opponent").classList.remove("hidden");
    $("opp-name").textContent = G.duel.oppName || "Gegner";
    $("opp-score").textContent = G.duel.oppScore;
  } else {
    $("hud-opponent").classList.add("hidden");
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

function setRealRef(caseId) {
  const el = $("reveal-realref");
  const ref = caseId && DATA.realRefs[caseId];
  if (ref) {
    el.innerHTML = `<b>📚 Reales Vorbild (Spielinhalt fiktiv):</b> ${esc(ref)}`;
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

  const c = currentCase();
  G.total++;
  const correct = verdict !== null && ((verdict === "flag") === c.isFake);
  let lines = [];
  let gained = 0;

  if (correct) {
    G.correct++;
    G.streak++;
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

  // Letzter Fall des Abschnitts: Restenergie-Bonus
  const lastOfSection = G.caseIdx === G.deck[G.secIdx].length - 1;
  if (lastOfSection && G.energy > 0) {
    const eb = G.energy * S.energyLeftBonus;
    G.score += eb;
    G.lastEnergyBonus = eb;
    lines.push(`⚡ Restenergie (${G.energy}): +${eb}`);
  }

  updateHud();
  if (G.mode === "duel") Net.send("progress", { score: G.score, caseNo: G.caseNo, index: G.index });

  const v = $("reveal-verdict");
  if (verdict === null) { v.textContent = "ZEIT ABGELAUFEN"; v.className = "reveal-verdict bad"; }
  else if (correct) { v.textContent = "RICHTIG ✓" + (gained ? "  +" + gained : ""); v.className = "reveal-verdict good"; }
  else { v.textContent = "FALSCH ✗"; v.className = "reveal-verdict bad"; }
  $("reveal-truth").textContent = "Der Beitrag war: " + (c.isFake ? "🚫 KI-DESINFORMATION" : "✅ ECHT / LEGITIM") + " · Kategorie: " + c.category;
  $("reveal-points").textContent = lines.join("\n");
  $("reveal-text").textContent = c.resolution;
  setRealRef(c.id);
  showOverlay("overlay-reveal", true);
}

function nextCase() {
  showOverlay("overlay-reveal", false);

  // Vertrauenskrise nur im Solo-Modus (im Duell friert der Index bei 5 ein)
  if (G.index <= 0 && G.mode === "solo") { G.crisis = true; return showResult(); }
  if (G.mode === "duel" && G.index <= 0) G.index = 5;

  G.caseIdx++;
  if (G.caseIdx < G.deck[G.secIdx].length) return showCase();

  // Abschnitt fertig
  G.caseIdx = 0;
  G.secIdx++;
  if (G.mode === "duel") {
    if (G.secIdx < G.deck.length) return showSectionIntro();
    return startBuildPhase();                              // Duell: Showdown
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
  // Solo klassisch
  if (G.secIdx < G.deck.length) return showDilemma();      // nach Woche 1 & 2
  return startBossHunt();                                   // nach Woche 3: Finale
}

/* =========================================================================
   DILEMMA-UPGRADES (nur Solo klassisch, nach Woche 1 & 2)
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
   SHOWDOWN-BAUKASTEN (Duell) & HYDRA-BUILD (Solo-Boss)
   ========================================================================= */
const build = { theme: null, format: null, cloaks: [] };

function randomBuild(rng) {
  const sab = DATA.sabotage;
  const theme = sab.themes[Math.floor(rng() * sab.themes.length)];
  const format = sab.formats[Math.floor(rng() * sab.formats.length)];
  const cloaks = seededShuffle(sab.cloaks, rng).slice(0, sab.maxCloaks).map(c => c.id);
  return { themeId: theme.id, formatId: format.id, cloakIds: cloaks };
}

function craftFake(buildSpec) {
  const sab = DATA.sabotage;
  const theme = sab.themes.find(t => t.id === buildSpec.themeId);
  const format = sab.formats.find(f => f.id === buildSpec.formatId);
  const cloaked = (ch) => buildSpec.cloakIds.some(id => (sab.cloaks.find(c => c.id === id) || {}).channel === ch);
  return {
    isFake: true,
    crafted: true,
    build: buildSpec,
    medium: format.medium, author: format.author, source: format.source, reach: format.reach,
    title: theme.title, text: theme.text,
    category: theme.name + " als " + format.name,
    evidence: {
      forensik: format.forensik_dirty === null ? null : (cloaked("forensik") ? format.forensik_clean : format.forensik_dirty),
      quelle:   cloaked("quelle") ? format.quelle_clean : format.quelle_dirty,
      account:  cloaked("account") ? format.account_clean : format.account_dirty,
      fakten:   cloaked("fakten") ? theme.fakten_clean : theme.fakten_dirty,
    },
  };
}

function startBuildPhase() {
  build.theme = null; build.format = null; build.cloaks = [];
  const sab = DATA.sabotage;

  const mkCard = (obj, kind) => {
    const b = document.createElement("button");
    b.className = "build-card";
    b.dataset.kind = kind; b.dataset.id = obj.id;
    b.innerHTML = `<span class="b-name">${obj.icon} ${esc(obj.name)}</span><span class="b-desc">${esc(obj.desc)}</span>`;
    b.addEventListener("click", () => pickBuild(kind, obj.id, b));
    return b;
  };
  const themes = $("build-themes"); themes.innerHTML = "";
  sab.themes.forEach(t => themes.appendChild(mkCard(t, "theme")));
  const formats = $("build-formats"); formats.innerHTML = "";
  sab.formats.forEach(f => formats.appendChild(mkCard(f, "format")));
  const cloaks = $("build-cloaks"); cloaks.innerHTML = "";
  sab.cloaks.forEach(c => cloaks.appendChild(mkCard(c, "cloak")));
  $("cloak-counter").textContent = "(0/" + sab.maxCloaks + " gewählt)";
  $("btn-build-done").disabled = true;

  showScreen("screen-build");
  startTimer(sab.buildTime, $("build-timer"), document.createElement("div"), () => finishBuild(true));
}

function pickBuild(kind, id, btn) {
  const sab = DATA.sabotage;
  if (kind === "theme" || kind === "format") {
    document.querySelectorAll(`.build-card[data-kind="${kind}"]`).forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    build[kind] = id;
  } else {
    const i = build.cloaks.indexOf(id);
    if (i >= 0) { build.cloaks.splice(i, 1); btn.classList.remove("selected"); }
    else if (build.cloaks.length < sab.maxCloaks) { build.cloaks.push(id); btn.classList.add("selected"); }
    $("cloak-counter").textContent = `(${build.cloaks.length}/${sab.maxCloaks} gewählt)`;
  }
  $("btn-build-done").disabled = !(build.theme && build.format && build.cloaks.length === sab.maxCloaks);
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

  wrap.querySelectorAll(".mini-tool[data-tool]").forEach(btn => btn.addEventListener("click", () => huntProbe(btn)));
  wrap.querySelectorAll(".mini-flag").forEach(btn => btn.addEventListener("click", () => huntFlag(parseInt(btn.dataset.flag, 10))));

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
  const log = document.querySelectorAll(".hunt-item")[idx].querySelector(".hunt-evidence");
  const div = document.createElement("div");
  div.className = "evidence-item";
  div.innerHTML = `<b>${tool.icon} ${tool.name.toUpperCase()}</b>${esc(item.evidence[toolId])}`;
  log.appendChild(div);
  if (G.boss.energy < 1) {
    document.querySelectorAll(".mini-tool[data-tool]").forEach(b => b.disabled = true);
  }
}

function huntFlag(idx) { huntResolve(idx); }

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
  const cloakNames = fake.build.cloakIds.map(id => (sab.cloaks.find(c => c.id === id) || {}).name).join(" + ");
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

  const v = $("reveal-verdict");
  v.textContent = found ? "GEFUNDEN ✓  +" + gained : "NICHT GEFUNDEN ✗";
  v.className = "reveal-verdict " + (found ? "good" : "bad");
  $("reveal-truth").textContent = "Der Fake war: " + fake.title + " (" + fake.category + ")";
  $("reveal-points").textContent = lines.join("\n");
  $("reveal-text").textContent = (G.mode === "duel" ? (G.duel.oppName || "Dein Gegner") : "HYDRA") +
    " hat die Spuren mit „" + cloakNames + "“ verwischt – die übrigen Beweiskanäle hätten den Fake verraten. " +
    "Merke: Perfekte Tarnung ist unmöglich, irgendwo bleibt immer eine Spur.";
  setRealRef(null);
  updateHud();
  $("hunt-score").textContent = G.score;

  if (G.mode === "duel") {
    G.duel.myHunt = { found, timeLeft: Math.round(timeLeft) };
    Net.send("huntResult", G.duel.myHunt);
  }
  showOverlay("overlay-reveal", true);
}

function afterHuntReveal() {
  showOverlay("overlay-reveal", false);
  if (G.mode === "solo") {
    if (G.index <= 0) G.crisis = true;
    return showResult();
  }
  if (G.duel.oppHunt || G.duel.dropped) finishDuel();
  else { $("wait-text").textContent = "Warte, ob dein Fake beim Gegner unentdeckt bleibt…"; showOverlay("overlay-wait", true); }
}

/* =========================================================================
   ERGEBNIS (Solo klassisch & Endlos)
   ========================================================================= */
function rankFor(score) { return DATA.ranks.find(r => score >= r.min) || DATA.ranks[DATA.ranks.length - 1]; }

function computeFinal() {
  if (G.variant === "endlos" && G.mode === "solo") {
    G.finalScore = G.score;   // Endlos: Rohpunkte zählen, der Index ist das "Leben"
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

  const shifts = Math.max(1, G.secIdx + (G.caseIdx > 0 || G.crisis ? 1 : 0));
  if (endless) {
    $("result-kicker").textContent = "ENDLOS-PROTOKOLL";
    $("result-headline").textContent = "HYDRA hat dich überrannt";
    $("result-story").textContent = `Du hast ${shifts} Schicht${shifts === 1 ? "" : "en"} und ${G.total} Fälle durchgehalten, bevor das Vertrauen zusammenbrach. Jede Schicht war schneller und subtiler als die letzte – irgendwann erwischt HYDRA jeden. Wie weit kommst du beim nächsten Mal?`;
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

  $("result-final").textContent = G.finalScore;
  $("result-rank").textContent = rank.icon + " " + rank.name;
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
  saveResult("result-sync");
  showScreen("screen-result");
}

/* =========================================================================
   RANGLISTE – lokal (localStorage) + global (kostenloser JSON-Speicher)
   ========================================================================= */
/* Kostenloser Key-Value-Speicher (textdb.online): Lesen per GET (CORS offen),
   Schreiben per GET-Query (kein CORS-Preflight nötig). Pro Modus ein eigener
   Schlüssel -> kurze Anfragen und weniger Schreib-Kollisionen. */
const BOARD_BASE = "https://textdb.online/";
const BOARD_KEYS = {
  klassisch: "wahlwaechter_kl_x7k2m9",
  endlos:    "wahlwaechter_el_x7k2m9",
  duell:     "wahlwaechter_du_x7k2m9",
};
const BOARD_MAX = 30;   // Top 30 pro Modus global
let boardFilter = "alle";

function normMode(m) { return m === "solo" ? "klassisch" : m === "duel" ? "duell" : m; }

/* kompaktes Speicherformat <-> volle Einträge */
function packEntry(e) { return { i: e.id, n: e.name, s: e.score, a: e.acc, x: e.index, m: e.mode, e: e.extra || "", d: e.date }; }
function unpackEntry(p) { return { id: p.i, name: p.n, score: p.s, acc: p.a, index: p.x, mode: p.m, extra: p.e || "", date: p.d }; }

function loadLocalBoard() {
  try { return (JSON.parse(localStorage.getItem("ww_board_v1")) || []).map(e => Object.assign({}, e, { mode: normMode(e.mode) })); }
  catch (e) { return []; }
}
function saveLocalBoard(list) {
  localStorage.setItem("ww_board_v1", JSON.stringify(list.slice(0, 50)));
}

async function fetchModeBoard(mode) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(BOARD_BASE + BOARD_KEYS[mode] + "?t=" + Date.now(), { signal: ctrl.signal });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const text = await res.text();
    if (!text.trim()) return [];
    const data = JSON.parse(text);
    return Array.isArray(data.scores) ? data.scores.map(unpackEntry) : [];
  } finally { clearTimeout(t); }
}

async function writeModeBoard(mode, entries) {
  const payload = JSON.stringify({ scores: entries.slice(0, BOARD_MAX).map(packEntry) });
  const url = BOARD_BASE + "update/?key=" + BOARD_KEYS[mode] + "&value=" + encodeURIComponent(payload);
  const res = await fetch(url);
  if (!res.ok) throw new Error("HTTP " + res.status);
  const j = await res.json();
  if (j.status !== 1) throw new Error("write rejected");
}

/* Alle Modi zusammen laden (für Filter "alle"); wirft, wenn offline */
async function fetchGlobalBoard(mode) {
  if (mode && mode !== "alle") return fetchModeBoard(mode);
  const lists = await Promise.all(Object.keys(BOARD_KEYS).map(m => fetchModeBoard(m).catch(() => null)));
  if (lists.every(l => l === null)) throw new Error("offline");
  return lists.flatMap(l => l || []);
}

async function pushGlobalScore(entry) {
  // GET -> mergen -> schreiben -> per Rücklesen verifizieren (gegen Kollisionen)
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const scores = await fetchModeBoard(entry.mode);
      if (!scores.some(e => e.id === entry.id)) {
        scores.push(entry);
        scores.sort((a, b) => b.score - a.score);
        // Nur schreiben, wenn der Eintrag es in die Top-Liste schafft
        if (!scores.slice(0, BOARD_MAX).some(e => e.id === entry.id)) return true;
        await writeModeBoard(entry.mode, scores);
      }
      const check = await fetchModeBoard(entry.mode);
      if (check.some(e => e.id === entry.id)) return true;
    } catch (e) { /* nächster Versuch */ }
    await new Promise(r => setTimeout(r, 400 + Math.random() * 1600));
  }
  return false;
}

function makeBoardEntry() {
  const acc = G.total ? Math.round((G.correct / G.total) * 100) : 0;
  const mode = G.mode === "duel" ? "duell" : G.variant === "endlos" ? "endlos" : "klassisch";
  return {
    id: Math.random().toString(36).slice(2) + Date.now().toString(36),
    name: G.name, score: G.finalScore, acc, index: G.index, mode,
    extra: mode === "endlos" ? "Schicht " + Math.max(1, G.secIdx + (G.caseIdx > 0 || G.crisis ? 1 : 0)) : "",
    date: new Date().toISOString().slice(0, 10),
  };
}

function saveResult(syncElId) {
  if (G.resultSaved) return;
  G.resultSaved = true;
  const entry = makeBoardEntry();
  const local = loadLocalBoard();
  local.push(entry);
  local.sort((a, b) => b.score - a.score);
  saveLocalBoard(local);

  const el = $(syncElId);
  el.textContent = "🌐 Speichere in globaler Rangliste…";
  pushGlobalScore(entry).then(ok => {
    el.textContent = ok ? "✓ In der globalen Rangliste gespeichert" : "⚠️ Keine Verbindung – Ergebnis nur auf diesem Gerät gespeichert";
    el.classList.toggle("sync-ok", ok);
    el.classList.toggle("sync-fail", !ok);
  });
}

async function renderBoard() {
  showScreen("screen-board");
  const sync = $("board-sync");
  const list = $("board-list");
  sync.className = "board-sync";
  sync.textContent = "🌐 Lade globale Rangliste…";
  list.innerHTML = "";

  let entries = [];
  let global = true;
  try {
    entries = await fetchGlobalBoard(boardFilter);
  } catch (e) {
    global = false;
  }
  // lokale Einträge ergänzen (falls offline entstanden)
  const local = loadLocalBoard();
  local.forEach(le => { if (!entries.some(e => e.id === le.id)) entries.push(le); });
  entries = entries.map(e => Object.assign({}, e, { mode: normMode(e.mode) }));

  sync.textContent = global
    ? `🌐 Globale Rangliste · ${entries.length} Einträge gesamt`
    : "⚠️ Offline – zeige nur Einträge dieses Geräts";
  sync.classList.toggle("sync-fail", !global);

  const filtered = entries
    .filter(e => boardFilter === "alle" || e.mode === boardFilter)
    .sort((a, b) => b.score - a.score)
    .slice(0, 25);

  const modeIcon = { klassisch: "🛡️", endlos: "♾️", duell: "⚔️" };
  if (!filtered.length) {
    list.innerHTML = `<div class="board-empty">Noch keine Einträge${boardFilter !== "alle" ? " in dieser Kategorie" : ""}. Spiel eine Runde – dann steht dein Name hier.</div>`;
  } else {
    list.innerHTML = filtered.map((e, i) => `
      <div class="board-row">
        <span class="pos">${i + 1}.</span>
        <span class="bname">${esc(e.name)} <span class="bmeta">${modeIcon[e.mode] || ""} ${esc(e.mode || "")}${e.extra ? " · " + esc(e.extra) : ""} · ${e.acc} % · Index ${e.index} · ${esc(e.date || "")}</span></span>
        <span class="bscore">${e.score}</span>
      </div>`).join("");
  }
}

/* =========================================================================
   ONLINE-DUELL
   ========================================================================= */
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
  $("lobby-error").classList.add("hidden");
  ["step-server", "step-room", "step-peer"].forEach(id => $(id).classList.remove("done"));
  lobbyStep("step-server", false, "Vermittlungsserver…");
  lobbyStep("step-room", false, "Raum öffnen…");
  lobbyStep("step-peer", false, "Auf Gegner warten…");
}

function openLobby() {
  const name = getPlayerName();
  if (!name) return;
  if (typeof Peer === "undefined") {
    showScreen("screen-lobby");
    $("lobby-choice").classList.add("hidden");
    return lobbyError("Die Netzwerk-Bibliothek konnte nicht geladen werden. Bitte Seite neu laden.");
  }
  resetLobbyUI();
  $("join-code").value = "";
  showScreen("screen-lobby");
}

function wireNet() {
  Net.onStatus = (text) => { $("lobby-status").innerHTML = esc(text) + '<span class="dots"></span>'; };

  Net.onRoomReady = (code) => {
    $("room-code-display").textContent = code;
    $("lobby-choice").classList.add("hidden");
    $("lobby-wait").classList.remove("hidden");
    $("lobby-error").classList.add("hidden");
    lobbyStep("step-server", true, "Vermittlungsserver verbunden ✓");
    lobbyStep("step-room", true, "Raum " + code + " ist offen ✓");
    lobbyStep("step-peer", false, "Warte auf Gegner – sag den Code an!");
    Net.onStatus("Warte auf Gegner");
  };

  Net.onConnected = () => {
    lobbyStep("step-server", true, "Vermittlungsserver verbunden ✓");
    lobbyStep("step-room", true, "Raum gefunden ✓");
    lobbyStep("step-peer", true, "Gegner verbunden ✓");
    if (!Net.isHost) {
      $("lobby-choice").classList.add("hidden");
      $("lobby-wait").classList.remove("hidden");
      $("room-code-display").textContent = "✓";
      Net.onStatus("Verbunden! Starte Duell");
      Net.send("hello", { name: myName || "Gast" });
    } else {
      Net.onStatus("Gegner verbunden! Starte Duell");
    }
  };

  Net.onMessage = (msg) => {
    switch (msg.type) {
      case "hello": {           // Host empfängt Gast-Namen -> Duell starten
        const seed = randomSeed();
        Net.send("start", { seed, name: myName || "Host" });
        startDuel(seed, msg.name);
        break;
      }
      case "start":             // Gast empfängt Seed
        startDuel(msg.seed, msg.name);
        break;
      case "progress":
        if (G && G.duel) { G.duel.oppScore = msg.score; G.duel.oppIndex = msg.index; updateHud(); }
        break;
      case "sabotage":
        if (G && G.duel) {
          G.duel.oppBuild = msg.build;
          if (G.duel.myBuild && !G.boss) startShowdownHunt();  // G.boss verhindert Doppelstart
        }
        break;
      case "huntResult":
        if (G && G.duel) {
          G.duel.oppHunt = { found: msg.found, timeLeft: msg.timeLeft };
          if (G.duel.myHunt && !$("overlay-wait").classList.contains("hidden")) finishDuel();
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
    if (G.finalScore && !G.duel.waitingFinal) return;  // Duell ist bereits sauber beendet
    G.duel.dropped = true;
    netBanner("📡 " + reason + " – du spielst gegen HYDRA weiter, dein Ergebnis zählt für die Rangliste.");
    if (!$("overlay-wait").classList.contains("hidden")) {
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

let bannerTimer = null;
function netBanner(text) {
  const b = $("net-banner");
  b.textContent = text;
  b.classList.remove("hidden");
  clearTimeout(bannerTimer);
  bannerTimer = setTimeout(() => b.classList.add("hidden"), 8000);
}

function startDuel(seed, oppName) {
  const name = myName || localStorage.getItem("ww_name") || "Anonym";
  G = freshState("duel", name, seed);
  G.duel = { oppName: oppName || "Gegner", oppScore: 0, oppIndex: 100, oppBuild: null, oppHunt: null, oppFinal: null, myBuild: null, myHunt: null, dropped: false, waitingFinal: false };
  const { deck, sections } = buildDuelDeck(seed);
  G.deck = deck; G.sections = sections;
  showSectionIntro();
}

function finishDuel() {
  showOverlay("overlay-wait", false);
  if (G.duel.oppHunt && !G.duel.oppHunt.found) {
    G.score += 250;
    netBanner("🎭 Dein Fake blieb unentdeckt: +250 Punkte!");
  }
  const mult = computeFinal();
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

  if (!opp) return showResult();   // Gegner weg -> Solo-Ergebnis zeigen

  const iWin = me.score > opp.score;
  const draw = me.score === opp.score;
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
  setTimeout(() => Net.close(), 1500);  // Verzögert, damit die letzte Nachricht sicher ankommt
  showScreen("screen-duel-result");
}

/* =========================================================================
   TURNIER-UI
   ========================================================================= */
let tNames = [];

function openTournament() {
  if (Tournament.load()) return renderBracket();
  tNames = [];
  renderTNameList();
  $("t-name-input").value = "";
  showScreen("screen-tournament-setup");
}

function renderTNameList() {
  const wrap = $("t-name-list");
  wrap.innerHTML = tNames.map((n, i) =>
    `<span class="t-name-pill">${esc(n)} <button class="t-remove" data-i="${i}" aria-label="entfernen">✕</button></span>`).join("");
  wrap.querySelectorAll(".t-remove").forEach(b =>
    b.addEventListener("click", () => { tNames.splice(parseInt(b.dataset.i, 10), 1); renderTNameList(); }));
  $("btn-t-start").disabled = tNames.length < 2;
  $("btn-t-start").textContent = tNames.length < 2
    ? "🎲 Auslosen & starten (mind. 2 Namen)"
    : `🎲 Auslosen & starten (${tNames.length} Spieler:innen)`;
}

function addTName() {
  const input = $("t-name-input");
  const name = input.value.trim();
  if (!name) return;
  if (tNames.length >= 16) { input.value = ""; return; }
  if (!tNames.includes(name)) tNames.push(name);
  input.value = "";
  input.focus();
  renderTNameList();
}

function renderBracket() {
  const st = Tournament.state;
  const M = st.matches;
  const champ = Tournament.champion();
  $("t-headline").innerHTML = champ
    ? `👑 ${esc(champ)} gewinnt das Turnier!`
    : "🏟️ Turnierbaum";

  const bracket = $("bracket");
  bracket.innerHTML = "";
  M.forEach((round, r) => {
    const col = document.createElement("div");
    col.className = "bracket-round";
    col.innerHTML = `<div class="bracket-round-title">${Tournament.roundName(r, M.length)}</div>`;
    round.forEach((match, m) => {
      const card = document.createElement("div");
      card.className = "bracket-match";
      const mkP = (p, other) => {
        if (p === null) return `<div class="bracket-player empty">${r === 0 && other !== null ? "Freilos" : "– offen –"}</div>`;
        const isWinner = match.winner === p;
        const clickable = match.p1 && match.p2;
        return `<button class="bracket-player ${isWinner ? "winner" : ""}" data-r="${r}" data-m="${m}" data-p="${esc(p)}" ${clickable ? "" : "disabled"}>${esc(p)}${isWinner ? " ✓" : ""}</button>`;
      };
      card.innerHTML = mkP(match.p1, match.p2) + mkP(match.p2, match.p1);
      col.appendChild(card);
    });
    bracket.appendChild(col);
  });

  bracket.querySelectorAll(".bracket-player[data-p]").forEach(btn => {
    btn.addEventListener("click", () => {
      const r = parseInt(btn.dataset.r, 10), m = parseInt(btn.dataset.m, 10);
      const match = Tournament.state.matches[r][m];
      const name = btn.dataset.p;
      if (match.winner === name) return;
      if (confirm(`„${name}“ als Sieger dieser Partie eintragen?`)) {
        Tournament.setWinner(r, m, name);
        renderBracket();
      }
    });
  });

  showScreen("screen-tournament");
}

/* =========================================================================
   EVENT-VERDRAHTUNG
   ========================================================================= */
function init() {
  $("player-name").value = localStorage.getItem("ww_name") || "";

  $("btn-solo").addEventListener("click", () => { if (getPlayerName()) showScreen("screen-solomode"); });
  $("btn-mode-classic").addEventListener("click", () => startSolo("klassisch"));
  $("btn-mode-endless").addEventListener("click", () => startSolo("endlos"));
  $("btn-duel").addEventListener("click", openLobby);
  $("btn-tournament").addEventListener("click", openTournament);
  $("btn-board").addEventListener("click", renderBoard);
  $("btn-howto").addEventListener("click", () => showScreen("screen-howto"));

  document.querySelectorAll("[data-goto]").forEach(b =>
    b.addEventListener("click", () => showScreen(b.dataset.goto)));

  // Lobby
  $("btn-create-room").addEventListener("click", () => {
    $("lobby-error").classList.add("hidden");
    $("lobby-choice").classList.add("hidden");
    $("lobby-wait").classList.remove("hidden");
    $("room-code-display").textContent = "·····";
    Net.createRoom();
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
  $("btn-lobby-back").addEventListener("click", () => { Net.close(); showScreen("screen-start"); });

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

  // Ergebnis & Rangliste
  $("btn-result-board").addEventListener("click", renderBoard);
  $("btn-result-menu").addEventListener("click", () => showScreen("screen-start"));
  $("btn-duel-board").addEventListener("click", renderBoard);
  $("btn-duel-menu").addEventListener("click", () => showScreen("screen-start"));
  $("btn-board-refresh").addEventListener("click", renderBoard);
  document.querySelectorAll("#board-filters .chip").forEach(chip => {
    chip.addEventListener("click", () => {
      document.querySelectorAll("#board-filters .chip").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      boardFilter = chip.dataset.filter;
      renderBoard();
    });
  });

  // Turnier
  $("btn-t-add").addEventListener("click", addTName);
  $("t-name-input").addEventListener("keydown", (e) => { if (e.key === "Enter") addTName(); });
  $("btn-t-start").addEventListener("click", () => {
    if (tNames.length < 2) return;
    Tournament.create(tNames);
    renderBracket();
  });
  $("btn-t-reset").addEventListener("click", () => {
    if (confirm("Turnier wirklich löschen und neu starten?")) {
      Tournament.reset();
      openTournament();
    }
  });

  wireNet();
}

document.addEventListener("DOMContentLoaded", init);
