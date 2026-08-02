"use strict";
/* =========================================================================
   INTERAKTIVE EINWEISUNG ("Tutorial")

   Eine geführte Trainings-Schicht VOR dem ersten echten Spiel. Sie gehört
   ausdrücklich nicht zum Spiel: keine Punkte, keine Rangliste, kein Profil.
   Ziel ist, dass nach ~5 Minuten jede Funktion einmal selbst benutzt wurde:

     1 Auftrag            7 Demokratie-Index (Regler zum Ausprobieren)
     2 Dossier            8 Dilemma-Upgrades
     3 Prüfwerkzeuge      9 Fake-Werkstatt (Showdown)
     4 Urteil            10 Die Jagd im Feed
     5 Zensur-Falle      11 Alle Spielmodi
     6 Punkte & Energie  12 Merkzettel

   Die Übungsfälle stehen absichtlich hier und nicht in DATA.cases – so
   verrät die Einweisung keinen der 47 echten Fälle.

   Fortschritt: localStorage "ww_tut_v1". Ob jemand schon gespielt hat,
   erkennt game.js zusätzlich am globalen Profil (siehe tutorialShouldRun).
   ========================================================================= */

const TUT_KEY = "ww_tut_v1";

/* ---------- Übungsfälle (fiktiv wie alle Spielinhalte) ---------- */
const TUT_CASES = {

  fake: {
    id: "tut_fake",
    isFake: true,
    category: "Deepfake-Video",
    medium: "video",
    source: "Video-Plattform",
    author: "BürgerBlick Aktuell",
    handle: "@buergerblick_aktuell",
    reach: "412.000 Aufrufe · 9.800-mal geteilt",
    title: "„Innenministerin kündigt Verschiebung der Briefwahl an“",
    text: "In einem 40-Sekunden-Clip erklärt Innenministerin Kaya Berndt, die Briefwahl werde „aus technischen Gründen“ um eine Woche verschoben. Wer schon abgestimmt habe, müsse erneut wählen. Der Clip läuft seit heute Morgen durch Familien-Gruppenchats.",
    evidence: {
      forensik: "Bei schnellen Kopfbewegungen franst die Gesichtskante aus, die Ohrringe springen zwischen den Einzelbildern. Die Stimme hat keinerlei Raumhall – typisch für synthetisch erzeugte Sprache.",
      quelle: "Der Kanal „BürgerBlick Aktuell“ wurde vor 11 Tagen angelegt. Kein Impressum, keine Angabe, woher das Rohmaterial stammt, keine Redaktionsanschrift.",
      account: "Die ersten 300 Weiterleitungen kommen von Konten, die alle im selben Monat erstellt wurden und im 40-Sekunden-Takt denselben Kommentar posten.",
      fakten: "Das Innenministerium hat nichts verschoben; die Briefwahlfristen stehen im Gesetz und lassen sich nicht kurzfristig ändern. Kein einziges etabliertes Medium berichtet darüber.",
    },
    resolution: "KI-DESINFORMATION. Ein Deepfake-Video mit geklonter Stimme, verbreitet über einen frisch angelegten Kanal und ein Bot-Netz. Das Muster ist typisch: Die Fälschung erzeugt Verwirrung über den Wahlablauf und wirkt am stärksten, solange sie unwidersprochen durch private Chats läuft. Verräterisch war hier jeder einzelne Kanal – so nachlässig arbeitet HYDRA im echten Spiel nur in Woche 1.",
    realRef: "Vor mehreren realen Wahlen kursierten KI-Anrufe und -Videos mit geklonten Stimmen von Amtsträgern, die zum Fernbleiben von der Wahl aufriefen (u. a. dokumentiert bei den US-Vorwahlen 2024, Robocall-Fall New Hampshire).",
  },

  real: {
    id: "tut_real",
    isFake: false,
    category: "Satire / Meinungsbeitrag",
    medium: "post",
    source: "Soziales Netzwerk",
    author: "Der Wahlkomiker",
    handle: "@wahlkomiker · Satire",
    reach: "88.000 Aufrufe · 2.100-mal geteilt",
    title: "„Bündnis Morgen verspricht: ab 2033 wird der Montag abgeschafft“",
    text: "„Nach dem erfolgreichen Wahlversprechen, alle Schlaglöcher persönlich zuzuschütten, legt Bündnis Morgen nach: Der Montag wird ersatzlos gestrichen. Finanziert wird das aus der Kaffeekasse des Bundestags.“ – Der Beitrag wird tausendfach empört geteilt.",
    evidence: {
      forensik: null,
      quelle: "Reiner Textbeitrag ohne Medium. Das Profil verlinkt eine seit sechs Jahren bestehende Satire-Seite mit vollständigem Impressum.",
      account: "Konto seit 2026 aktiv, klar als Satire gekennzeichnet, regelmäßige Beiträge über alle Parteien hinweg – kein automatisiertes Muster.",
      fakten: "Die Behauptung ist offensichtlich absurd und wird von niemandem als Nachricht wiedergegeben. Faktenchecks führen sie als Satire, nicht als Falschmeldung.",
    },
    resolution: "ECHT / LEGITIM. Satire ist von der Meinungsfreiheit gedeckt – auch wenn sie empört geteilt wird und einzelne Leser:innen sie für bare Münze nehmen. Eine Prüfstelle, die Satire kennzeichnet, wird selbst zum Problem: Sie liefert genau die Zensur-Erzählung, von der Desinformation lebt. Merke: Empörung ist kein Beweis. Geprüft wird die Herkunft, nicht der Tonfall.",
    realRef: "Faktencheck-Redaktionen (z. B. Correctiv, dpa-Faktencheck) trennen ausdrücklich zwischen Satire und Desinformation; Plattform-Sperren von Satirebeiträgen haben mehrfach Debatten über Overblocking ausgelöst.",
  },
};

const Tutorial = {
  idx: 0,
  after: null,        // was nach der Einweisung passieren soll (z. B. Solo starten)
  st: {},             // Zustand der aktuellen Schritte
  steps: [],
  stepDone: [],

  /* ---------------- Öffnen / Schließen ---------------- */
  open(after) {
    this.after = after || null;
    this.idx = 0;
    this.st = { energy1: 4, energy2: 2, probes1: 0, hunted: false };
    this.stepDone = this.steps.map(s => !s.needs);
    stopTimer();
    showScreen("screen-tutorial");
    this.render();
  },

  markDone() {
    try {
      localStorage.setItem(TUT_KEY, JSON.stringify({
        done: 1, name: (myName || localStorage.getItem("ww_name") || ""), at: new Date().toISOString().slice(0, 10),
      }));
    } catch (e) { /* privater Modus o. Ä. – dann eben jedes Mal anbieten */ }
    if (typeof refreshFirstTimeCard === "function") refreshFirstTimeCard();
  },

  finish() {
    this.markDone();
    const after = this.after;
    this.after = null;
    if (typeof after === "function") after();
    else goBack("screen-start");
  },

  skip() {
    this.markDone();
    const after = this.after;
    this.after = null;
    netBanner("🎓 Einweisung übersprungen – du findest sie jederzeit im Hauptmenü unter „Einweisung“.");
    if (typeof after === "function") after();
    else goBack("screen-start");
  },

  /* ---------------- Navigation ---------------- */
  unlock(hint) {
    this.stepDone[this.idx] = true;
    $("btn-tut-next").disabled = false;
    if (hint !== undefined) this.hint(hint);
  },
  hint(html) {
    const el = $("tut-hint");
    el.innerHTML = html || "";
    el.classList.toggle("hidden", !html);
  },

  next() {
    if (!this.stepDone[this.idx]) return;
    if (this.idx >= this.steps.length - 1) return this.finish();
    this.idx++;
    this.render();
  },
  back() {
    if (this.idx === 0) return goBack("screen-start");
    this.idx--;
    this.stepDone[this.idx] = true;   // schon einmal erledigt
    this.render();
  },

  render() {
    const step = this.steps[this.idx];
    const n = this.steps.length;
    $("tut-kicker").textContent = step.kicker || "EINWEISUNG · PRÜFSTELLE 7";
    $("tut-title").textContent = step.title;
    $("tut-steplabel").textContent = `Schritt ${this.idx + 1} von ${n}`;
    $("tut-progress-fill").style.width = Math.round(((this.idx + 1) / n) * 100) + "%";
    $("tut-text").innerHTML = step.text || "";
    $("tut-stage").innerHTML = "";
    this.hint(step.hint || "");
    $("btn-tut-back").textContent = this.idx === 0 ? "Abbrechen" : "◀ Zurück";
    $("btn-tut-next").textContent = this.idx === n - 1 ? "🚀 Los geht's!" : "Weiter ▶";
    $("btn-tut-next").disabled = !this.stepDone[this.idx];
    const stage = $("tut-stage");
    if (step.stage) step.stage(stage);
    // Jeder Schritt läuft von oben nach unten ein – man liest in der Reihenfolge,
    // in der die Elemente erscheinen.
    Anim.stagger(stage, ":scope > *", 60);
    window.scrollTo(0, 0);
  },
};

/* =========================================================================
   Bausteine für die Übungsschritte
   ========================================================================= */

function tutDossierHtml(c) {
  return `
    <article class="dossier">
      <header class="dossier-head">
        <span class="medium-badge">${MEDIUM_LABEL[c.medium] || c.medium}</span>
        <span class="fiction-badge">ÜBUNGSFALL · FIKTIV</span>
        <span class="dossier-source">${esc(c.source)}</span>
      </header>
      <div class="dossier-author">
        <div class="avatar">${esc((c.author || "?").charAt(0).toUpperCase())}</div>
        <div>
          <div class="author-name">${esc(c.author)}</div>
          <div class="author-handle">${esc(c.handle || "")}</div>
        </div>
        <div class="dossier-reach">${esc(c.reach)}</div>
      </div>
      <h3 class="dossier-title">${esc(c.title)}</h3>
      <p class="dossier-text">${esc(c.text)}</p>
    </article>`;
}

/* Werkzeugkasten mit echter Energie-Buchhaltung (wie im Spiel) */
function tutToolbox(host, c, energyKey, onProbe) {
  const box = document.createElement("aside");
  box.className = "toolbox";
  box.innerHTML = `
    <div class="toolbox-head">PRÜFWERKZEUGE <span class="muted small">(1 ⚡ pro Prüfung)</span></div>
    <div class="tut-energy">⚡ Prüf-Energie: <b class="tut-energy-val">${Tutorial.st[energyKey]}</b></div>
    <div class="tut-tools"></div>
    <div class="evidence-log"></div>`;
  const tools = box.querySelector(".tut-tools");
  const log = box.querySelector(".evidence-log");

  const sync = () => {
    box.querySelector(".tut-energy-val").textContent = Tutorial.st[energyKey];
    tools.querySelectorAll(".tool-btn").forEach(b => {
      if (b.dataset.na === "1" || b.classList.contains("used")) return;
      b.disabled = Tutorial.st[energyKey] < 1;
    });
  };

  DATA.tools.forEach(t => {
    const applicable = c.evidence[t.id] !== null && c.evidence[t.id] !== undefined;
    const btn = document.createElement("button");
    btn.className = "tool-btn";
    btn.dataset.na = applicable ? "0" : "1";
    btn.innerHTML = `<span>${t.icon}</span>
      <span><span class="tool-name">${t.name}</span>
      <span class="tool-desc">${applicable ? t.desc : "Bei diesem Beitrag nicht anwendbar (kein Material)."}</span></span>
      <span class="tool-cost">${applicable ? "1 ⚡" : "n. a."}</span>`;
    if (!applicable) btn.disabled = true;
    btn.addEventListener("click", () => {
      if (btn.classList.contains("used") || Tutorial.st[energyKey] < 1) return;
      Tutorial.st[energyKey]--;
      btn.classList.add("used");
      btn.disabled = true;
      const item = document.createElement("div");
      item.className = "evidence-item";
      item.innerHTML = `<b>${t.icon} ${t.name.toUpperCase()}</b>${esc(c.evidence[t.id])}`;
      log.appendChild(item);
      sync();
      if (onProbe) onProbe(t, log);
    });
    tools.appendChild(btn);
  });
  sync();
  host.appendChild(box);
  return box;
}

/* Auflösungs-Karte (inline statt Overlay, damit sie in der Einweisung stehen bleibt) */
function tutReveal(host, ok, headline, lines, text, ref) {
  const div = document.createElement("div");
  div.className = "tut-reveal anim-in";
  div.innerHTML = `
    <div class="reveal-verdict ${ok ? "good" : "bad"}">${esc(headline)}</div>
    <div class="reveal-points">${esc(lines.join("\n"))}</div>
    <p class="reveal-text">${esc(text)}</p>
    ${ref ? `<div class="real-ref"><b>📚 Reales Vorbild (Spielinhalt fiktiv):</b> ${esc(ref)}</div>` : ""}`;
  host.appendChild(div);
  Anim.stamp(div.querySelector(".reveal-verdict"));
  Anim.flash(div, ok ? "good" : "bad");
  div.scrollIntoView({ block: "nearest", behavior: "smooth" });
  return div;
}

/* =========================================================================
   DIE SCHRITTE
   ========================================================================= */
Tutorial.steps = [

  /* ---------- 1 · Auftrag ---------- */
  {
    kicker: "EINWEISUNG · TAG 0",
    title: "Dein Auftrag",
    text: `
      <p>Du übernimmst die <strong>Prüfstelle 7</strong> der Bundeszentrale für digitale Wahlintegrität. Drei Wochen vor der Wahl flutet das KI-Netzwerk <strong>HYDRA</strong> die Netze mit Fälschungen.</p>
      <p>Dein Job ist <strong>nicht</strong>, alles zu löschen, was verdächtig aussieht. Dein Job ist, <em>herauszufinden</em>, was stimmt – und dabei die Freiheit nicht zu beschädigen, die du schützen sollst. Beides wird gemessen.</p>
      <p class="muted small">Diese Einweisung ist eine Trainings-Schicht: keine Punkte, keine Rangliste, kein Zeitdruck. Du kannst sie jederzeit über „Zurück“ nochmal durchgehen.</p>`,
    stage(host) {
      host.innerHTML = `
        <div class="tut-cards">
          <div class="tut-card"><span class="tut-card-icon">🕵️</span><b>Ermitteln</b><p class="muted small">Vier Prüfwerkzeuge decken auf, was die Oberfläche verschweigt.</p></div>
          <div class="tut-card"><span class="tut-card-icon">⚡</span><b>Haushalten</b><p class="muted small">Die Prüf-Energie reicht nie für alles. Du musst wählen.</p></div>
          <div class="tut-card"><span class="tut-card-icon">🏛️</span><b>Abwägen</b><p class="muted small">Durchgelassene Fakes schaden – zu viel Sperren aber auch.</p></div>
        </div>`;
    },
  },

  /* ---------- 2 · Das Dossier ---------- */
  {
    kicker: "EINWEISUNG · SCHRITT 2",
    title: "Das Fall-Dossier",
    text: `<p>So sieht ein gemeldeter Beitrag aus. Mehr bekommst du im Spiel zunächst <strong>nicht</strong> zu sehen: Absender, Reichweite, Text.</p>
           <p><strong>Was sagt dein Bauchgefühl?</strong> Tippe auf eine der beiden Antworten.</p>`,
    needs: true,
    stage(host) {
      host.innerHTML = tutDossierHtml(TUT_CASES.fake) +
        `<div class="verdict-row tut-gut">
           <button class="btn btn-approve" data-g="approve">✅ Wirkt echt</button>
           <button class="btn btn-flag" data-g="flag">🚫 Wirkt gefälscht</button>
         </div>`;
      host.querySelectorAll(".tut-gut .btn").forEach(b => b.addEventListener("click", () => {
        host.querySelectorAll(".tut-gut .btn").forEach(x => x.disabled = true);
        Tutorial.unlock(`<b>Genau das ist der Punkt.</b> Egal was du getippt hast: Auf dieser Grundlage <em>kannst</em> du es nicht wissen.
          Es gibt in diesem Spiel keine Fakes mit Rechtschreibfehlern und keine Fälschung, die man „sieht“.
          Raten bringt dich hier nicht weiter – Prüfen schon. Weiter zum Werkzeugkasten.`);
      }));
    },
  },

  /* ---------- 3 · Prüfwerkzeuge ---------- */
  {
    kicker: "EINWEISUNG · SCHRITT 3",
    title: "Die vier Prüfwerkzeuge",
    text: `<p>Jedes Werkzeug öffnet eine andere Beweisebene – alle vier gibt es in der Realität:</p>
      <ul class="tut-list">
        <li>🔬 <b>Medienforensik</b> – Artefakte, Schatten, Lippenbewegung, Metadaten</li>
        <li>📡 <b>Quellen-Check</b> – Domain-Alter, Impressum, existiert die Redaktion überhaupt?</li>
        <li>🤖 <b>Account-Analyse</b> – Kontoalter, Posting-Muster, Follower-Struktur</li>
        <li>🧭 <b>Fakten-Abgleich</b> – berichten unabhängige Quellen dasselbe?</li>
      </ul>
      <p>Jede Prüfung kostet <strong>1 ⚡ Prüf-Energie</strong>. Für diese Übung hast du 4 – im echten Spiel musst du damit eine ganze Woche auskommen.
      <strong>Prüfe jetzt mindestens zwei Kanäle.</strong></p>`,
    needs: true,
    hint: "Tipp: Wenn ein Werkzeug „n. a.“ zeigt, gibt es kein passendes Material – bei reinen Textbeiträgen z. B. keine Medienforensik.",
    stage(host) {
      const grid = document.createElement("div");
      grid.className = "case-layout";
      grid.innerHTML = tutDossierHtml(TUT_CASES.fake);
      host.appendChild(grid);
      Tutorial.st.probes1 = 0;
      Tutorial.st.energy1 = 4;
      tutToolbox(grid, TUT_CASES.fake, "energy1", () => {
        Tutorial.st.probes1++;
        if (Tutorial.st.probes1 === 1) {
          Tutorial.hint("Gut. <b>Ein einzelnes Indiz reicht selten.</b> Ein junger Account kann ein Bot sein – oder ein echter Erstwähler. Prüfe noch mindestens einen zweiten Kanal.");
        } else if (Tutorial.st.probes1 >= 2) {
          Tutorial.unlock(`<b>So arbeitet die Prüfstelle:</b> nicht ein Beweis, sondern ein <em>Muster</em> aus mehreren.
            Im echten Spiel sind einzelne Indizien absichtlich mehrdeutig – manche führen sogar in die Irre.
            Übrig gebliebene Energie ist am Ende der Woche Bonuspunkte wert, also nicht alles verbrauchen.`);
        }
      });
    },
  },

  /* ---------- 4 · Das Urteil ---------- */
  {
    kicker: "EINWEISUNG · SCHRITT 4",
    title: "Das Urteil",
    text: `<p>Im Spiel läuft pro Fall ein Timer (35–45 Sekunden). Läuft er ab, zählt das als Fehlurteil – <strong>keine Entscheidung ist auch eine Entscheidung</strong>.</p>
           <p>Du kennst die Beweislage. <strong>Fälle jetzt dein Urteil.</strong></p>`,
    needs: true,
    stage(host) {
      const c = TUT_CASES.fake;
      const wrap = document.createElement("div");
      wrap.innerHTML = `
        <div class="tut-evidence-recap"></div>
        <div class="verdict-row">
          <button class="btn btn-approve" data-v="approve">✅ FREIGEBEN<small>echt / legitim</small></button>
          <button class="btn btn-flag" data-v="flag">🚫 KENNZEICHNEN<small>KI-Desinformation</small></button>
        </div>`;
      const recap = wrap.querySelector(".tut-evidence-recap");
      recap.innerHTML = `<div class="toolbox-head">DEINE BEWEISLAGE</div>`;
      DATA.tools.forEach(t => {
        if (c.evidence[t.id] == null) return;
        const d = document.createElement("div");
        d.className = "evidence-item";
        d.innerHTML = `<b>${t.icon} ${t.name.toUpperCase()}</b>${esc(c.evidence[t.id])}`;
        recap.appendChild(d);
      });
      host.appendChild(wrap);

      wrap.querySelectorAll(".verdict-row .btn").forEach(b => b.addEventListener("click", () => {
        wrap.querySelectorAll(".verdict-row .btn").forEach(x => x.disabled = true);
        const ok = b.dataset.v === "flag";
        tutReveal(host, ok,
          ok ? "RICHTIG ✓  +180" : "FALSCH ✗",
          ok
            ? ["Basis: +100", "Zeitbonus (20 s übrig): +80", "🏛️ Demokratie-Index: unverändert"]
            : ["Ein KI-Fake ging ungebremst viral.", "🏛️ Demokratie-Index: −12"],
          c.resolution, c.realRef);
        Tutorial.unlock(ok
          ? "Sauber. Nach <b>jedem</b> Urteil bekommst du die Auflösung – so lernst du auch aus Fehlern etwas. Ganz unten steht immer das reale Vorbild der gezeigten Technik."
          : "Kein Problem – dafür ist die Übung da. Merke: Ein durchgelassener Fake kostet <b>12 Demokratie-Index</b>, das ist der teuerste Fehler im Spiel.");
      }));
    },
  },

  /* ---------- 5 · Die Zensur-Falle ---------- */
  {
    kicker: "EINWEISUNG · SCHRITT 5",
    title: "Vorsicht: Übersperren ist auch ein Fehler",
    text: `<p>Der häufigste Anfängerfehler: alles kennzeichnen, was empört. Aber <strong>Satire, harte Wahlwerbung und unbequeme Wahrheiten sind legitim</strong> – wer sie sperrt, betreibt Zensur und beschädigt genau das Vertrauen, das er schützen soll.</p>
           <p>Hier ist ein zweiter Fall. Du hast <strong>2 ⚡</strong>. Prüfe – und entscheide.</p>`,
    needs: true,
    stage(host) {
      const c = TUT_CASES.real;
      const grid = document.createElement("div");
      grid.className = "case-layout";
      grid.innerHTML = tutDossierHtml(c);
      host.appendChild(grid);
      Tutorial.st.energy2 = 2;
      tutToolbox(grid, c, "energy2");

      const vr = document.createElement("div");
      vr.className = "verdict-row";
      vr.innerHTML = `
        <button class="btn btn-approve" data-v="approve">✅ FREIGEBEN<small>echt / legitim</small></button>
        <button class="btn btn-flag" data-v="flag">🚫 KENNZEICHNEN<small>KI-Desinformation</small></button>`;
      host.appendChild(vr);

      vr.querySelectorAll(".btn").forEach(b => b.addEventListener("click", () => {
        vr.querySelectorAll(".btn").forEach(x => x.disabled = true);
        const ok = b.dataset.v === "approve";
        tutReveal(host, ok,
          ok ? "RICHTIG ✓  +140" : "FALSCH ✗",
          ok
            ? ["Basis: +100", "🕵️ Spürnasen-Bonus (max. 1 ⚡ genutzt): +40", "🏛️ Demokratie-Index: unverändert"]
            : ["Ein legitimer Beitrag wurde zensiert – Vertrauensverlust.", "🏛️ Demokratie-Index: −6"],
          c.resolution, c.realRef);
        Tutorial.unlock(ok
          ? "Genau. Übrigens: Wer richtig liegt und dabei <b>höchstens 1 ⚡</b> verbraucht hat, bekommt den <b>Spürnasen-Bonus</b> (+40)."
          : "Das ist die Falle. Ein zensierter echter Beitrag kostet <b>6 Demokratie-Index</b>. Zwei, drei solche Fehlurteile – und dein Endergebnis bricht ein, obwohl du „nur vorsichtig“ warst.");
      }));
    },
  },

  /* ---------- 6 · Punkte & Energie ---------- */
  {
    kicker: "EINWEISUNG · SCHRITT 6",
    title: "Punkte, Energie, Serien",
    text: `<p>Punkte bekommst du nur für <strong>richtige</strong> Urteile – und zwar mehr, je schneller und sparsamer du arbeitest:</p>`,
    stage(host) {
      const S2 = DATA.scoring;
      host.innerHTML = `
        <div class="result-breakdown tut-table">
          <div><span>Richtiges Urteil</span><span>+${S2.base}</span></div>
          <div><span>Zeitbonus je Restsekunde</span><span>+${S2.timeBonusPerSec}</span></div>
          <div><span>🕵️ Spürnasen-Bonus (≤ ${S2.sleuthMaxEnergy} ⚡ verbraucht)</span><span>+${S2.sleuthBonus}</span></div>
          <div><span>🔥 Serie (max. ×${S2.streakCap})</span><span>+${S2.streakBonus} je Stufe</span></div>
          <div><span>⚡ Restenergie am Wochenende</span><span>+${S2.energyLeftBonus} je Punkt</span></div>
          <div><span>Fake freigegeben</span><span>🏛️ −${S2.dmgFakeApproved}</span></div>
          <div><span>Echtes gekennzeichnet</span><span>🏛️ −${S2.dmgRealFlagged}</span></div>
          <div><span>Zeit abgelaufen</span><span>🏛️ −${S2.dmgTimeout}</span></div>
        </div>
        <div class="tut-callout">
          <b>Die eigentliche Kunst ist das Haushalten.</b> Das Wochenbudget (14 / 12 / 10 ⚡) reicht bewusst nicht,
          um alle sechs Fälle vollständig zu prüfen. Du musst entscheiden: Wo lohnt sich die Tiefenprüfung –
          und wo reicht ein Indiz? Nicht verbrauchte Energie wird am Wochenende in Punkte umgewandelt.
        </div>`;
    },
  },

  /* ---------- 7 · Demokratie-Index ---------- */
  {
    kicker: "EINWEISUNG · SCHRITT 7",
    title: "Der Demokratie-Index",
    text: `<p>Der Index startet bei <strong>100</strong> und misst das öffentliche Vertrauen in eine freie, faire Wahl. Er ist keine Deko, sondern dein <strong>Multiplikator</strong>:</p>
           <p class="tut-formula">Endpunktzahl = Rohpunkte × (0,5 + Index / 200)</p>
           <p><strong>Schieb den Regler</strong> und sieh, was aus 2.000 Rohpunkten wird.</p>`,
    needs: true,
    stage(host) {
      host.innerHTML = `
        <div class="tut-slider-box">
          <input type="range" id="tut-index" min="0" max="100" value="100">
          <div class="tut-slider-out">
            <div><span class="muted small">Demokratie-Index</span><b id="tut-idx-val">100</b></div>
            <div><span class="muted small">Multiplikator</span><b id="tut-idx-mult">× 1,00</b></div>
            <div><span class="muted small">aus 2.000 Rohpunkten</span><b id="tut-idx-score">2000</b></div>
          </div>
          <p class="muted small" id="tut-idx-note"></p>
        </div>`;
      const range = host.querySelector("#tut-index");
      const upd = (fromUser) => {
        const v = parseInt(range.value, 10);
        const mult = 0.5 + v / 200;
        $("tut-idx-val").textContent = v;
        $("tut-idx-mult").textContent = "× " + mult.toFixed(2).replace(".", ",");
        $("tut-idx-score").textContent = Math.round(2000 * mult);
        $("tut-idx-note").textContent = v === 0
          ? "Bei 0 ist sofort Schluss: Vertrauenskrise, die Wahl wird angefochten, die Punkte werden halbiert."
          : v < 40 ? "Unter 40 wird die Wahl „knapp am Abgrund“ – du verlierst ein Drittel deiner Punkte."
          : v < 75 ? "Zwischen 40 und 75: Die Wahl gilt, aber die Zweifel bleiben."
          : "Ab 75: Die Wahl war sauber – und dein Ergebnis behält fast den vollen Wert.";
        if (fromUser) Tutorial.unlock(`<b>Deshalb kann man dieses Spiel nicht durch Härte gewinnen.</b>
          Wer Fakes durchlässt, wer echte Beiträge sperrt <em>und</em> wer sich skrupellose Behörden-Upgrades holt,
          drückt denselben Wert – und damit sein eigenes Ergebnis.`);
      };
      range.addEventListener("input", () => upd(true));
      upd(false);
    },
  },

  /* ---------- 8 · Dilemma-Upgrades ---------- */
  {
    kicker: "EINWEISUNG · SCHRITT 8",
    title: "Dilemma-Upgrades: Ethik als Spielzug",
    text: `<p>In der Solo-Kampagne bietet dir das Ministerium nach Woche 1 und 2 eine Aufrüstung an. Jede hat einen echten Nutzen – und einen echten Preis. <strong>Wähl eine aus</strong> (in der Übung ohne Folgen).</p>`,
    needs: true,
    stage(host) {
      const rng = mulberry32(20320917);
      const pool = DATA.dilemmas.filter(d => !d.isPass);
      const offer = seededShuffle(pool, rng).slice(0, 3);
      const pass = DATA.dilemmas.find(d => d.isPass);
      if (pass) offer.push(pass);

      const grid = document.createElement("div");
      grid.className = "dilemma-grid";
      offer.forEach(d => {
        const card = document.createElement("button");
        card.className = "dilemma-card" + (d.isPass ? " pass" : "");
        card.innerHTML = `<span class="d-icon">${d.icon}</span><h4>${esc(d.name)}</h4>
          <p>${esc(d.offer)}</p>
          <span class="d-effect">▲ ${esc(d.effectText)}</span>
          <span class="d-cost">▼ ${esc(d.costText)}</span>`;
        card.addEventListener("click", () => {
          grid.querySelectorAll(".dilemma-card").forEach(x => { x.disabled = true; x.classList.remove("selected"); });
          card.classList.add("selected");
          tutReveal(host, true, d.icon + " " + d.name,
            ["▲ " + d.effectText, "▼ " + d.costText], d.debrief, null);
          Tutorial.unlock(`<b>Genau darum geht es im Kursthema:</b> Effizienz durch KI gegen demokratische Grundrechte.
            Der Verzicht ist immer wählbar und gibt Index zurück – manchmal ist die stärkste Entscheidung, keine Macht anzunehmen.`);
        });
        grid.appendChild(card);
      });
      host.appendChild(grid);
    },
  },

  /* ---------- 9 · Fake-Werkstatt ---------- */
  {
    kicker: "EINWEISUNG · SCHRITT 9",
    title: "Die Fake-Werkstatt (Showdown)",
    text: `<p>Im Duell, im Klassenraum und im Solo-Finale wechselst du die Seiten: Du baust selbst einen KI-Fake, der bei einer anderen Person im Feed landet.</p>
           <p>Wähle <strong>1 Thema, 1 Format und genau 2 Tarnungen</strong>. Jede Tarnung löscht eine Beweisspur – aber das Budget (💰 ${DATA.sabotage.budget}) reicht nicht für die zwei stärksten zusammen.</p>`,
    needs: true,
    hint: "Frag dich beim Bauen: Welche Spur ist die gefährlichste – und welche kann ich mir leisten, offen zu lassen?",
    stage(host) {
      const sab = DATA.sabotage;
      const pick = { theme: null, format: null, cloaks: [] };
      Tutorial.st.build = null;

      host.innerHTML = `
        <div class="build-section"><h3>1 · Thema</h3><div class="build-grid" data-k="theme"></div></div>
        <div class="build-section"><h3>2 · Format</h3><div class="build-grid" data-k="format"></div></div>
        <div class="build-section"><h3>3 · Tarnung <span class="muted small" id="tut-cloak-info">(0/${sab.maxCloaks} · 💰 ${sab.budget} übrig)</span></h3><div class="build-grid" data-k="cloak"></div></div>
        <div id="tut-build-out"></div>`;

      const cost = () => pick.cloaks.reduce((s, id) => s + (sab.cloaks.find(c => c.id === id).cost || 2), 0);

      const refresh = () => {
        const spent = cost();
        $("tut-cloak-info").textContent = `(${pick.cloaks.length}/${sab.maxCloaks} · 💰 ${sab.budget - spent} übrig)`;
        host.querySelectorAll('.build-card[data-kind="cloak"]').forEach(btn => {
          const c = sab.cloaks.find(x => x.id === btn.dataset.id);
          const sel = pick.cloaks.includes(c.id);
          btn.classList.toggle("selected", sel);
          btn.disabled = !sel && (pick.cloaks.length >= sab.maxCloaks || spent + (c.cost || 2) > sab.budget);
        });
        if (pick.theme && pick.format && pick.cloaks.length === sab.maxCloaks) done();
      };

      const done = () => {
        if (Tutorial.st.build) return;
        const spec = { themeId: pick.theme, formatId: pick.format, cloakIds: pick.cloaks.slice() };
        Tutorial.st.build = spec;
        const card = craftFake(spec);
        const cloaked = (ch) => spec.cloakIds.some(id => (sab.cloaks.find(c => c.id === id) || {}).channel === ch);
        const open = DATA.tools.filter(t => card.evidence[t.id] != null && !cloaked(t.id));
        $("tut-build-out").innerHTML = `
          <div class="tut-callout">
            <b>Dein Fake ist fertig – und er ist nicht perfekt.</b><br>
            Verwischt: ${esc(spec.cloakIds.map(id => (sab.cloaks.find(c => c.id === id) || {}).name).join(" + "))}<br>
            <span class="tut-open">Offen geblieben: ${esc(open.map(t => t.name).join(", ") || "nur die Gesamtlogik")}</span><br>
            <span class="muted small">Genau das ist die Lehre des Showdowns: Perfekte Tarnung ist unmöglich – irgendein Kanal verrät jede Fälschung. Deshalb lohnt sich Prüfen immer.</span>
          </div>`;
        Tutorial.unlock("Weiter geht's: Jetzt musst du deinen eigenen Fake in einem fremden Feed wiederfinden.");
      };

      const mk = (obj, kind) => {
        const b = document.createElement("button");
        b.className = "build-card";
        b.dataset.kind = kind; b.dataset.id = obj.id;
        b.innerHTML = `<span class="b-name">${obj.icon} ${esc(obj.name)}${kind === "cloak" ? ` <span class="b-cost">💰 ${obj.cost}</span>` : ""}</span>
                       <span class="b-desc">${esc(obj.desc)}</span>`;
        b.addEventListener("click", () => {
          if (Tutorial.st.build) return;
          if (kind === "cloak") {
            const i = pick.cloaks.indexOf(obj.id);
            if (i >= 0) pick.cloaks.splice(i, 1); else pick.cloaks.push(obj.id);
          } else {
            pick[kind] = obj.id;
            host.querySelectorAll(`.build-card[data-kind="${kind}"]`).forEach(x => x.classList.remove("selected"));
            b.classList.add("selected");
          }
          refresh();
        });
        return b;
      };
      sab.themes.forEach(t => host.querySelector('[data-k="theme"]').appendChild(mk(t, "theme")));
      sab.formats.forEach(f => host.querySelector('[data-k="format"]').appendChild(mk(f, "format")));
      sab.cloaks.forEach(c => host.querySelector('[data-k="cloak"]').appendChild(mk(c, "cloak")));
      refresh();
    },
  },

  /* ---------- 10 · Die Jagd ---------- */
  {
    kicker: "EINWEISUNG · SCHRITT 10",
    title: "Die Jagd im Feed",
    text: `<p>So sieht das Finale aus: vier Beiträge, genau einer ist der gebaute Fake, <strong>eine einzige Markierung</strong>. Prüfen darfst du vorher – hier mit 3 ⚡.</p>
           <p>Damit du siehst, wie gut deine eigene Tarnung wirkt, versteckt sich hier <strong>der Fake, den du gerade gebaut hast</strong>. Findest du ihn wieder?</p>`,
    needs: true,
    stage(host) {
      const spec = Tutorial.st.build || randomBuild(mulberry32(randomSeed()));
      const fake = craftFake(spec);
      const rng = mulberry32(randomSeed());
      const reals = seededShuffle(DATA.feedReals, rng).slice(0, DATA.sabotage.feedSize - 1)
        .map(r => Object.assign({ isFake: false }, r));
      const feed = seededShuffle([...reals, fake], rng);
      const fakeIdx = feed.indexOf(fake);
      let energy = 3, resolved = false;

      const wrap = document.createElement("div");
      wrap.className = "hunt-feed";
      host.innerHTML = `<div class="tut-energy">⚡ Prüf-Energie: <b id="tut-hunt-energy">3</b></div>`;
      host.appendChild(wrap);

      feed.forEach((item, idx) => {
        const el = document.createElement("div");
        el.className = "hunt-item";
        const tools = DATA.tools.map(t => {
          const na = item.evidence[t.id] == null;
          return `<button class="mini-tool" data-tool="${t.id}" data-idx="${idx}" ${na ? "disabled" : ""}>${t.icon} ${t.name} · 1⚡</button>`;
        }).join("");
        el.innerHTML = `
          <div class="hunt-item-head"><span class="medium-badge">${MEDIUM_LABEL[item.medium] || item.medium}</span>
            <b>${esc(item.title)}</b><span class="muted">${esc(item.author)} · ${esc(item.reach)}</span></div>
          <p class="hunt-text">${esc(item.text)}</p>
          <div class="hunt-tools">${tools}<button class="mini-tool mini-flag" data-flag="${idx}">🚩 Das ist der Fake!</button></div>
          <div class="hunt-evidence"></div>`;
        wrap.appendChild(el);
      });

      wrap.querySelectorAll(".mini-tool[data-tool]").forEach(btn => btn.addEventListener("click", () => {
        if (resolved || energy < 1) return;
        const idx = parseInt(btn.dataset.idx, 10);
        const t = DATA.tools.find(x => x.id === btn.dataset.tool);
        energy--;
        btn.disabled = true;
        $("tut-hunt-energy").textContent = energy;
        const log = wrap.children[idx].querySelector(".hunt-evidence");
        const d = document.createElement("div");
        d.className = "evidence-item";
        d.innerHTML = `<b>${t.icon} ${t.name.toUpperCase()}</b>${esc(feed[idx].evidence[btn.dataset.tool])}`;
        log.appendChild(d);
        if (energy < 1) wrap.querySelectorAll(".mini-tool[data-tool]").forEach(b => b.disabled = true);
      }));

      wrap.querySelectorAll(".mini-flag").forEach(btn => btn.addEventListener("click", () => {
        if (resolved) return;
        resolved = true;
        const picked = parseInt(btn.dataset.flag, 10);
        const found = picked === fakeIdx;
        wrap.querySelectorAll(".mini-tool").forEach(b => b.disabled = true);
        wrap.children[fakeIdx].classList.add("flagged-right");
        if (!found) wrap.children[picked].classList.add("flagged-wrong");
        tutReveal(host, found,
          found ? "GEFUNDEN ✓" : "NICHT GEFUNDEN ✗",
          found ? ["Volltreffer: +300", "Zeitbonus + Restenergie kommen dazu"]
                : ["Der Fake blieb online.", "🏛️ Demokratie-Index: −15"],
          "Im Duell und im Klassenraum bekommst du hier den Fake einer anderen Person – und deiner landet bei jemand anderem. Bleibt dein Fake unentdeckt, gibt es Bonuspunkte. Im Solo-Finale baut HYDRA den Fake selbst.",
          null);
        Tutorial.unlock("Das war die komplette Spielmechanik. Es fehlt nur noch: <b>wo</b> du das alles spielen kannst.");
      }));
    },
  },

  /* ---------- 11 · Modi ---------- */
  {
    kicker: "EINWEISUNG · SCHRITT 11",
    title: "Wo du spielen kannst",
    text: `<p>Dieselbe Mechanik, sechs Spielarten:</p>`,
    stage(host) {
      host.innerHTML = `
        <div class="tut-cards wide">
          <div class="tut-card"><span class="tut-card-icon">🛡️</span><b>Solo · Klassisch</b>
            <p class="muted small">Die Kampagne: 3 Wochen × 6 Fälle, 2 Dilemma-Upgrades, Boss-Finale gegen HYDRA. ca. 15–20 Min.</p></div>
          <div class="tut-card"><span class="tut-card-icon">♾️</span><b>Solo · Endlos</b>
            <p class="muted small">Schicht für Schicht härter. Ab Schicht 3 erzeugt der Fall-Generator laufend neue, nie gesehene Fälle. Läuft, bis dein Index bricht.</p></div>
          <div class="tut-card"><span class="tut-card-icon">📅</span><b>Tages-Challenge</b>
            <p class="muted small">Jeden Tag ein für alle identischer Fallsatz, 1 Versuch pro Tag. Der fairste Klassenvergleich – eigene Tages-Rangliste.</p></div>
          <div class="tut-card"><span class="tut-card-icon">⚔️</span><b>Online-Duell 1 vs 1</b>
            <p class="muted small">Raum-Code weitergeben, gleiche Fälle, Punktestand des Gegners live im Blick. Der Host legt Fallzahl, Tempo, Schwierigkeit und Showdown fest.</p></div>
          <div class="tut-card"><span class="tut-card-icon">🏟️</span><b>Klassenraum</b>
            <p class="muted small">Bis 30 Spieler:innen gleichzeitig, ein Code für alle, 👑 Spitzenreiter live im HUD, Podium am Ende – auf Wunsch mit Showdown, bei dem die gebauten Fakes reihum verteilt werden.</p></div>
          <div class="tut-card"><span class="tut-card-icon">📋</span><b>Nach dem Spiel</b>
            <p class="muted small">Fall-Auswertung (jeder Fall mit Auflösung und realem Vorbild), globale 🏆 Rangliste und dein 👤 Profil mit Duell-Bilanz und Ø-Genauigkeit.</p></div>
        </div>
        <p class="muted small">Alle Inhalte sind erfunden; jede Auflösung nennt die reale, dokumentierte Technik dahinter. Details unter „Rechtliches &amp; Datenschutz“ – bitte im Netz ein <strong>Pseudonym</strong> verwenden.</p>`;
    },
  },

  /* ---------- 12 · Merkzettel ---------- */
  {
    kicker: "EINWEISUNG · ABSCHLUSS",
    title: "Fünf Sätze, die dich durchbringen",
    text: `<p>Das war's. Du kennst jetzt jede Funktion des Spiels.</p>`,
    stage(host) {
      host.innerHTML = `
        <ol class="tut-rules">
          <li><b>Die Oberfläche verrät nichts.</b> Prüfen statt raten – immer.</li>
          <li><b>Ein Indiz ist kein Beweis.</b> Erst das Muster aus mehreren Kanälen trägt.</li>
          <li><b>Nicht alles Empörende ist falsch.</b> Übersperren ist Zensur und kostet Index.</li>
          <li><b>Energie ist Strategie.</b> Was du sparst, wird am Ende zu Punkten.</li>
          <li><b>Der Index ist dein Multiplikator.</b> Man gewinnt nicht, indem man die Demokratie opfert.</li>
        </ol>
        <p class="muted small">Die Einweisung findest du jederzeit im Hauptmenü unter <strong>🎓 Einweisung</strong>, die Kurzfassung zum Nachschlagen unter <strong>📖 Anleitung</strong>.</p>`;
    },
  },
];
