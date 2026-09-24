/* =========================================================================
   TEST-SPEICHER für Prüfungen im Browser.

   Die Schlüssel auf textdb.online enthalten echte Spielstände. Wer im
   Browser durchspielt, ohne das hier vorher einzufügen, schreibt seinen
   Testlauf in die echte Rangliste und in die echten Profile.

   Verwendung: Spiel lokal öffnen (python -m http.server 8123), Seite laden,
   dann diesen ganzen Text in die Browser-Konsole einfügen – BEVOR ein Spiel,
   ein Duell oder ein Klassenraum betreten wird. Nach jedem Neuladen erneut.

   Gespeichert wird im localStorage der Test-Adresse (Präfix "mock_tdb_").
   Mehrere Tabs derselben Adresse teilen ihn – so lassen sich Duell und
   Klassenraum mit zwei oder drei Tabs durchspielen. Die doppelte
   Dekodierung des echten Dienstes ist nachgebildet, damit "+" und "%"
   hier genauso auffallen wie dort.

   Aufräumen: Object.keys(localStorage).filter(k => k.startsWith("mock_tdb_"))
              .forEach(k => localStorage.removeItem(k))
   ========================================================================= */
(() => {
  if (window.__testSpeicher) return "Test-Speicher war schon aktiv";
  const echtesFetch = window.fetch.bind(window);
  window.fetch = async (eingabe, optionen) => {
    const url = String(typeof eingabe === "string" ? eingabe : eingabe.url);
    if (!url.startsWith("https://textdb.online/")) return echtesFetch(eingabe, optionen);
    const u = new URL(url);
    if (u.pathname === "/update/") {
      const key = u.searchParams.get("key");
      let wert = u.searchParams.get("value");
      try { wert = decodeURIComponent(wert.replace(/\+/g, " ")); }
      catch (e) { return new Response('{"status":0}'); }   // so verwirft der Dienst kaputte Werte
      localStorage.setItem("mock_tdb_" + key, wert);
      return new Response('{"status":1}', { headers: { "content-type": "application/json" } });
    }
    return new Response(localStorage.getItem("mock_tdb_" + u.pathname.slice(1)) || "");
  };
  window.__testSpeicher = true;
  return "Test-Speicher aktiv – textdb.online wird nicht mehr angesprochen";
})();
