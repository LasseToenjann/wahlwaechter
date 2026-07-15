"use strict";
/* =========================================================================
   FALL-GENERATOR – erzeugt automatisch neue, einzigartige Fälle.
   Genutzt im Endlosmodus (ab Schicht 3 gemischt, später überwiegend),
   damit sich die handgeschriebenen Dossiers nicht wiederholen.

   Fakes entstehen aus dem Showdown-Baukasten (Thema × Format × Tarnungen),
   echte Fälle aus parametrisierten Vorlagen (Stadt/Person/Zahl variieren).
   Generierte Fälle sind in der Auflösung als solche gekennzeichnet.
   ========================================================================= */

function pickRng(arr, rng) { return arr[Math.floor(rng() * arr.length)]; }

/* Zufälliger, budget-konformer Bauplan (auch für HYDRA-Boss & Ersatzgegner) */
function randomBuild(rng) {
  const sab = DATA.sabotage;
  const theme = pickRng(sab.themes, rng);
  const format = pickRng(sab.formats, rng);
  let cloaks = [];
  let guard = 20;
  while (guard-- > 0) {
    cloaks = seededShuffle(sab.cloaks, rng).slice(0, sab.maxCloaks);
    if (cloaks.reduce((s, c) => s + (c.cost || 2), 0) <= sab.budget) break;
  }
  return { themeId: theme.id, formatId: format.id, cloakIds: cloaks.map(c => c.id) };
}

/* Erzeugt aus einem Bauplan die fertige Fake-Karte inkl. Beweislage */
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

/* Platzhalter in Vorlagen füllen */
function genFill(s, vars) {
  return String(s)
    .replace(/\{stadt\}/g, vars.stadt)
    .replace(/\{person\}/g, vars.person)
    .replace(/\{zahl\}/g, vars.zahl);
}

let _genCounter = 0;

/* Erzeugt einen kompletten generierten Fall (echt oder Fake) */
function generateCase(rng) {
  const g = DATA.gen;
  const vars = {
    stadt: pickRng(g.cities, rng),
    person: pickRng(g.people, rng),
    zahl: pickRng(g.numbers, rng),
  };
  _genCounter++;

  if (rng() < 0.5) {
    // Generierter FAKE aus dem Baukasten
    const spec = randomBuild(rng);
    const card = craftFake(spec);
    const sab = DATA.sabotage;
    const cloakNames = spec.cloakIds.map(id => (sab.cloaks.find(c => c.id === id) || {}).name).join(" + ");
    const openChannels = DATA.tools
      .filter(t => card.evidence[t.id] !== null && !spec.cloakIds.some(id => (sab.cloaks.find(c => c.id === id) || {}).channel === t.id))
      .map(t => t.name).join(", ");
    return Object.assign(card, {
      id: "gen_f_" + _genCounter + "_" + Math.floor(rng() * 1e6),
      week: 3,
      generated: true,
      resolution: "KI-FAKE (⚙️ automatisch generierter Fall). HYDRA hat „" + card.category + "“ kombiniert und die Spuren mit „" +
        cloakNames + "“ verwischt. Verräterisch blieben: " + (openChannels || "nur die Gesamtlogik") +
        ". Merke: Perfekte Tarnung ist unmöglich – irgendein Kanal bleibt immer offen.",
    });
  }

  // Generierter ECHTER Fall aus Vorlage
  const tpl = pickRng(g.realTemplates, rng);
  const ev = {};
  for (const k of ["forensik", "quelle", "account", "fakten"]) {
    ev[k] = tpl.evidence[k] === null || tpl.evidence[k] === undefined ? null : genFill(tpl.evidence[k], vars);
  }
  return {
    id: "gen_r_" + _genCounter + "_" + Math.floor(rng() * 1e6),
    week: 3,
    generated: true,
    isFake: false,
    category: tpl.category,
    medium: tpl.medium, source: tpl.source,
    author: genFill(tpl.author, vars), handle: "",
    reach: tpl.reach,
    title: genFill(tpl.title, vars),
    text: genFill(tpl.text, vars),
    evidence: ev,
    resolution: genFill(tpl.resolution, vars) + " (⚙️ Automatisch generierter Fall.)",
  };
}
