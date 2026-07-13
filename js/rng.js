"use strict";
/* Deterministischer Zufallsgenerator (Mulberry32) –
   sorgt dafür, dass beide Duell-Spieler exakt dieselben Fälle sehen. */

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* Fisher-Yates-Shuffle mit eigenem RNG (Original bleibt unverändert) */
function seededShuffle(arr, rng) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function randomSeed() {
  return Math.floor(Math.random() * 0xFFFFFFFF) >>> 0;
}

/* Raum-Code: 5 Zeichen, ohne verwechselbare Zeichen (0/O, 1/I) */
function randomRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}
