// Run against a live build: npm run build; npm run start -- -p 3111
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

// Center of the first button with this exact text, or null.
const rectOf = (text) => `(() => {
  const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === ${JSON.stringify(text)});
  if (!b) return null;
  const r = b.getBoundingClientRect();
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
})()`;
const panelTitle = `document.querySelector("aside h2")?.textContent ?? null`;
const bobOpen = `!!document.querySelector('[role="dialog"][aria-label="Bob The Tech Guy case file"]')`;

const edge = await launch();
let page;

try {
  page = await connect(edge.wsUrl);
  await page.setViewport(1280, 800);

  await check("1 Bob label exists", async () => {
    await page.navigate(BASE + "/");
    assert(await page.waitFor(`!!(${rectOf("Bob The Tech Guy")})`), "button 'Bob The Tech Guy' not found");
  });

  await check("2 click Bob opens the case file", async () => {
    const { x, y } = await page.evaluate(rectOf("Bob The Tech Guy"));
    await page.clickAt(x, y);
    assert(await page.waitFor(bobOpen, 5000), "Bob case file did not open");
  });

  await check("3 Escape closes case file and refocuses Bob label", async () => {
    assert(await page.evaluate(bobOpen), "no case file open to dismiss");
    await page.pressEscape();
    assert(await page.waitFor(`!document.querySelector('[role="dialog"]')`, 5000), "case file still open");
    const focused = await page.evaluate(`document.activeElement?.textContent?.trim()`);
    assert(focused === "Bob The Tech Guy", `focus on ${JSON.stringify(focused)}`);
  });

  await check("4 /#education shows VCU panel", async () => {
    await page.navigate(BASE + "/#education");
    await page.evaluate("location.reload()");
    await sleep(500);
    assert(await page.waitFor(`${panelTitle} === "Virginia Commonwealth University"`), `panel h2 = ${await page.evaluate(panelTitle)}`);
  });

  await check("5 reduced motion: camera jumps within one frame", async () => {
    await page.setReducedMotion(true);
    await page.navigate(BASE + "/");
    await page.evaluate("location.reload()");
    await sleep(500);
    assert(await page.waitFor(`!!(${rectOf("NASA Langley Research Center")})`), "NASA label missing");
    // Labels ride the camera, so Bob's on-screen position is the camera probe.
    const probe = `(() => { const r = ${rectOf("Bob The Tech Guy")}; return r ? [r.x, r.y] : null; })()`;
    const before = await page.evaluate(probe);
    const { x, y } = await page.evaluate(rectOf("NASA Langley Research Center"));
    await page.clickAt(x, y);
    // The click's state update lands a frame or two later; a lone rAF can fire before the
    // jump renders. Sample up to 6 frames (flight would be far slower) and take the first jump.
    const after = await page.evaluate(`new Promise((r) => {
      let n = 0, p = null;
      const tick = () => {
        p = ${probe};
        if ((p && Math.abs(${before[0]} - p[0]) + Math.abs(${before[1]} - p[1]) > 20) || ++n >= 6) r(p);
        else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    })`);
    assert(before && after, `Bob label probe missing: before=${before} after=${after}`);
    const moved = Math.abs(before[0] - after[0]) + Math.abs(before[1] - after[1]);
    assert(moved > 20, `Bob label moved only ${moved.toFixed(1)}px in one frame: ${before} -> ${after}`);
    return `${before} -> ${after}`;
  });
  await page.setReducedMotion(false);

  await check("8 camera faces the sun while following a planet", async () => {
    await page.setViewport(1280, 800);
    await page.navigate(BASE + "/");
    await page.evaluate("location.reload()");
    await sleep(500);
    assert(await page.waitFor(`!!(${rectOf("Bob The Tech Guy")})`), "Bob label missing");
    const c = await page.evaluate(rectOf("Bob The Tech Guy"));
    await page.clickAt(c.x, c.y);
    assert(await page.waitFor(bobOpen, 5000), "case file did not open");
    await sleep(4500); // flight finished
    // Sun proxy: its label button, minus the label's own translate(off, -off) styling, gives the sun's screen position; centre is the canvas centre.
    const sample = () => page.evaluate(`(() => { const cv = document.querySelector("canvas").getBoundingClientRect(); return { sun: (() => { const b = document.querySelector('button[aria-label^="About me"]'); if (!b) return null; const r = b.getBoundingClientRect(); const [dx, dy] = b.style.transform.match(/-?[0-9.]+/g).map(Number); return { x: r.x + r.width / 2 - dx, y: r.y + r.height / 2 - dy }; })(), cx: cv.x + cv.width / 2, cy: cv.y + cv.height / 2 }; })()`);
    const a = await sample();
    await sleep(1000);
    const b = await sample();
    assert(a.sun && b.sun, "sun label missing after flight");
    const off = [a, b].map((m) => Math.hypot(m.sun.x - m.cx, m.sun.y - m.cy));
    assert(off.every((d) => d <= 20), `sun not at canvas centre, off by ${off.map((d) => d.toFixed(1))}px`);
    return `sun off centre ${off.map((d) => d.toFixed(1))}px`;
  });

  await check("9 NASA deep dive: gallery opens and Escape closes it", async () => {
    await page.setViewport(1280, 800);
    await page.navigate(BASE + "/");
    await page.evaluate("location.reload()");
    await sleep(500);
    assert(await page.waitFor(`!!(${rectOf("NASA Langley Research Center")})`), "NASA label missing");
    // The NASA label sits among overlapping labels; activate the button itself rather than a pixel.
    await page.evaluate(`[...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "NASA Langley Research Center").focus()`);
    await page.evaluate(`document.activeElement.click()`);
    assert(await page.waitFor(`!!document.querySelector("dialog[open]")`, 5000), "dialog did not open");
    const imgs = await page.evaluate(`document.querySelectorAll("dialog[open] img").length`);
    assert(imgs >= 10, `${imgs} gallery images`);
    const focus = await page.evaluate(`document.activeElement?.textContent?.trim()`);
    assert(focus?.startsWith("close"), `focus on ${JSON.stringify(focus)}`);
    await page.pressEscape();
    assert(await page.waitFor(`!document.querySelector("dialog[open]")`, 5000), "dialog still open after Escape");
    const back = await page.evaluate(`document.activeElement?.textContent?.trim()`);
    assert(back === "NASA Langley Research Center", `focus returned to ${JSON.stringify(back)}`);
    return `${imgs} images`;
  });

  await check("7 320px: no horizontal scroll", async () => {
    await page.setViewport(320, 700);
    await page.navigate(BASE + "/");
    await sleep(1500);
    const w = await page.evaluate(`document.documentElement.scrollWidth`);
    assert(w <= 320, `scrollWidth ${w}`);
    return `scrollWidth ${w}`;
  });

  // Last: the injected getContext stub persists for every later navigation.
  await check("6 no WebGL: static fallback", async () => {
    await page.injectBeforeLoad(`HTMLCanvasElement.prototype.getContext = () => null;`);
    await page.navigate(BASE + "/");
    assert(await page.waitFor(`[...document.querySelectorAll("h2")].some((h) => h.textContent.trim() === "everything else")`), "'everything else' heading missing");
    const canvases = await page.evaluate(`document.querySelectorAll("canvas").length`);
    assert(canvases === 0, `${canvases} canvas element(s)`);
  });
} finally {
  await shutdown(edge, page);
}

const failed = results.filter((r) => !r).length;
console.log(`${results.length - failed} of ${results.length} checks passed`);
process.exit(failed ? 1 : 0);
