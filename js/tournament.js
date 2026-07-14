"use strict";
/* =========================================================================
   TURNIERMODUS – K.-o.-System für 2–16 Spieler:innen (mit Freilosen).
   Der Turnierbaum wird auf einem Gerät verwaltet (z. B. Beamer/Kurs-iPad);
   die Partien werden als Online-Duell oder nacheinander gespielt und der
   Sieger hier per Tipp eingetragen. Stand wird in localStorage gesichert.
   ========================================================================= */

const Tournament = {
  KEY: "ww_tournament_v1",
  state: null,   // { players: [...], matches: [ [ {p1,p2,winner} ] ], created }

  load() {
    try { this.state = JSON.parse(localStorage.getItem(this.KEY)); }
    catch (e) { this.state = null; }
    return this.state;
  },
  save() { localStorage.setItem(this.KEY, JSON.stringify(this.state)); },
  reset() { this.state = null; localStorage.removeItem(this.KEY); },

  create(names) {
    // Zufällige Auslosung
    const shuffled = names.slice();
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const size = Math.pow(2, Math.ceil(Math.log2(Math.max(2, shuffled.length))));
    // Freilose (null) gleichmäßig verteilen: Standard-Seeding gegen Ende der Liste
    const slots = shuffled.concat(new Array(size - shuffled.length).fill(null));

    const roundsCount = Math.log2(size);
    const matches = [];
    for (let r = 0; r < roundsCount; r++) {
      matches.push(new Array(size / Math.pow(2, r + 1)).fill(null).map(() => ({ p1: null, p2: null, winner: null })));
    }
    for (let m = 0; m < size / 2; m++) {
      matches[0][m].p1 = slots[m * 2];
      matches[0][m].p2 = slots[m * 2 + 1];
    }
    this.state = { players: shuffled, matches, created: new Date().toISOString().slice(0, 10) };
    this.rebuild();
    this.save();
  },

  /* Freilose auflösen + Sieger in die nächste Runde durchreichen.
     Inkonsistente (überholte) Ergebnisse werden verworfen.
     WICHTIG: Freilose gibt es nur in Runde 1 – in späteren Runden bedeutet
     ein leerer Platz "Gegner steht noch nicht fest", kein Weiterkommen! */
  rebuild() {
    const M = this.state.matches;
    for (let r = 0; r < M.length; r++) {
      for (let m = 0; m < M[r].length; m++) {
        const match = M[r][m];
        if (r === 0 && match.p1 && !match.p2) match.winner = match.p1;
        else if (r === 0 && !match.p1 && match.p2) match.winner = match.p2;
        else if (match.winner && (match.winner !== match.p1 && match.winner !== match.p2 || !match.p1 || !match.p2)) match.winner = null;
        // Sieger in nächste Runde eintragen
        if (r + 1 < M.length) {
          const next = M[r + 1][Math.floor(m / 2)];
          if (m % 2 === 0) next.p1 = match.winner; else next.p2 = match.winner;
        }
      }
    }
  },

  setWinner(r, m, player) {
    const match = this.state.matches[r][m];
    if (!player || (player !== match.p1 && player !== match.p2)) return;
    match.winner = player;
    this.rebuild();
    this.save();
  },

  champion() {
    const M = this.state.matches;
    return M[M.length - 1][0].winner;
  },

  roundName(r, total) {
    const fromEnd = total - 1 - r;
    if (fromEnd === 0) return "🏆 Finale";
    if (fromEnd === 1) return "Halbfinale";
    if (fromEnd === 2) return "Viertelfinale";
    if (fromEnd === 3) return "Achtelfinale";
    return "Runde " + (r + 1);
  },
};
