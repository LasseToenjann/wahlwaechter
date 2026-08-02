"use strict";
/* =========================================================================
   ANIMATIONS-SYSTEM „LAGEZENTRUM"

   Leitidee: Das Spiel ist eine Behörden-Leitstelle. Bewegung soll wirken wie
   Instrumente, die reagieren – präzise, kurz, mit klarer Richtung –, nicht
   wie Dekoration. Drei Regeln:

     1. Jede Bewegung beantwortet eine Frage.
        „Woher kam das?"     -> Screens und Overlays haben eine Richtung
        „Was hat sich geändert?" -> geänderte Werte pulsen
        „Was passiert gerade?"   -> Warten und Laden bewegen sich
        „War das richtig?"       -> das Urteil wird gestempelt
     2. Kurz – außer es ist ein Moment. Standard 120–320 ms. Länger dürfen nur
        die bewussten Höhepunkte: Auflösung, Endpunktzahl, Podium.
     3. Nur transform und opacity, damit es auch auf alten iPads flüssig
        bleibt. Und alles schaltet sich bei prefers-reduced-motion ab.

   Sechs Ebenen (die Zuordnung steht in style.css unter „Animationen"):
     Screen · Overlay · Inhalt (Staffelung) · Zustand · Feedback · Ambiente
   ========================================================================= */

const Anim = {
  /* Systemeinstellung „Bewegung reduzieren" respektieren – live, nicht nur
     beim Laden (iPadOS schaltet das im laufenden Betrieb um). */
  reduced: false,

  STEP_MS: 35,      // Versatz zwischen zwei gestaffelten Elementen
  STEP_MAX: 14,     // ab hier kein weiterer Versatz (lange Listen)

  init() {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      this.reduced = mq.matches;
      document.documentElement.classList.toggle("reduced-motion", this.reduced);
    };
    apply();
    mq.addEventListener ? mq.addEventListener("change", apply) : mq.addListener(apply);
  },

  /* ---------- Inhalt: Listen laufen gestaffelt ein ---------- */
  stagger(container, selector, step) {
    if (!container) return;
    const items = container.querySelectorAll(selector || ":scope > *");
    items.forEach((el, i) => {
      el.style.setProperty("--i", Math.min(i, this.STEP_MAX));
      if (step) el.style.setProperty("--step", step + "ms");
      el.classList.add("anim-in");
    });
  },

  /* ---------- Zustand: geänderter Wert pulst ---------- */
  pulse(el, kind) {
    if (!el || this.reduced) return;
    el.classList.remove("pulse-up", "pulse-down", "pulse-flat");
    void el.offsetWidth;                       // Neustart der Animation erzwingen
    el.classList.add(kind === "down" ? "pulse-down" : kind === "flat" ? "pulse-flat" : "pulse-up");
  },

  /* Zahl im Element auf einen neuen Wert hochzählen */
  countUp(el, to, ms) {
    if (!el) return;
    const from = 0;
    if (this.reduced || to <= 0) { el.textContent = to; return; }
    const dur = ms || 900;
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      // ease-out-cubic: schnell los, weich aus
      const e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(from + (to - from) * e);
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = to;
    };
    requestAnimationFrame(tick);
  },

  /* ---------- Signature-Momente ---------- */
  stamp(el) {
    if (!el || this.reduced) return;
    el.classList.remove("stamp");
    void el.offsetWidth;
    el.classList.add("stamp");
  },

  shake(el) {
    if (!el || this.reduced) return;
    el.classList.remove("shake");
    void el.offsetWidth;
    el.classList.add("shake");
  },

  /* Kurzes Aufleuchten eines Panels (Treffer / Schaden) */
  flash(el, kind) {
    if (!el || this.reduced) return;
    el.classList.remove("flash-good", "flash-bad");
    void el.offsetWidth;
    el.classList.add(kind === "bad" ? "flash-bad" : "flash-good");
  },
};

document.addEventListener("DOMContentLoaded", () => Anim.init());
