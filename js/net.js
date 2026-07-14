"use strict";
/* =========================================================================
   Netzwerk-Schicht für das Online-Duell – HTTP-Relay statt WebRTC.

   Warum: WebRTC-Direktverbindungen scheitern in Schul-WLANs und Mobilnetzen
   regelmäßig an Firewalls/NAT. Dieses System nutzt stattdessen denselben
   kostenlosen Key-Value-Speicher wie die globale Rangliste (textdb.online):

   Jeder Raum hat zwei "Postfächer" (Host->Gast und Gast->Host). Jede Seite
   schreibt ausschließlich in ihr eigenes Postfach und liest das des Gegners
   im Sekundentakt. Reines HTTPS -> funktioniert überall, wo die Website lädt.

   Öffentliche API (unverändert zu vorher):
     createRoom(), joinRoom(code), send(type, payload), close()
     Callbacks: onRoomReady, onConnected, onMessage, onDropped, onJoinFailed, onStatus
   ========================================================================= */

const Net = {
  isHost: false,
  active: false,        // Gegner verbunden, Duell läuft

  // Callbacks – werden von game.js gesetzt
  onRoomReady: null,    // (code)   Host: Raum offen, Code anzeigen
  onConnected: null,    // ()       Gegenstelle gefunden (beide Seiten)
  onMessage: null,      // (msg)    eingehende Duell-Nachricht
  onDropped: null,      // (reason) Verbindung verloren
  onJoinFailed: null,   // (reason) Beitritt gescheitert (falscher Code etc.)
  onStatus: null,       // (text)   Fortschritts-Feedback für die Lobby

  _BASE: "https://textdb.online/",
  _POLL_MS: 1800,       // Lese-Intervall Gegner-Postfach
  _BEAT_MS: 5000,       // eigenes Lebenszeichen spätestens alle 5 s
  // Großzügig, weil Browser Hintergrund-Tabs auf ~1 Timer/Minute drosseln
  // (kurz die App wechseln darf das Duell nicht beenden). Absichtliches
  // Verlassen meldet das "bye"-Signal ohnehin sofort.
  _STALE_MS: 90000,     // Gegner-Lebenszeichen älter -> Verbindung verloren
  _ROOM_FRESH_MS: 15 * 60 * 1000,   // Raum gilt max. 15 Min als "offen"

  _code: null, _gid: null, _partner: null,
  _seq: 0, _lastSeen: 0,
  _outbox: [],
  _pollTimer: null, _beatTimer: null, _inFlight: false,
  _lastRemoteBeat: null, _lastRemoteChange: 0, _pollFails: 0,
  _joinDeadline: null,

  _key(side) { return "wahlwaechter_room_" + this._code.toLowerCase() + "_" + side; },
  _myKey()   { return this._key(this.isHost ? "h" : "g"); },
  _oppKey()  { return this._key(this.isHost ? "g" : "h"); },

  _status(text) { if (this.onStatus) this.onStatus(text); },

  async _read(key) {
    const res = await fetch(this._BASE + key + "?t=" + Date.now());
    if (!res.ok) throw new Error("HTTP " + res.status);
    const text = await res.text();
    if (!text.trim()) return null;
    try { return JSON.parse(text); } catch (e) { return null; }
  },

  async _write(key, state) {
    const url = this._BASE + "update/?key=" + key + "&value=" + encodeURIComponent(JSON.stringify(state));
    const res = await fetch(url);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const j = await res.json();
    if (j.status !== 1) throw new Error("write rejected");
  },

  _myState(extra) {
    return Object.assign({
      v: 1, beat: Date.now(), bye: false,
      partner: this._partner, created: this._created,
      msgs: this._outbox,
    }, extra || {});
  },

  async _flush(extra) {
    try { await this._write(this._myKey(), this._myState(extra)); }
    catch (e) { /* nächster Beat/Flush versucht es erneut */ }
  },

  /* ---------- Host: Raum erstellen ---------- */
  async createRoom() {
    this.close();
    this.isHost = true;
    this._code = randomRoomCode();
    this._gid = Math.random().toString(36).slice(2, 10);
    this._created = Date.now();
    this._status("Verbinde mit Spielserver…");
    try {
      // Beide Postfächer frisch anlegen (alte Reste desselben Codes löschen)
      await this._write(this._key("g"), { v: 1, beat: 0, bye: false, partner: null, created: 0, msgs: [] });
      await this._flush();
    } catch (e) {
      this.close();
      if (this.onJoinFailed) this.onJoinFailed("Der Spielserver ist nicht erreichbar. Internetverbindung prüfen und erneut versuchen.");
      return;
    }
    if (this.onRoomReady) this.onRoomReady(this._code);
    this._startLoops();
  },

  /* ---------- Gast: Raum beitreten ---------- */
  async joinRoom(code) {
    this.close();
    this.isHost = false;
    this._code = code;
    this._gid = Math.random().toString(36).slice(2, 10);
    this._created = Date.now();
    this._status("Suche Raum " + code.toUpperCase() + "…");

    let host;
    try { host = await this._read(this._oppKey()); }
    catch (e) {
      this.close();
      if (this.onJoinFailed) this.onJoinFailed("Der Spielserver ist nicht erreichbar. Internetverbindung prüfen und erneut versuchen.");
      return;
    }
    if (!host || host.v !== 1 || !host.created || Date.now() - host.created > this._ROOM_FRESH_MS || host.bye) {
      this.close();
      if (this.onJoinFailed) this.onJoinFailed("Kein offener Raum mit diesem Code gefunden. Tippfehler? (Der Code ist 5 Zeichen lang und nur ca. 15 Minuten gültig.)");
      return;
    }
    if (host.partner) {
      this.close();
      if (this.onJoinFailed) this.onJoinFailed("In diesem Raum spielt schon jemand. Erstellt einen neuen Raum.");
      return;
    }

    try { await this._flush(); }
    catch (e) {
      this.close();
      if (this.onJoinFailed) this.onJoinFailed("Der Spielserver ist nicht erreichbar. Bitte erneut versuchen.");
      return;
    }

    this._status("Raum gefunden – melde dich an…");
    if (this.onConnected) this.onConnected();   // game.js sendet jetzt "hello"

    // Wenn der Host nicht binnen 25 s antwortet: abbrechen
    this._joinDeadline = setTimeout(() => {
      if (!this.active) {
        this.close();
        if (this.onJoinFailed) this.onJoinFailed("Der Raum antwortet nicht. Ist das Duell dort schon gestartet? Erstellt einen neuen Raum.");
      }
    }, 25000);

    this._startLoops();
  },

  /* ---------- Nachrichten senden ---------- */
  send(type, payload) {
    if (!this._code) return;
    const msg = Object.assign({ q: ++this._seq, gid: this._gid, type }, payload || {});
    this._outbox.push(msg);
    this._flush();
  },

  /* ---------- Poll- & Lebenszeichen-Schleifen ---------- */
  _startLoops() {
    clearInterval(this._pollTimer);
    clearInterval(this._beatTimer);
    this._lastRemoteBeat = null;
    this._lastRemoteChange = Date.now();
    this._pollFails = 0;
    this._pollTimer = setInterval(() => this._poll(), this._POLL_MS);
    this._beatTimer = setInterval(() => this._flush(), this._BEAT_MS);
    this._poll();
  },

  async _poll() {
    if (this._inFlight || !this._code) return;
    this._inFlight = true;
    try {
      const other = await this._read(this._oppKey());
      this._pollFails = 0;
      if (other && other.v === 1) this._handleRemote(other);
    } catch (e) {
      if (++this._pollFails >= 6) this._drop("Der Spielserver ist nicht mehr erreichbar.");
    } finally {
      this._inFlight = false;
    }
  },

  _handleRemote(other) {
    // Lebenszeichen verfolgen (eigene Uhr, daher nur Änderungen zählen)
    if (other.beat !== this._lastRemoteBeat) {
      this._lastRemoteBeat = other.beat;
      this._lastRemoteChange = Date.now();
    }
    if (this.active && other.bye) return this._drop("Der Gegner hat das Duell verlassen.");
    if (this.active && Date.now() - this._lastRemoteChange > this._STALE_MS) {
      return this._drop("Der Gegner antwortet nicht mehr.");
    }

    // Gast: Prüfen, ob der Host einen anderen Partner angenommen hat
    if (!this.isHost && other.partner && other.partner !== this._gid) {
      this.close();
      if (this.onJoinFailed) this.onJoinFailed("In diesem Raum spielt schon jemand anderes.");
      return;
    }

    const msgs = Array.isArray(other.msgs) ? other.msgs : [];
    for (const m of msgs) {
      if (!m || typeof m.q !== "number" || m.q <= this._lastSeen) continue;
      // Host nimmt nur Nachrichten des ersten Gasts an
      if (this.isHost) {
        if (!this._partner) { this._partner = m.gid; this._flush(); }
        if (m.gid !== this._partner) continue;
      }
      this._lastSeen = m.q;
      if (!this.active) {
        this.active = true;
        clearTimeout(this._joinDeadline);
        if (this.isHost && this.onConnected) this.onConnected();
      }
      if (this.onMessage) this.onMessage(m);
    }
  },

  _drop(reason) {
    if (!this.active) return;
    this._stopLoops();
    this.active = false;
    if (this.onDropped) this.onDropped(reason);
  },

  _stopLoops() {
    clearInterval(this._pollTimer); this._pollTimer = null;
    clearInterval(this._beatTimer); this._beatTimer = null;
    clearTimeout(this._joinDeadline); this._joinDeadline = null;
  },

  close() {
    this._stopLoops();
    this._sayBye();
    this.active = false;
    this._code = null; this._partner = null;
    this._seq = 0; this._lastSeen = 0;
    this._outbox = [];
    this._inFlight = false; this._pollFails = 0;
    this._lastRemoteBeat = null;
  },

  _sayBye() {
    if (!this._code) return;
    // Bestes Bemühen: dem Gegner "tschüss" sagen (keepalive überlebt das Schließen der Seite)
    const url = this._BASE + "update/?key=" + this._myKey() +
      "&value=" + encodeURIComponent(JSON.stringify(this._myState({ bye: true })));
    try { fetch(url, { keepalive: true }); } catch (e) {}
  },
};

/* Seite wird geschlossen/verlassen -> Gegner sofort informieren */
window.addEventListener("pagehide", () => { if (Net.active) Net._sayBye(); });

/* Tab kommt aus dem Hintergrund zurück -> sofort neu synchronisieren */
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && Net._code) { Net._poll(); Net._flush(); }
});
