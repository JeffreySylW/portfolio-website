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

  // ---- the Big Bang intro (every load) --------------------------------------------------------------------------
  const veil = `(() => { const v = document.querySelector("#bang"); return v ? { play: v.dataset.play || "", done: v.dataset.bang || "",
    shown: getComputedStyle(v).display !== "none" && getComputedStyle(v).visibility !== "hidden", hidden: v.getAttribute("aria-hidden") } : null; })()`;
  const freshTab = async () => { await page.navigate(BASE + "/404-blank"); await page.evaluate("sessionStorage.clear()"); };

  await check("0a the Big Bang plays over the page, the Earth paints underneath, then it clears by itself", async () => {
    await page.navigate(BASE + "/");
    const v0 = await page.evaluate(veil);
    assert(v0 && v0.play === "1" && v0.shown && v0.hidden === "true", `veil not armed ${JSON.stringify(v0)}`);
    const img = await page.evaluate(`(() => { const i = document.querySelector("[data-earth] img"); const cs = getComputedStyle(i);
      return { op: cs.opacity, vis: cs.visibility, disp: cs.display }; })()`);
    assert(img.op === "1" && img.vis === "visible" && img.disp !== "none", `Earth hidden under the veil ${JSON.stringify(img)}`);
    assert(await page.waitFor(`document.querySelector("#bang").dataset.bang === "done"`, 4000), "intro never finished");
    const v1 = await page.evaluate(veil);
    assert(!v1.shown, "veil still showing");
  });

  await check("0b a refresh plays it again", async () => {
    await page.evaluate("location.reload()");
    assert(await page.waitFor(`document.querySelector("#bang")?.dataset.play === "1"`, 3000), "did not play on refresh");
    assert(await page.waitFor(`document.querySelector("#bang").dataset.bang === "done"`, 4000), "never finished");
  });

  await check("0c Escape ends the intro at once", async () => {
    await freshTab();
    await page.navigate(BASE + "/");
    assert(await page.waitFor(`document.querySelector("#bang").dataset.play === "1" && !!document.querySelector(".bang-canvas").width`, 3000), "did not start");
    await page.pressEscape();
    assert(await page.waitFor(`!document.querySelector("#bang").dataset.play`, 300), "Escape did not end it");
  });

  await check("0d a click during the intro reaches the page (and ends the intro)", async () => {
    await freshTab();
    await page.navigate(BASE + "/");
    assert(await page.waitFor(`document.querySelector("#bang").dataset.play === "1"`, 3000), "did not start");
    const p = await page.evaluate(`(() => { const r = document.querySelector('a.px-btn[href="#work"]').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
    await page.clickAt(p.x, p.y);
    assert(await page.waitFor(`location.hash === "#work"`, 2000), "click did not reach the link");
    assert(await page.waitFor(`!document.querySelector("#bang").dataset.play`, 500), "intro kept playing");
  });

  await check("0e reduced motion: no intro at all", async () => {
    await freshTab();
    await page.setReducedMotion(true);
    await page.navigate(BASE + "/");
    const v = await page.evaluate(veil);
    await page.setReducedMotion(false);
    assert(!v.play && !v.shown, JSON.stringify(v));
  });

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
    // the intro would play on this load if scripts ran
    await page.send("Emulation.setScriptExecutionDisabled", { value: true });
    await page.navigate(BASE + "/");
    await sleep(800);
    await page.send("Emulation.setScriptExecutionDisabled", { value: false });
    // reading the DOM through CDP works even with page scripts off
    const r = await page.evaluate(`({ h1: document.querySelector("h1")?.textContent, img: !!document.querySelector("[data-earth] img"),
      rows: document.querySelectorAll("#work li[id^=work-]").length, contact: !!document.querySelector('#contact a[href^="mailto:"]') })`);
    const bang = await page.evaluate(`getComputedStyle(document.querySelector("#bang")).display`);
    assert(r.h1 === "JeffreyWeaver" && r.img && r.rows === 4 && r.contact, JSON.stringify(r));
    assert(bang === "none", `intro veil shows without JavaScript (${bang})`);
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
  // ---- the system map --------------------------------------------------------------------------------------------
  const planet = (id) => `#system [data-planet="${id}"]`;
  const hoverAt = async (sel) => {
    const p = await page.evaluate(centerOf(sel));
    assert(p, `${sel} not found`);
    await sleep(150);
    const q = await page.evaluate(centerOf(sel));
    await page.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 2, y: 2 });
    await page.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: q.x, y: q.y });
    return q;
  };
  const whooshes = `Number(document.querySelector("#system").dataset.whooshes || 0)`;

  await check("14 galaxy: five worlds, oldest nearest the core, each opening its own card, credit shown", async () => {
    await page.navigate(BASE + "/");
    const r = await page.evaluate(`(() => { const g = document.querySelector("#system [data-galaxy]").getBoundingClientRect();
      const cx = g.x + g.width * 0.5, cy = g.y + g.height * 0.5;
      return [...document.querySelectorAll("#system [data-planet]")].map((a) => { const b = a.getBoundingClientRect();
        return { id: a.dataset.planet, href: a.getAttribute("href"), r: Math.hypot(b.x + b.width / 2 - cx, b.y + b.height / 2 - cy), img: a.querySelector("img")?.getAttribute("src") }; }); })()`);
    assert(r.map((p) => p.id).join() === "vcu,ta,aspire,nasa,bob", r.map((p) => p.id).join());
    assert(r.every((p) => p.href === `#${p.id}`), `hrefs ${r.map((p) => p.href)}`);
    for (let i = 1; i < r.length; i++) assert(r[i].r > r[i - 1].r, `radius order ${r.map((p) => Math.round(p.r))}`);
    assert(r.every((p) => /^\/textures\/planets\/[\w-]+\.webp$/.test(p.img)), "baked images");
    const g = await page.evaluate(`(() => { const i = document.querySelector("#system [data-galaxy] img"); return { src: i.currentSrc || i.src, alt: i.alt }; })()`);
    assert(/milkyway-\d+\.webp/.test(g.src) || g.src === "", `galaxy image ${g.src}`);
    assert(await page.evaluate(`document.querySelector("#system").textContent.includes("NASA/JPL-Caltech/ESO/R. Hurt")`), "credit");
  });

  await check("15 the planets repaint for the real sun once the map is in view", async () => {
    await page.evaluate(`document.querySelector("#system").scrollIntoView({ block: "center", behavior: "instant" })`);
    assert(await page.waitFor(`[...document.querySelectorAll("#system canvas[data-live]")].every((c) => c.dataset.live === "ready")`, 20000), "planets never repainted");
  });

  const frames = `[...document.querySelectorAll("#system canvas[data-live]")].map((c) => Number(c.dataset.frames || 0))`;
  await check("15b the planets spin: new frames keep arriving while the map is in view", async () => {
    const a = await page.evaluate(frames);
    await sleep(1500);
    const b = await page.evaluate(frames);
    assert(b.every((n, i) => n >= a[i] + 4), `frames ${a} -> ${b}`);
    return `${b[0] - a[0]} frames in 1.5 s`;
  });

  await check("15c off screen the spinning stops", async () => {
    await page.evaluate(`window.scrollTo(0, document.body.scrollHeight)`);
    await sleep(500);
    const a = await page.evaluate(frames);
    await sleep(1200);
    const b = await page.evaluate(frames);
    assert(b.every((n, i) => n <= a[i] + 1), `still painting ${a} -> ${b}`);
    await page.evaluate(`document.querySelector("#system").scrollIntoView({ block: "center", behavior: "instant" })`);
  });

  await check("16 hovering a planet runs the glitch and, after any click on the page, the whoosh", async () => {
    await page.clickAt(5, 400); // a user gesture unlocks audio
    const before = await page.evaluate(whooshes);
    await hoverAt(planet("nasa"));
    await sleep(120);
    const anim = await page.evaluate(`getComputedStyle(document.querySelector('${planet("nasa")} [data-phase]')).animationName`);
    assert(anim === "phase-core", `animation ${anim}`);
    assert(await page.waitFor(`${whooshes} > ${before}`, 2000), "no whoosh");
  });

  await check("17 the sound button turns the whoosh off and on, and says which", async () => {
    const btn = `#system button[aria-pressed]`;
    assert((await page.evaluate(`document.querySelector('${btn}').getAttribute("aria-pressed")`)) === "true", "starts on");
    await click(btn);
    assert((await page.evaluate(`document.querySelector('${btn}').getAttribute("aria-pressed")`)) === "false", "turned off");
    const before = await page.evaluate(whooshes);
    await hoverAt(planet("bob"));
    await sleep(400);
    assert((await page.evaluate(whooshes)) === before, "whoosh while off");
    await click(btn);
    assert((await page.evaluate(`document.querySelector('${btn}').getAttribute("aria-pressed")`)) === "true", "back on");
  });

  await check("18 keyboard focus on a planet shows the outline and phases it too", async () => {
    await page.evaluate(`document.querySelector('${planet("vcu")}').focus({ focusVisible: true })`);
    const s = await page.evaluate(`(() => { const a = document.activeElement; const cs = getComputedStyle(a);
      return { id: a.dataset.planet, o: cs.outlineStyle, anim: getComputedStyle(a.querySelector("[data-phase]")).animationName }; })()`);
    assert(s.id === "vcu" && s.o !== "none", JSON.stringify(s));
    assert(s.anim === "phase-core", `focus animation ${s.anim}`);
  });

  await check("19 reduced motion: hovering a planet does not glitch", async () => {
    await page.setReducedMotion(true);
    await page.navigate(BASE + "/");
    await hoverAt(planet("nasa"));
    await sleep(120);
    const anim = await page.evaluate(`getComputedStyle(document.querySelector('${planet("nasa")} [data-phase]')).animationName`);
    await page.waitFor(`[...document.querySelectorAll("#system canvas[data-live]")].every((c) => c.dataset.live === "ready")`, 10000);
    const a = await page.evaluate(frames);
    await sleep(1200);
    const b = await page.evaluate(frames);
    await page.setReducedMotion(false);
    assert(anim === "none", `animation ${anim}`);
    assert(b.every((n, i) => n === a[i] && n >= 1), `planets still spin under reduced motion ${a} -> ${b}`);
  });

  // ---- cards from the Milky Way, Jeff at the core, the slow swirl --------------------------------------------------
  const cardOpen = (id) => `!!document.querySelector("dialog[open] #${id}-title")`;

  await check("21 clicking a planet opens its card (VCU, TA, ASPIRE new; NASA the NASA card); Escape closes and refocuses it", async () => {
    await page.navigate(BASE + "/");
    for (const [id, title] of [["vcu", "Virginia Commonwealth University"], ["ta", "Computer Science Teaching Assistant"], ["aspire", "DoD ASPIRE Capstone"]]) {
      await click(planet(id));
      assert(await page.waitFor(cardOpen(id), 5000), `${id} card did not open`);
      const t = await page.evaluate(`document.querySelector("#${id}-title").textContent`);
      assert(t === title, `${id} title ${t}`);
      await page.pressEscape();
      assert(await page.waitFor(`!document.querySelector("dialog[open]") && location.hash === ""`, 5000), `${id} did not close`);
      const f = await page.evaluate(`document.activeElement?.dataset.planet`);
      assert(f === id, `focus went to ${f}`);
    }
    await click(planet("nasa"));
    assert(await page.waitFor(nasaOpen, 5000), "NASA card did not open from its planet");
    await page.pressEscape();
    await page.waitFor(`!document.querySelector("dialog[open]")`, 5000);
  });

  await check("22 the core: Jeff's photo glitches on hover and opens 'Hi, I'm Jeff' with his photos", async () => {
    await hoverAt("#system [data-core]");
    await sleep(120);
    const anim = await page.evaluate(`getComputedStyle(document.querySelector("#system [data-core] [data-phase]")).animationName`);
    assert(anim === "phase-core", `core animation ${anim}`);
    await click("#system [data-core]");
    assert(await page.waitFor(cardOpen("me"), 5000), "me card did not open");
    const r = await page.evaluate(`(() => { const d = document.querySelector("dialog[open]");
      return { t: d.querySelector("#me-title").textContent, text: d.textContent, imgs: d.querySelectorAll("img[alt]").length }; })()`);
    assert(r.t === "Hi, I'm Jeff", r.t);
    assert(/my portfolio website and my road as a software engineer/.test(r.text), "lead text");
    assert(r.imgs === 3, `${r.imgs} photos`);
    await page.pressEscape();
    assert(await page.waitFor(`!document.querySelector("dialog[open]")`, 5000), "did not close");
  });

  await check("23 a shared /#me link opens the card on load", async () => {
    await page.navigate(BASE + "/#me");
    await page.evaluate("location.reload()");
    assert(await page.waitFor(cardOpen("me"), 8000), "not open from the link");
    await page.pressEscape();
  });

  await check("24 the Milky Way swirls slowly and the labels stay upright; reduced motion holds it still", async () => {
    await page.navigate(BASE + "/");
    await page.evaluate(`document.querySelector("#system").scrollIntoView({ behavior: "instant" })`);
    const anim = await page.evaluate(`(() => { const s = getComputedStyle(document.querySelector("#system .gal-swirl")); const u = getComputedStyle(document.querySelector("#system [data-core]").parentElement);
      return { s: s.animationName, sd: parseFloat(s.animationDuration), u: u.animationName, ud: parseFloat(u.animationDuration) }; })()`);
    assert(anim.s === "gal-swirl" && anim.u === "gal-upright" && anim.sd === anim.ud && anim.sd >= 180, JSON.stringify(anim));
    const a = await page.evaluate(`document.getAnimations().find((x) => x.animationName === "gal-swirl")?.currentTime ?? -1`);
    await sleep(600);
    const b = await page.evaluate(`document.getAnimations().find((x) => x.animationName === "gal-swirl")?.currentTime ?? -1`);
    assert(a >= 0 && b > a, `swirl not running ${a} -> ${b}`);
    await page.setReducedMotion(true);
    await page.navigate(BASE + "/");
    const still = await page.evaluate(`getComputedStyle(document.querySelector("#system .gal-swirl")).animationName`);
    await page.setReducedMotion(false);
    assert(still === "none", `reduced motion still swirls (${still})`);
  });

  for (const w of [390, 320]) {
    await check(`20 ${w}px: the system map fits, with every planet on screen`, async () => {
      await page.setViewport(w, 800);
      await page.navigate(BASE + "/");
      await page.evaluate(`document.querySelector("#system").scrollIntoView({ behavior: "instant" })`);
      await sleep(200);
      assert((await page.evaluate(overflow)) <= 0, "page overflows");
      const off = await page.evaluate(`[...document.querySelectorAll("#system [data-planet]")].filter((a) => { const r = a.getBoundingClientRect(); return r.left < 0 || r.right > ${w}; }).map((a) => a.dataset.planet).join()`);
      assert(!off, `off screen: ${off}`);
    });
  }
  await page.setViewport(1280, 800);
} finally {
  await shutdown(edge, page);
}

const failed = results.filter((r) => !r).length;
console.log(`${results.length - failed} of ${results.length} checks passed`);
process.exit(failed ? 1 : 0);
