// Run against a live build: npm run build; npm run start -- -p 3111
import { launch, connect, shutdown } from "./cdp.mjs";
import sharp from "sharp";

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
// Worst case: white behind the card. Blends the card's translucent background over white, then the text over that.
const contrastOf = (cardSel, textSel) => `(() => {
  const cx = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  const px = (css, under) => { cx.fillStyle = under; cx.fillRect(0, 0, 1, 1); cx.fillStyle = css; cx.fillRect(0, 0, 1, 1); return [...cx.getImageData(0, 0, 1, 1).data].slice(0, 3); };
  const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const card = document.querySelector(${JSON.stringify(cardSel)});
  const text = document.querySelector(${JSON.stringify(textSel)});
  if (!card || !text) return null;
  const css = getComputedStyle(card).backgroundColor;
  const bg = px(css, "#ffffff");
  const fg = px(getComputedStyle(text).color, "rgb(" + bg.join(",") + ")");
  const [hi, lo] = [lum(fg), lum(bg)].sort((a, b) => b - a);
  return { ratio: (hi + 0.05) / (lo + 0.05), seeThrough: px(css, "#ffffff").join() !== px(css, "#000000").join() };
})()`;

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
    assert(imgs >= 17, `${imgs} gallery images`);
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

  await check("12 textured planets: all five textures were fetched", async () => {
    await page.setViewport(1280, 800);
    await page.navigate(BASE + "/");
    await page.evaluate("location.reload()");
    await sleep(500);
    assert(await page.waitFor(`!!(${rectOf("Bob The Tech Guy")})`), "scene did not load");
    const ok = await page.waitFor(`["nasa","bob","education","aspire","ta"].every((id) => performance.getEntriesByType("resource").some((e) => e.name.endsWith("/textures/planets/" + id + ".webp") && e.responseStatus === 200))`, 15000);
    assert(ok, "a planet texture was not fetched with status 200");
  });

  await check("14 a texture that fails to load leaves the plain sphere, not the static fallback", async () => {
    await page.send("Network.enable");
    await page.send("Network.setBlockedURLs", { urls: ["*/textures/planets/bob.webp"] });
    try {
      await page.navigate(BASE + "/");
      await page.evaluate("location.reload()");
      await sleep(500);
      assert(await page.waitFor(`!!(${rectOf("Bob The Tech Guy")})`), "Bob label missing: scene fell back");
      assert(await page.evaluate(`!!document.querySelector("canvas")`), "no canvas: the scene dropped to the static fallback");
    } finally {
      await page.send("Network.setBlockedURLs", { urls: [] });
    }
  });

  const openNasaCard = async (w, h) => {
    await page.setViewport(w, h);
    await page.navigate(BASE + "/");
    await page.evaluate("location.reload()");
    await sleep(500);
    assert(await page.waitFor(`!!(${rectOf("NASA Langley Research Center")})`), "NASA label missing");
    await page.evaluate(`[...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "NASA Langley Research Center").click()`);
    assert(await page.waitFor(`!!document.querySelector("dialog[open]")`, 8000), "NASA card did not open");
  };

  await check("15 NASA card: Side Quest 1 and Makerspace photos sit in their sections, every caption its own", async () => {
    await openNasaCard(1280, 800);
    const r = await page.evaluate(`(() => {
      const photosIn = (h) => { const sec = [...document.querySelectorAll("dialog[open] section")].find((s) => s.querySelector("h3")?.textContent === h); return sec ? sec.querySelectorAll("img").length : 0; };
      const caps = [...document.querySelectorAll("dialog[open] li button")].map((b) => b.textContent);
      return { maker: photosIn("MAKERSPACE"), quest: photosIn("SIDE QUEST 1: WIND TUNNEL SURVEILLANCE SYSTEM"), all: caps.length, unique: new Set(caps).size };
    })()`);
    assert(r.maker === 5, `${r.maker} Makerspace photos`);
    assert(r.quest === 3, `${r.quest} Side Quest 1 photos`);
    assert(r.all === 17 && r.unique === 17, `${r.unique} unique of ${r.all} photo captions`);
    await page.pressEscape();
  });

  await check("16 NASA card at 390px: no horizontal overflow", async () => {
    await openNasaCard(390, 844);
    const o = await page.evaluate(`({ page: document.documentElement.scrollWidth - innerWidth, card: (() => { const d = document.querySelector("dialog[open]"); return d.scrollWidth - d.clientWidth; })() })`);
    assert(o.page <= 0 && o.card <= 0, `overflow: page ${o.page}px, card ${o.card}px`);
    await page.pressEscape();
  });

  await check("17 photo viewer steps with the arrow keys and wraps around", async () => {
    await openNasaCard(1280, 800);
    const names = await page.evaluate(`[...document.querySelectorAll("dialog[open] li button")].map((b) => b.getAttribute("aria-label").replace(/^View | full size$/g, ""))`);
    await page.evaluate(`document.querySelector("dialog[open]").scrollTop = 1500`); // viewer must stay full-screen even when the card is scrolled
    await page.evaluate(`document.querySelector("dialog[open] li button").click()`); // first photo (a Makerspace one)
    await sleep(300);
    const box = await page.evaluate(`(() => { const r = document.querySelector('dialog[open] [role="group"]').getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, vw: document.documentElement.clientWidth, vh: document.documentElement.clientHeight }; })()`);
    assert(Math.abs(box.x) < 1 && Math.abs(box.y) < 1 && Math.abs(box.w - box.vw) < 1 && Math.abs(box.h - box.vh) < 1, `viewer is not full-screen: ${JSON.stringify(box)}`);
    const shownName = () => page.evaluate(`document.querySelector('dialog[open] [role="group"] p')?.textContent ?? null`);
    assert((await shownName()) === names[0], `viewer opened on ${await shownName()}`);
    const key = async (k) => {
      const code = { key: k, code: k, windowsVirtualKeyCode: k === "ArrowRight" ? 39 : 37 };
      await page.send("Input.dispatchKeyEvent", { type: "rawKeyDown", ...code });
      await page.send("Input.dispatchKeyEvent", { type: "keyUp", ...code });
      await sleep(150);
    };
    await key("ArrowRight");
    assert((await shownName()) !== names[0], "ArrowRight did not move on");
    await key("ArrowLeft");
    await key("ArrowLeft");
    const wrapped = await page.evaluate(`document.querySelector('dialog[open] [role="group"] span[aria-live]').textContent`);
    assert(wrapped.trim() === "17 / 17", `wrapped to ${wrapped}`);
    await page.pressEscape();
    await page.pressEscape();
  });

  await check("18 NASA card is see-through and its text stays AA-readable", async () => {
    await openNasaCard(1280, 800);
    for (const sel of ["dialog[open] > p", "dialog[open] #nasa-dates", "dialog[open] section p", "dialog[open] section li button span:last-child span:last-child"]) {
      const c = await page.evaluate(contrastOf("dialog[open]", sel));
      assert(c, `missing ${sel}`);
      assert(c.seeThrough, "NASA card background is opaque");
      assert(c.ratio >= 4.5, `${sel}: contrast ${c.ratio.toFixed(2)}`);
    }
    await page.pressEscape();
  });

  await check("19 story panel is see-through and readable", async () => {
    await page.setViewport(1280, 800);
    await page.navigate(BASE + "/#education");
    await page.evaluate("location.reload()");
    assert(await page.waitFor(`${panelTitle} === "Virginia Commonwealth University"`), "panel missing");
    for (const sel of ["aside p:nth-of-type(1)", "aside p:nth-of-type(2)", "aside p:nth-of-type(3)"]) {
      const c = await page.evaluate(contrastOf("aside", sel));
      assert(c && c.seeThrough, `${sel}: not see-through`);
      assert(c.ratio >= 4.5, `${sel}: contrast ${c.ratio.toFixed(2)}`);
    }
  });

  await check("20 Bob case file is see-through and readable", async () => {
    await page.setViewport(1280, 800);
    await page.navigate(BASE + "/");
    await page.evaluate("location.reload()");
    assert(await page.waitFor(`!!(${rectOf("Bob The Tech Guy")})`), "Bob label missing");
    const canvasWidth = `Math.round(document.querySelector("canvas").getBoundingClientRect().width)`;
    const widthBefore = await page.evaluate(canvasWidth);
    await page.evaluate(`[...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "Bob The Tech Guy").click()`);
    assert(await page.waitFor(bobOpen, 8000), "case file did not open");
    await sleep(600);
    // Locking page scroll must not resize the canvas: a paused canvas cannot redraw, so a resize leaves it blank behind the card.
    const widthAfter = await page.evaluate(canvasWidth);
    assert(widthAfter === widthBefore, `canvas went from ${widthBefore}px to ${widthAfter}px wide when the case file opened`);
    // the planet must stay drawn behind the card; only the floating labels are hidden
    const vis = await page.evaluate(`({ canvas: getComputedStyle(document.querySelector("canvas")).visibility, label: getComputedStyle([...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "NASA Langley Research Center")).visibility })`);
    assert(vis.canvas === "visible", `canvas is ${vis.canvas} behind the case file`);
    assert(vis.label === "hidden", `scene labels are ${vis.label} over the case file`);
    for (const sel of ['[role="dialog"] p.font-display', '[role="dialog"] figcaption']) {
      const c = await page.evaluate(contrastOf('[role="dialog"] .card-glass', sel));
      assert(c && c.seeThrough, `${sel}: not see-through`);
      assert(c.ratio >= 4.5, `${sel}: contrast ${c.ratio.toFixed(2)}`);
    }
    await page.pressEscape();
  });

  await check("21 the galaxy keeps moving behind an open card", async () => {
    await openNasaCard(1280, 800);
    await sleep(1000);
    // the followed planet sits behind the middle of the card; two captures 3s apart must differ there.
    // A frozen canvas gives 0; a slowly spinning planet seen through the 74%-opaque card gives a few tenths.
    const grab = async () => {
      const r = await page.send("Page.captureScreenshot", { format: "png", clip: { x: 440, y: 200, width: 400, height: 400, scale: 1 } });
      return (await sharp(Buffer.from(r.data, "base64")).removeAlpha().raw().toBuffer());
    };
    const a = await grab();
    await sleep(6000);
    const b = await grab();
    let sum = 0;
    for (let i = 0; i < a.length; i++) sum += Math.abs(a[i] - b[i]);
    const diff = sum / a.length;
    assert(diff > 0.1, `the scene is frozen behind the card: mean pixel change ${diff.toFixed(3)}`);
    await page.pressEscape();
    return `mean pixel change ${diff.toFixed(2)}`;
  });

  await check("22 clicking outside the NASA card closes it; clicking inside its padding does not", async () => {
    await openNasaCard(1280, 800);
    const r = await page.evaluate(`(() => { const b = document.querySelector("dialog[open]").getBoundingClientRect(); return { x: b.left + 6, y: b.top + 300 }; })()`);
    await page.clickAt(r.x, r.y);
    await sleep(400);
    assert(await page.evaluate(`!!document.querySelector("dialog[open]")`), "a click inside the card's padding closed it");
    await page.clickAt(60, 400);
    assert(await page.waitFor(`!document.querySelector("dialog[open]")`, 3000), "clicking outside did not close the card");
  });

  await check("23 clicking beside the Bob case file closes it; clicking its text does not", async () => {
    await page.setViewport(1280, 800);
    await page.navigate(BASE + "/");
    await page.evaluate("location.reload()");
    assert(await page.waitFor(`!!(${rectOf("Bob The Tech Guy")})`), "Bob label missing");
    await page.evaluate(`[...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "Bob The Tech Guy").click()`);
    assert(await page.waitFor(bobOpen, 8000), "case file did not open");
    await sleep(700);
    const t = await page.evaluate(`(() => { const r = document.querySelector('[role="dialog"] p.font-display').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
    await page.clickAt(t.x, t.y);
    await sleep(400);
    assert(await page.evaluate(bobOpen), "clicking the case file's text closed it");
    await page.clickAt(60, 400);
    assert(await page.waitFor(`!(${bobOpen})`, 3000), "clicking beside the case file did not close it");
  });

  await check("24 clicking empty space closes a story panel", async () => {
    await page.setViewport(1280, 800);
    await page.navigate(BASE + "/#education");
    await page.evaluate("location.reload()");
    assert(await page.waitFor(`${panelTitle} === "Virginia Commonwealth University"`), "panel missing");
    await sleep(2500);
    await page.clickAt(300, 80);
    assert(await page.waitFor(`!document.querySelector("aside h2")`, 3000), "clicking empty space did not close the panel");
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
