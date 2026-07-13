"use strict";
/* =========================================================================
   Netzwerk-Schicht für das Online-Duell.
   WebRTC-Peer-to-Peer via PeerJS: Der kostenlose öffentliche Broker
   (0.peerjs.com) vermittelt nur den Verbindungsaufbau – danach läuft
   alles direkt Browser-zu-Browser. Kein eigener Server, keine Kosten.

   Nachrichten: { type: "hello"|"start"|"progress"|"sabotage"|"huntResult"|"final", ... }
   ========================================================================= */

const Net = {
  peer: null,
  conn: null,
  isHost: false,
  active: false,        // Duell läuft (Verbindung steht)

  // Callbacks – werden von game.js gesetzt
  onRoomReady: null,    // (code)          Host: Raum offen, Code anzeigen
  onConnected: null,    // ()              Verbindung steht (beide Seiten)
  onMessage: null,      // (msg)           eingehende Duell-Nachricht
  onDropped: null,      // (reason)        Verbindung verloren / fehlgeschlagen
  onJoinFailed: null,   // (reason)        Beitritt gescheitert (falscher Code etc.)

  _peerId(code) { return "wahlwaechter-" + code.toUpperCase(); },

  _newPeer(id) {
    // Ohne Host-Angabe nutzt PeerJS automatisch die kostenlose PeerJS-Cloud.
    return new Peer(id, { debug: 1 });
  },

  /* ---------- Host: Raum erstellen ---------- */
  createRoom() {
    this.close();
    this.isHost = true;
    const code = randomRoomCode();
    const peer = this._newPeer(this._peerId(code));
    this.peer = peer;

    peer.on("open", () => {
      if (this.onRoomReady) this.onRoomReady(code);
    });

    peer.on("connection", (conn) => {
      if (this.conn) { conn.close(); return; }  // nur 1 Gegner
      this._wireConnection(conn);
    });

    peer.on("error", (err) => {
      if (err.type === "unavailable-id") {
        // Code kollidiert (extrem selten) -> neuen Raum versuchen
        this.createRoom();
      } else if (!this.active) {
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
    const peer = this._newPeer(null); // zufällige eigene ID
    this.peer = peer;

    let joined = false;
    const failTimer = setTimeout(() => {
      if (!joined) {
        this.close();
        if (this.onJoinFailed) this.onJoinFailed("Kein Raum mit diesem Code gefunden. Code prüfen – oder ist das Duell schon gestartet?");
      }
    }, 12000);

    peer.on("open", () => {
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
      if (this.onConnected) this.onConnected();
    });
    conn.on("data", (data) => {
      if (data && typeof data === "object" && this.onMessage) this.onMessage(data);
    });
    conn.on("close", () => this._drop("Der Gegner hat die Verbindung getrennt."));
    conn.on("error", () => this._drop("Verbindungsfehler."));
  },

  _drop(reason) {
    if (!this.active) return;
    this.active = false;
    if (this.onDropped) this.onDropped(reason);
  },

  _errText(err) {
    switch (err && err.type) {
      case "peer-unavailable": return "Kein Raum mit diesem Code gefunden.";
      case "network":          return "Keine Verbindung zum Vermittlungsserver. Internet/Firewall prüfen.";
      case "browser-incompatible": return "Dieser Browser unterstützt kein WebRTC.";
      default: return "Netzwerkfehler (" + ((err && err.type) || "unbekannt") + ").";
    }
  },

  send(type, payload) {
    if (this.conn && this.conn.open) {
      this.conn.send(Object.assign({ type }, payload || {}));
    }
  },

  close() {
    this.active = false;
    if (this.conn) { try { this.conn.close(); } catch (e) {} this.conn = null; }
    if (this.peer) { try { this.peer.destroy(); } catch (e) {} this.peer = null; }
  },
};
