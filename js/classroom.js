"use strict";
/* =========================================================================
   KLASSENRAUM-MODUS – bis zu 30 Spieler:innen in EINER Runde.

   Alle teilen sich einen Raum-Schlüssel auf dem Spielserver. Jede:r
   aktualisiert dort nur den eigenen Eintrag (Lesen -> Ändern -> Schreiben
   -> per Rücklesen verifizieren, mit Wiederholungen gegen Kollisionen).
   Alle pollen denselben Schlüssel: Teilnehmerliste in der Lobby,
   Live-Spitzenreiter im Spiel, Abschluss-Auswertung am Ende.
   ========================================================================= */

const ClassNet = {
  BASE: "https://textdb.online/",
  MAX_PLAYERS: 30,
  POLL_MS: 2600,
  ROOM_FRESH_MS: 2 * 60 * 60 * 1000,   // Raum max. 2 h gültig

  code: null, gid: null, isHost: false,
  state: null,
  _pollTimer: null, _inFlight: false, _pollFails: 0,

  onUpdate: null,      // (state)  bei jedem erfolgreichen Poll
  onFailed: null,      // (reason) Erstellen/Beitreten gescheitert
  onLost: null,        // (reason) Verbindung dauerhaft weg

  _key() { return "wahlwaechter_class_" + this.code.toLowerCase(); },

  async _read() {
    const res = await fetch(this.BASE + this._key() + "?t=" + Date.now());
    if (!res.ok) throw new Error("HTTP " + res.status);
    const text = await res.text();
    if (!text.trim()) return null;
    try { return JSON.parse(text); } catch (e) { return null; }
  },

  async _write(state) {
    const url = this.BASE + "update/?key=" + this._key() + "&value=" + encodeURIComponent(JSON.stringify(state));
    const res = await fetch(url);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const j = await res.json();
    if (j.status !== 1) throw new Error("write rejected");
  },

  /* Lesen -> mutieren -> schreiben -> verifizieren (3 Versuche) */
  async _merge(mutate, verify) {
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        const st = (await this._read()) || null;
        const next = mutate(st);
        if (next === null) return null;         // mutate hat abgebrochen (z. B. Raum voll)
        await this._write(next);
        const check = await this._read();
        if (check && verify(check)) { this.state = check; return check; }
      } catch (e) { /* nächster Versuch */ }
      await new Promise(r => setTimeout(r, 300 + Math.random() * 1200));
    }
    throw new Error("merge failed");
  },

  _me(extra) {
    return Object.assign({ g: this.gid, n: myName || "Anonym", s: 0, x: 100, c: 0, f: 0, a: 0, b: Date.now() }, extra || {});
  },

  _upsertSelf(st, patch) {
    const players = (st && Array.isArray(st.players)) ? st.players.slice() : [];
    const idx = players.findIndex(p => p.g === this.gid);
    const base = idx >= 0 ? players[idx] : this._me();
    const mine = Object.assign({}, base, patch || {}, { b: Date.now(), n: myName || base.n });
    if (idx >= 0) players[idx] = mine; else players.push(mine);
    return players;
  },

  /* ---------- Host: Klassenraum erstellen ---------- */
  async create(cfg) {
    this.close();
    this.code = randomRoomCode();
    this.gid = Math.random().toString(36).slice(2, 10);
    this.isHost = true;
    const fresh = {
      v: 2, created: Date.now(), host: this.gid,
      started: 0, seed: 0, cfg: cfg || {},
      players: [this._me()],
    };
    try {
      await this._write(fresh);
      this.state = fresh;
    } catch (e) {
      this.close();
      if (this.onFailed) this.onFailed("Der Spielserver ist nicht erreichbar. Internet prüfen und erneut versuchen.");
      return false;
    }
    this._startPolling();
    return true;
  },

  /* ---------- Beitreten ---------- */
  async join(code) {
    this.close();
    this.code = code;
    this.gid = Math.random().toString(36).slice(2, 10);
    this.isHost = false;
    try {
      const st = await this._read();
      if (!st || st.v !== 2 || !st.created || Date.now() - st.created > this.ROOM_FRESH_MS) {
        this.close();
        if (this.onFailed) this.onFailed("Kein offener Klassenraum mit diesem Code gefunden. Tippfehler?");
        return false;
      }
      if (st.started) {
        this.close();
        if (this.onFailed) this.onFailed("Diese Runde ist schon gestartet. Fragt den Host nach einem neuen Raum.");
        return false;
      }
      if ((st.players || []).length >= this.MAX_PLAYERS) {
        this.close();
        if (this.onFailed) this.onFailed("Der Raum ist voll (max. " + this.MAX_PLAYERS + " Spieler:innen).");
        return false;
      }
      await this._merge(
        (cur) => {
          if (!cur || cur.started) return null;
          if ((cur.players || []).length >= this.MAX_PLAYERS) return null;
          return Object.assign({}, cur, { players: this._upsertSelf(cur) });
        },
        (check) => (check.players || []).some(p => p.g === this.gid)
      );
    } catch (e) {
      this.close();
      if (this.onFailed) this.onFailed("Beitritt fehlgeschlagen – bitte erneut versuchen.");
      return false;
    }
    this._startPolling();
    return true;
  },

  /* ---------- Host startet die Runde ---------- */
  async start(seed) {
    if (!this.isHost) return;
    await this._merge(
      (cur) => cur ? Object.assign({}, cur, { started: 1, seed, players: this._upsertSelf(cur) }) : null,
      (check) => check.started === 1
    );
  },

  /* ---------- Eigenen Fortschritt melden (Punkte, Index, Fall-Nr, fertig) ---------- */
  reportSelf(patch) {
    // bewusst ohne await: Feuer-und-vergiss mit interner Wiederholung
    this._merge(
      (cur) => cur ? Object.assign({}, cur, { players: this._upsertSelf(cur, patch) }) : null,
      (check) => {
        const mine = (check.players || []).find(p => p.g === this.gid);
        return !!mine && (patch.f ? mine.f === 1 : true);
      }
    ).catch(() => {});
  },

  /* ---------- Polling ---------- */
  _startPolling() {
    clearInterval(this._pollTimer);
    this._pollFails = 0;
    this._pollTimer = setInterval(() => this._poll(), this.POLL_MS + Math.random() * 600);
    this._poll();
  },

  async _poll() {
    if (this._inFlight || !this.code) return;
    this._inFlight = true;
    try {
      const st = await this._read();
      this._pollFails = 0;
      if (st && st.v === 2) {
        this.state = st;
        if (this.onUpdate) this.onUpdate(st);
      }
    } catch (e) {
      if (++this._pollFails >= 8 && this.onLost) { this.onLost("Der Spielserver ist nicht mehr erreichbar."); this.close(); }
    } finally {
      this._inFlight = false;
    }
  },

  leader() {
    if (!this.state || !Array.isArray(this.state.players)) return null;
    const others = this.state.players.filter(p => !p.l);
    if (!others.length) return null;
    return others.slice().sort((a, b) => (b.s || 0) - (a.s || 0))[0];
  },

  close() {
    clearInterval(this._pollTimer);
    this._pollTimer = null;
    this.code = null; this.state = null; this.isHost = false;
    this._inFlight = false; this._pollFails = 0;
  },
};

/* Tab kommt aus dem Hintergrund zurück -> sofort neu synchronisieren
   (Browser drosseln Timer in Hintergrund-Tabs massiv) */
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && ClassNet.code) ClassNet._poll();
});
