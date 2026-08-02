/* =========================================================================
   Screenshots für ANLEITUNG.pdf aus dem laufenden Spiel aufnehmen.

   Bewusst aus dem echten Spiel und nicht nachgebaut: So kann das Handout
   nicht veralten, ohne dass es auffällt – wer die Oberfläche ändert und die
   Bilder neu erzeugt, sieht den Unterschied sofort.

   Aufruf (Server muss laufen: python -m http.server 8123):
     node tools/shots.mjs [port]
   Ergebnis: tools/shots/*.png  ->  danach tools/handout.py ausführen.
   ========================================================================= */
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const PORT = process.argv[2] || 8123;
const OUT = join(dirname(fileURLToPath(import.meta.url)), "shots");
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 900, height: 1400 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();

/* Kein echtes Netz: textdb wird durch einen Speicher im Test ersetzt */
const store = new Map();
await ctx.route("**textdb.online**", async route => {
  const url = new URL(route.request().url());
  if (url.pathname.startsWith("/update")) {
    store.set(url.searchParams.get("key"), url.searchParams.get("value"));
    return route.fulfill({ status: 200, contentType: "application/json", body: '{"status":1}' });
  }
  return route.fulfill({ status: 200, contentType: "text/plain",
    body: store.get(decodeURIComponent(url.pathname.replace(/^\//, ""))) || "" });
});

await page.addInitScript(() => {
  localStorage.setItem("ww_tut_v1", '{"done":1}');
  localStorage.setItem("ww_name", "Agent Nova");
});
await page.goto(`http://localhost:${PORT}/index.html`);
await page.waitForTimeout(400);

const shot = async (name, sel) => {
  await page.waitForTimeout(650);                    // Animationen auslaufen lassen
  const el = sel ? await page.locator(sel).first() : null;
  await (el || page).screenshot({ path: join(OUT, name + ".png") });
  console.log("  ✓", name);
};

console.log("Screenshots:");

/* 1 · Startbildschirm */
await page.fill("#player-name", "Agent Nova");
await shot("start", ".start-wrap");

/* 2 · Fall-Ansicht mit zwei benutzten Werkzeugen */
await page.click("#btn-solo");
await page.click("#btn-mode-classic");
await page.click("#btn-week-start");
await page.waitForTimeout(400);
const tools = page.locator("#tool-buttons .tool-btn:not([disabled])");
await tools.nth(0).click();
await tools.nth(1).click();
await shot("fall", "#screen-case");
await shot("werkzeuge", ".toolbox");

/* 3 · Auflösung */
await page.click("#btn-flag");
await shot("aufloesung", "#reveal-card");
await page.click("#btn-reveal-next");

/* 4 · Dilemma – bis zum Wochenende durchspielen. Dabei richtig antworten
   (Wahrheit aus dem Spielzustand lesen), sonst endet der Lauf vorher in
   der Vertrauenskrise und der Dilemma-Screen kommt nie. */
for (let i = 0; i < 80; i++) {
  const s = await page.evaluate(() => {
    const offen = id => { const el = document.getElementById(id);
      return !el.classList.contains("hidden") && !el.classList.contains("closing"); };
    const c = (typeof G !== "undefined" && G && G.deck[G.secIdx]) ? G.deck[G.secIdx][G.caseIdx] : null;
    return { id: (document.querySelector(".screen.active") || {}).id, rev: offen("overlay-reveal"), fake: c ? !!c.isFake : null };
  });
  if (s.id === "screen-dilemma") break;
  if (s.rev) { await page.click("#btn-reveal-next"); continue; }
  if (s.id === "screen-week") { await page.click("#btn-week-start"); continue; }
  if (s.id === "screen-case") { await page.click(s.fake ? "#btn-flag" : "#btn-approve"); continue; }
  await page.waitForTimeout(200);
}
await shot("dilemma", "#dilemma-grid");

/* 5 · Fake-Werkstatt und Jagd (direkt aufrufen, spart das ganze Spiel) */
await page.evaluate(() => { G.duel = { oppName: "Gegner", cfg: {} }; G.mode = "duel"; startBuildPhase(); });
await page.waitForTimeout(400);
await page.locator("#build-themes .build-card").nth(1).click();
await page.locator("#build-formats .build-card").nth(0).click();
await page.locator("#build-cloaks .build-card:not([disabled]):not(.selected)").first().click();
await shot("werkstatt", "#screen-build .panel");

await page.evaluate(() => {
  const spec = randomBuild(mulberry32(4711));
  startHunt(craftFake(spec), "SHOWDOWN", "Einer dieser vier Beiträge ist der maßgeschneiderte Fake.");
});
await page.waitForTimeout(500);
await shot("jagd", "#hunt-feed");

/* 6 · Lobbys */
await page.evaluate(() => { stopTimer(); goBack("screen-start"); });
await page.click("#btn-class");
await page.click("#btn-class-create");
await page.waitForSelector("#screen-class-lobby.active");
await page.waitForTimeout(900);
await shot("lobby", "#screen-class-lobby .panel");

/* 7 · Einweisung */
await page.evaluate(() => { ClassNet.close(); goBack("screen-start"); });
await page.click("#btn-tutorial");
await page.waitForTimeout(500);
await page.evaluate(() => { Tutorial.idx = 2; Tutorial.stepDone[2] = true; Tutorial.render(); });
await shot("einweisung", "#screen-tutorial .panel");

/* 8 · Rangliste */
await page.evaluate(() => { Tutorial.skip(); });
await page.waitForTimeout(300);
await page.click("#btn-board");
await page.waitForTimeout(1200);
await shot("rangliste", "#screen-board .panel");

await browser.close();
console.log("Fertig – Bilder liegen in tools/shots/");
