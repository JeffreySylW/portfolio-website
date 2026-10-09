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
    // Activate the button itself: a pixel click can land on an overlapping label and miss.
    await page.evaluate(`[...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "NASA Langley Research Center").click()`);
    // The click's state update lands some frames later (software GL frames can be slow). Sample frames until the
    // probe has moved >20px in total, and require that move to happen within a single frame (a flight moves gradually).
    const { after, step } = await page.evaluate(`new Promise((r) => {
      let n = 0, prev = ${JSON.stringify(before)};
      const tick = () => {
        const p = ${probe};
        const step = p ? Math.abs(prev[0] - p[0]) + Math.abs(prev[1] - p[1]) : 0;
        const total = p ? Math.abs(${before[0]} - p[0]) + Math.abs(${before[1]} - p[1]) : 0;
        if (total > 20 || ++n >= 300) r({ after: p, step });
        else { if (p) prev = p; requestAnimationFrame(tick); }
      };
      requestAnimationFrame(tick);
    })`);
    assert(before && after, `Bob label probe missing: before=${before} after=${after}`);
    const moved = Math.abs(before[0] - after[0]) + Math.abs(before[1] - after[1]);
    assert(moved > 20, `Bob label moved only ${moved.toFixed(1)}px: ${before} -> ${after}`);
    assert(step > 20, `camera flew instead of jumping: last frame step ${step.toFixed(1)}px`);
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

  // Opacity of a heading times its ancestors' (reveal wrappers), plus whether its text is final.
  const HEADINGS = `document.querySelectorAll("#timeline h2, #projects h2, #resume h2, #contact h2")`;
  const headingState = `[...${HEADINGS}].map((h) => {
    let o = 1; for (let n = h; n; n = n.parentElement) o *= parseFloat(getComputedStyle(n).opacity);
    return { label: h.getAttribute("aria-label"), text: h.textContent.trim(), opacity: o };
  })`;

  await check("9 section headings visible and scramble settles; reduced motion is instant", async () => {
    await page.setViewport(1280, 800);
    await page.navigate(BASE + "/");
    await page.evaluate("location.reload()");
    await sleep(500);
    assert(await page.waitFor(`!!document.querySelector("canvas")`), "scene not mounted");
    const n = await page.evaluate(`${HEADINGS}.length`);
    assert(n === 4, `${n} headings`);
    for (let i = 0; i < n; i++) {
      await page.evaluate(`${HEADINGS}[${i}].scrollIntoView({ behavior: "instant", block: "center" })`);
      // The text equals the final text before the scramble starts, so first wait (up to 3s) for it to
      // start (the observer fires after hydration; skipped if it never starts), then for the final text (up to 3s).
      const heading = `${HEADINGS}[${i}]`;
      await page.waitFor(`${heading}.textContent.trim() !== ${heading}.getAttribute("aria-label")`, 3000);
      assert(await page.waitFor(`${heading}.textContent.trim() === ${heading}.getAttribute("aria-label")`, 3000), `heading ${i} still scrambling`);
      await sleep(900); // reveal fade
    }
    for (const s of await page.evaluate(headingState)) assert(s.opacity === 1 && s.text === s.label, `heading ${JSON.stringify(s)}`);

    await page.setReducedMotion(true);
    await page.navigate(BASE + "/");
    await page.evaluate("location.reload()");
    await sleep(500);
    await page.evaluate(`[...${HEADINGS}].forEach((h) => h.scrollIntoView({ behavior: "instant", block: "center" }))`);
    const instant = await page.evaluate(`new Promise((r) => requestAnimationFrame(() => r(${headingState})))`);
    await page.setReducedMotion(false);
    for (const s of instant) assert(s.opacity === 1 && s.text === s.label, `reduced-motion heading ${JSON.stringify(s)}`);
    return `${n} headings`;
  });

  await check("10 NASA deep dive: gallery opens and Escape closes it", async () => {
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

  await check("11 NASA card opens only after the camera arrives, sun centred", async () => {
    await page.setViewport(1280, 800);
    await page.navigate(BASE + "/");
    await page.evaluate("location.reload()");
    await sleep(500);
    assert(await page.waitFor(`!!(${rectOf("NASA Langley Research Center")})`), "NASA label missing");
    await page.evaluate(`[...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "NASA Langley Research Center").focus()`);
    // click, then sample for 300ms in-page: the dialog must stay closed
    const early = await page.evaluate(`new Promise((r) => {
      document.activeElement.click();
      const t0 = performance.now(); let seen = false;
      const id = setInterval(() => {
        if (document.querySelector("dialog[open]")) seen = true;
        if (performance.now() - t0 >= 300) { clearInterval(id); r(seen); }
      }, 10);
    })`);
    assert(!early, "dialog opened within 300ms of the click");
    assert(await page.waitFor(`!!document.querySelector("dialog[open]")`, 3000), "dialog not open within 3s");
    const m = await page.evaluate(`(() => { const cv = document.querySelector("canvas").getBoundingClientRect(); const b = document.querySelector('button[aria-label^="About me"]'); const r = b.getBoundingClientRect(); const [dx, dy] = b.style.transform.match(/-?[0-9.]+/g).map(Number); return { x: r.x + r.width / 2 - dx - (cv.x + cv.width / 2), y: r.y + r.height / 2 - dy - (cv.y + cv.height / 2) }; })()`);
    const off = Math.hypot(m.x, m.y);
    assert(off <= 20, `sun ${off.toFixed(1)}px off centre when the dialog opened`);
    return `sun off centre ${off.toFixed(1)}px`;
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
