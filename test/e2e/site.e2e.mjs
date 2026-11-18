// Browser checks for the 2D site. Run against a production build:
//   npm run build; npm run start -- -p 3111; node test/e2e/site.e2e.mjs
import { launch, connect, shutdown } from "./cdp.mjs";

const BASE = "http://localhost:3111";
const results = [];
const check = async (name, fn) => {
  try {
    const detail = await fn();
    results.push(true);
    console.log(`PASS ${name}${detail ? ` (${detail})` : ""}`);
  } catch (e) {
    results.push(false);
    console.log(`FAIL ${name}: ${e.message}`);
  }
};
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const centerOf = (sel) => `(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return null;
  el.scrollIntoView({ block: "center", behavior: "instant" }); const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`;
const nasaOpen = `!!document.querySelector("dialog[open] #nasa-title")`;
const bobOpen = `!!document.querySelector('[role="dialog"][aria-label="Bob The Tech Guy case file"]')`;
const overflow = `document.documentElement.scrollWidth - document.documentElement.clientWidth`;

const edge = await launch();
let page;

try {
  page = await connect(edge.wsUrl);
  const key = async (k, code, vk, modifiers = 0) => {
    await page.send("Input.dispatchKeyEvent", { type: "rawKeyDown", key: k, code, windowsVirtualKeyCode: vk, modifiers });
    await page.send("Input.dispatchKeyEvent", { type: "keyUp", key: k, code, windowsVirtualKeyCode: vk, modifiers });
  };
  const click = async (sel) => {
    const p = await page.evaluate(centerOf(sel));
    assert(p, `${sel} not found`);
    await sleep(150);
    const q = await page.evaluate(centerOf(sel));
    await page.clickAt(q.x, q.y);
  };
  await page.setViewport(1280, 800);

  await check("1 hero: name, intro and the baked Earth (high fetch priority) paint without waiting for scripts", async () => {
    await page.navigate(BASE + "/");
    assert((await page.evaluate(`document.querySelector("h1")?.textContent`)) === "JeffreyWeaver", "h1");
    assert(await page.waitFor(`(() => { const i = document.querySelector("[data-earth] img"); return i && i.complete && i.naturalWidth > 0; })()`), "baked Earth not loaded");
    assert((await page.evaluate(`document.querySelector("[data-earth] img").getAttribute("fetchpriority")`)) === "high", "fetchpriority");
  });

  await check("2 the live Earth repaints for the real sun and the readout goes live", async () => {
    assert(await page.waitFor(`document.querySelector("[data-live-earth]")?.dataset.liveEarth === "ready"`, 20000), "live canvas never painted");
    assert(await page.waitFor(`document.querySelector("[data-readout]")?.dataset.readout === "live"`), "readout not live");
    return await page.evaluate(`document.querySelector("[data-readout]").textContent`);
  });

  await check("3 globe pins link to the work rows", async () => {
    const hrefs = await page.evaluate(`[...document.querySelectorAll("[data-earth] a")].map((a) => a.getAttribute("href")).join()`);
    assert(hrefs === "#work-vcu,#work-nasa", hrefs);
    assert(await page.evaluate(`!!document.querySelector("#work-vcu") && !!document.querySelector("#work-nasa")`), "row anchors");
  });

  await check("4 NASA card opens from the work list; Escape closes it, clears #nasa and refocuses the link", async () => {
    await click('#work-nasa a[href="#nasa"]');
    assert(await page.waitFor(nasaOpen, 5000), "NASA card did not open");
    await page.pressEscape();
    assert(await page.waitFor(`!document.querySelector("dialog[open]")`, 5000), "still open");
    assert(await page.waitFor(`location.hash === ""`, 3000), "hash not cleared");
    const f = await page.evaluate(`document.activeElement?.textContent?.trim()`);
    assert(f === "Open the NASA card", `focus on ${JSON.stringify(f)}`);
  });

  await check("5 NASA photo viewer steps with arrow keys and wraps; Escape steps back to the grid first", async () => {
    await click('#work-nasa a[href="#nasa"]');
    assert(await page.waitFor(nasaOpen, 5000), "not open");
    await click('dialog[open] button[aria-label^="View "]');
    assert(await page.waitFor(`!!document.querySelector('[aria-label="Photo viewer"]')`, 5000), "viewer");
    const counter = `document.querySelector('[aria-label="Photo viewer"] [aria-live]').textContent`;
    const first = await page.evaluate(counter);
    await key("ArrowLeft", "ArrowLeft", 37);
    const wrapped = await page.evaluate(counter);
    assert(first.startsWith("1 /") && /^(\d+) \/ \1$/.test(wrapped), `${first} -> ${wrapped}`);
    await page.pressEscape();
    assert(await page.waitFor(`!document.querySelector('[aria-label="Photo viewer"]') && ${nasaOpen}`, 3000), "Escape should close only the viewer");
    await page.pressEscape();
    assert(await page.waitFor(`!document.querySelector("dialog[open]")`, 3000), "card still open");
  });

  await check("6 clicking outside the NASA card closes it", async () => {
    await click('#work-nasa a[href="#nasa"]');
    assert(await page.waitFor(nasaOpen, 5000), "not open");
    await page.clickAt(8, 400);
    assert(await page.waitFor(`!document.querySelector("dialog[open]")`, 3000), "still open");
  });

  await check("7 Bob case file opens from the work list, Escape closes it and refocuses the link", async () => {
    await click('#work-bob a[href="#bob"]');
    assert(await page.waitFor(bobOpen, 5000), "case file did not open");
    assert(await page.evaluate(`!document.querySelector("#bob-ssl-note-casefile")`), "SSL warning should be gone");
    await page.pressEscape();
    assert(await page.waitFor(`!(${bobOpen})`, 5000), "still open");
    const f = await page.evaluate(`document.activeElement?.textContent?.trim()`);
    assert(f === "Open the case file", `focus on ${JSON.stringify(f)}`);
  });

  await check("8 a shared /#bob link opens the case file on load", async () => {
    await page.navigate(BASE + "/#bob");
    await page.evaluate("location.reload()");
    assert(await page.waitFor(bobOpen, 8000), "not open from the link");
    await page.pressEscape();
  });

  await check("9 keyboard: every early tab stop shows a visible focus outline", async () => {
    await page.navigate(BASE + "/");
    await page.evaluate("document.activeElement?.blur(); window.scrollTo(0, 0)");
    const seen = [];
    for (let i = 0; i < 12; i++) {
      await key("Tab", "Tab", 9);
      const s = await page.evaluate(`(() => { const a = document.activeElement; const cs = getComputedStyle(a);
        return { t: (a.textContent || a.getAttribute("aria-label") || a.tagName).trim().slice(0, 20), o: cs.outlineStyle, w: parseFloat(cs.outlineWidth) }; })()`);
      assert(s.o !== "none" && s.w >= 2, `no visible focus on ${s.t}`);
      seen.push(s.t);
    }
    assert(seen[0] === "JW", `first stop ${seen[0]}`);
    return seen.slice(0, 6).join(" | ");
  });

  for (const w of [390, 320]) {
    await check(`10 ${w}px: no horizontal scroll, on the page and inside the NASA card`, async () => {
      await page.setViewport(w, 800);
      await page.navigate(BASE + "/");
      await sleep(400);
      assert((await page.evaluate(overflow)) <= 0, `page overflows by ${await page.evaluate(overflow)}px`);
      await page.navigate(BASE + "/#nasa");
      await page.evaluate("location.reload()");
      assert(await page.waitFor(nasaOpen, 5000), "not open");
      const d = await page.evaluate(`(() => { const d = document.querySelector("dialog[open]"); return d.scrollWidth - d.clientWidth; })()`);
      assert(d <= 0, `NASA card overflows by ${d}px`);
    });
  }
  await page.setViewport(1280, 800);

  await check("11 reduced motion: the stars do not twinkle", async () => {
    await page.setReducedMotion(true);
    await page.navigate(BASE + "/");
    const ms = await page.evaluate(`parseFloat(getComputedStyle(document.querySelector(".stars-twinkle")).animationDuration) * 1000`);
    await page.setReducedMotion(false);
    const normal = await (async () => { await page.navigate(BASE + "/"); return page.evaluate(`getComputedStyle(document.querySelector(".stars-twinkle")).animationName`); })();
    assert(ms < 1, `animation still ${ms}ms`);
    assert(normal === "twinkle", `twinkle missing without reduced motion (${normal})`);
  });

  await check("12 no JavaScript: hero, Earth, work list and contact still read", async () => {
    await page.send("Emulation.setScriptExecutionDisabled", { value: true });
    await page.navigate(BASE + "/");
    await sleep(800);
    await page.send("Emulation.setScriptExecutionDisabled", { value: false });
    // reading the DOM through CDP works even with page scripts off
    const r = await page.evaluate(`({ h1: document.querySelector("h1")?.textContent, img: !!document.querySelector("[data-earth] img"),
      rows: document.querySelectorAll("#work li[id^=work-]").length, contact: !!document.querySelector('#contact a[href^="mailto:"]') })`);
    assert(r.h1 === "JeffreyWeaver" && r.img && r.rows === 4 && r.contact, JSON.stringify(r));
  });

  await check("13 light page: no WebGL, scripts under 250 KB transferred", async () => {
    await page.navigate(BASE + "/");
    await sleep(1500);
    const kb = await page.evaluate(`Math.round(performance.getEntriesByType("resource").filter((e) => e.initiatorType === "script").reduce((s, e) => s + (e.transferSize || e.encodedBodySize), 0) / 1024)`);
    const three = await page.evaluate(`performance.getEntriesByType("resource").some((e) => /three|fiber/i.test(e.name))`);
    assert(!three, "three.js still loaded");
    assert(kb < 250, `${kb} KB of script`);
    return `${kb} KB`;
  });
} finally {
  await shutdown(edge, page);
}

const failed = results.filter((r) => !r).length;
console.log(`${results.length - failed} of ${results.length} checks passed`);
process.exit(failed ? 1 : 0);
