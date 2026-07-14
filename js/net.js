"use strict";
/* =========================================================================
   Netzwerk-Schicht für das Online-Duell.
   WebRTC-Peer-to-Peer via PeerJS: Der kostenlose öffentliche Broker
   (0.peerjs.com) vermittelt nur den Verbindungsaufbau – danach läuft
   alles direkt Browser-zu-Browser (bzw. über ein kostenloses TURN-Relay,
   wenn Firewalls/Router eine direkte Verbindung verhindern – typisch
   in Schul-WLANs und Mobilfunknetzen).

   Nachrichten: { type: "hello"|"start"|"progress"|"sabotage"|"huntResult"|"final"|"ping", ... }
   ========================================================================= */

const Net = {
  peer: null,
  conn: null,
  isHost: false,
  active: false,        // Duell läuft (Verbindung steht)
  _heartbeat: null,

  // Callbacks – werden von game.js gesetzt
  onRoomReady: null,    // (code)          Host: Raum offen, Code anzeigen
  onConnected: null,    // ()              Verbindung steht (beide Seiten)
  onMessage: null,      // (msg)           eingehende Duell-Nachricht
  onDropped: null,      // (reason)        Verbindung verloren / fehlgeschlagen
  onJoinFailed: null,   // (reason)        Beitritt gescheitert (falscher Code etc.)
  onStatus: null,       // (text)          Fortschritts-Feedback für die Lobby

  _peerId(code) { return "wahlwaechter-" + code.toUpperCase(); },

  _newPeer(id) {
    // Ohne Host-Angabe nutzt PeerJS die kostenlose PeerJS-Cloud als Vermittler.
    // Zusätzliche STUN/TURN-Server erhöhen die Erfolgsquote hinter strengen
    // Firewalls massiv (TURN: Open-Relay-Projekt, kostenlos).
    return new Peer(id, {
      debug: 1,
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          {
            urls: [
              "turn:openrelay.metered.ca:80",
              "turn:openrelay.metered.ca:443",
              "turn:openrelay.metered.ca:443?transport=tcp",
            ],
            username: "openrelayproject",
            credential: "openrelayproject",
          },
        ],
      },
    });
  },

  _status(text) { if (this.onStatus) this.onStatus(text); },

  /* ---------- Host: Raum erstellen ---------- */
  createRoom() {
    this.close();
    this.isHost = true;
    const code = randomRoomCode();
    this._status("Verbinde mit Vermittlungsserver…");
    const peer = this._newPeer(this._peerId(code));
    this.peer = peer;

    const bootTimer = setTimeout(() => {
      if (!this.active && peer === this.peer && (!peer.open)) {
        this.close();
        if (this.onJoinFailed) this.onJoinFailed("Der Vermittlungsserver antwortet nicht. Internet prüfen (Schul-WLAN blockiert manchmal – Handy-Hotspot probieren) und erneut versuchen.");
      }
    }, 15000);

    peer.on("open", () => {
      clearTimeout(bootTimer);
      if (this.onRoomReady) this.onRoomReady(code);
    });

    peer.on("connection", (conn) => {
      if (this.conn) { conn.close(); return; }  // nur 1 Gegner
      this._status("Gegner gefunden – baue Direktverbindung auf…");
      this._wireConnection(conn);
    });

    peer.on("error", (err) => {
      clearTimeout(bootTimer);
      if (err.type === "unavailable-id") {
        this.createRoom();  // Code-Kollision (extrem selten): neuer Versuch
      } else if (!this.active) {
        this.close();
        if (this.onJoinFailed) this.onJoinFailed(this._errText(err));
      } else {
        this._drop(this._errText(err));
      }
    });

    peer.on("disconnected", () => {
      // Verbindung zum Broker weg – bestehende P2P-Verbindung läuft weiter.
      if (!this.active && peer === this.peer) peer.reconnect();
    });
  },

  /* ---------- Gast: Raum beitreten ---------- */
  joinRoom(code) {
    this.close();
    this.isHost = false;
    this._status("Verbinde mit Vermittlungsserver…");
    const peer = this._newPeer(null); // zufällige eigene ID
    this.peer = peer;

    let joined = false;
    const failTimer = setTimeout(() => {
      if (!joined) {
        this.close();
        if (this.onJoinFailed) this.onJoinFailed("Keine Verbindung möglich. Code prüfen – oder ist das Duell schon gestartet? (In strengen Netzen hilft oft ein Handy-Hotspot.)");
      }
    }, 20000);

    peer.on("open", () => {
      this._status("Suche Raum " + code.toUpperCase() + "…");
      const conn = peer.connect(this._peerId(code), { reliable: true });
      conn.on("open", () => { joined = true; clearTimeout(failTimer); });
      this._wireConnection(conn);
    });

    peer.on("error", (err) => {
      clearTimeout(failTimer);
      if (!joined) {
        this.close();
        if (this.onJoinFailed) this.onJoinFailed(this._errText(err));
      } else {
        this._drop(this._errText(err));
      }
    });
  },

  _wireConnection(conn) {
    this.conn = conn;
    conn.on("open", () => {
      this.active = true;
      // Heartbeat hält NAT/Firewall-Zuordnungen während langer Spielphasen offen
      clearInterval(this._heartbeat);
      this._heartbeat = setInterval(() => this.send("ping"), 10000);
      if (this.onConnected) this.onConnected();
    });
    conn.on("data", (data) => {
      if (data && typeof data === "object" && data.type !== "ping" && this.onMessage) this.onMessage(data);
    });
    conn.on("close", () => this._drop("Der Gegner hat die Verbindung getrennt."));
    conn.on("error", () => this._drop("Verbindungsfehler."));
  },

  _drop(reason) {
    clearInterval(this._heartbeat);
    if (!this.active) return;
    this.active = false;
    if (this.onDropped) this.onDropped(reason);
  },

  _errText(err) {
    switch (err && err.type) {
      case "peer-unavailable": return "Kein Raum mit diesem Code gefunden. Tippfehler? Oder wurde der Raum geschlossen?";
      case "network":          return "Keine Verbindung zum Vermittlungsserver. Internet/Firewall prüfen – in Schulnetzen hilft oft ein Handy-Hotspot.";
      case "browser-incompatible": return "Dieser Browser unterstützt kein WebRTC.";
      default: return "Netzwerkfehler (" + ((err && err.type) || "unbekannt") + "). Bitte erneut versuchen.";
    }
  },

  send(type, payload) {
    if (this.conn && this.conn.open) {
      this.conn.send(Object.assign({ type }, payload || {}));
    }
  },

  close() {
    clearInterval(this._heartbeat);
    this.active = false;
    if (this.conn) { try { this.conn.close(); } catch (e) {} this.conn = null; }
    if (this.peer) { try { this.peer.destroy(); } catch (e) {} this.peer = null; }
  },
};
