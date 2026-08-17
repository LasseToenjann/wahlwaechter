"use strict";
/* =========================================================================
   SPEICHERDIENST – eine gemeinsame Schicht für alles, was auf
   textdb.online liegt: Rangliste, Profile, Duell-Postfächer, Klassenraum.

   Vorher hatte jede der drei Stellen ihre eigene Kopie von Lesen und
   Schreiben – mit denselben zwei Fehlern.

   ---------------------------------------------------------------------
   FEHLER 1: Der Dienst dekodiert zweimal.

   textdb.online dekodiert den übergebenen Wert zwei Mal und macht dabei im
   zweiten Durchgang aus jedem "+" ein Leerzeichen. Nachgemessen:

       gesendet          kommt an
       A+B               A B
       %2B               +
       e+27              e 27
       & # / = ~         unverändert

   Ein Name mit "%" darin wird beim zweiten Durchgang als Prozent-Code
   gelesen: aus "%22" wird ein Anführungszeichen – und das zerreißt das
   gespeicherte JSON. Große Zahlen schreibt JSON.stringify als "1e+27",
   daraus wird "1e 27". In beiden Fällen ist der gespeicherte Text danach
   unlesbar.

   Regel: Was hier hinausgeht, enthält weder "+" noch "%".

   ---------------------------------------------------------------------
   FEHLER 2: Unlesbar wurde als leer behandelt.

   Die alten Lesefunktionen gaben bei einem Lesefehler null zurück. Die
   Aufrufer machten daraus eine leere Liste, ergänzten den eigenen Eintrag
   und schrieben zurück – womit ein einziger verstümmelter Eintrag die
   ganze Klassenrangliste löschte.

   Hier gilt: null heißt ausschließlich "Schlüssel ist leer". Alles, was
   sich nicht lesen lässt, wirft einen Fehler. Die Aufrufer versuchen es
   erneut oder brechen ab – aber sie überschreiben nichts.
   ========================================================================= */

const TDB = {
  BASE: "https://textdb.online/",
  TIMEOUT_MS: 8000,

  /* ---------- Hinausgehende Daten entschärfen ---------- */

  /** Entfernt die beiden Zeichen, an denen sich der Dienst verschluckt.
      "+" wird zum Leerzeichen – genau das täte der Dienst ohnehin, nur
      machen wir es hier vorhersehbar. "%" fällt weg. */
  sauber(text) {
    return String(text).replace(/\+/g, " ").replace(/%/g, "")
      .replace(/[ \t]{2,}/g, " ");
  },

  /** JSON, das den Weg durch den Dienst unbeschadet übersteht.
      Der Ersetzer greift jede Zeichenkette ab; das abschließende
      e+ -> e betrifft die Exponenten großer Zahlen und bleibt gültiges
      JSON (das Vorzeichen ist dort optional). */
  baueWert(obj) {
    const wert = JSON.stringify(obj, (k, v) => (typeof v === "string" ? TDB.sauber(v) : v));
    return String(wert).replace(/e\+/g, "e");
  },

  /* ---------- Hereinkommende Daten ---------- */

  /** Liest den Text und repariert dabei den Schaden früherer Fassungen:
      "1e 27" wird wieder zu "1e+27". Ohne das bleibt die ganze Liste
      unlesbar, sobald ein einziger Eintrag betroffen ist.
      Rückgabe undefined heißt: nicht zu retten. */
  deute(text) {
    try { return JSON.parse(text); } catch (e) { /* weiter unten */ }
    try { return JSON.parse(text.replace(/e (-?\d)/g, "e+$1")); } catch (e) { /* weiter unten */ }
    return undefined;
  },

  /* ---------- Lesen und Schreiben ---------- */

  /** null = Schlüssel ist leer. Alles andere ist entweder gültig oder wirft. */
  async lies(key) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), this.TIMEOUT_MS);
    try {
      const res = await fetch(this.BASE + key + "?t=" + Date.now(),
        { signal: ctrl.signal, cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const text = await res.text();
      if (!text.trim()) return null;
      const daten = this.deute(text);
      if (daten === undefined) throw new Error("Inhalt von " + key + " ist unlesbar");
      return daten;
    } finally { clearTimeout(t); }
  },

  async schreib(key, obj) {
    const wert = this.baueWert(obj);
    if (/[%+]/.test(wert)) throw new Error("Datensatz enthält verbotene Zeichen");
    if (wert.length > 7000) console.warn("TDB: großer Datensatz", key, wert.length, "Zeichen");
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), this.TIMEOUT_MS);
    try {
      const res = await fetch(this.BASE + "update/?key=" + key + "&value=" + encodeURIComponent(wert),
        { signal: ctrl.signal });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const j = await res.json();
      if (j.status !== 1) throw new Error("write rejected");
    } finally { clearTimeout(t); }
  },
};
