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

const edge = await launch();
let page;

try {
  page = await connect(edge.wsUrl);
  await page.setViewport(1280, 800);

  await check("1 Bob label exists", async () => {
    await page.navigate(BASE + "/");
    assert(await page.waitFor(`!!(${rectOf("Bob The Tech Guy")})`), "button 'Bob The Tech Guy' not found");
  });

  await check("2 click Bob opens story panel", async () => {
    const { x, y } = await page.evaluate(rectOf("Bob The Tech Guy"));
    await page.clickAt(x, y);
    assert(await page.waitFor(`${panelTitle} === "Bob The Tech Guy"`, 5000), `panel h2 = ${await page.evaluate(panelTitle)}`);
  });

  await check("3 Escape closes panel and refocuses Bob label", async () => {
    assert(await page.evaluate(`!!document.querySelector("aside")`), "no panel open to dismiss");
    await page.pressEscape();
    assert(await page.waitFor(`!document.querySelector("aside")`, 5000), "panel still open");
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
    // Exactly one frame after the click, read the probe in the same evaluation.
    const after = await page.evaluate(`new Promise((r) => requestAnimationFrame(() => r(${probe})))`);
    assert(before && after, `Bob label probe missing: before=${before} after=${after}`);
    const moved = Math.abs(before[0] - after[0]) + Math.abs(before[1] - after[1]);
    assert(moved > 20, `Bob label moved only ${moved.toFixed(1)}px in one frame: ${before} -> ${after}`);
    return `${before} -> ${after}`;
  });
  await page.setReducedMotion(false);

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
