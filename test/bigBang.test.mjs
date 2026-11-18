import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import {
  INTRO_MS,
  FAILSAFE_MS,
  SEEN_KEY,
  introScript,
  introPhase,
  makeCloud,
  bayer,
  BANG_COLORS,
} from "../src/lib/bigBang.ts";

// run the inline <script> the way the browser would, against a stub page
function runIntroScript({ reduced = false, seen = false, storageThrows = false } = {}) {
  const store = new Map(seen ? [[SEEN_KEY, "1"]] : []);
  const veil = { dataset: {} };
  const sessionStorage = {
    getItem: (k) => { if (storageThrows) throw new Error("blocked"); return store.has(k) ? store.get(k) : null; },
    setItem: (k, v) => { if (storageThrows) throw new Error("blocked"); store.set(k, String(v)); },
  };
  const ctx = {
    document: { getElementById: (id) => (id === "bang" ? veil : null) },
    matchMedia: (q) => ({ matches: reduced && q.includes("reduce") }),
    sessionStorage,
    performance: { now: () => 123.4 },
  };
  ctx.window = ctx;
  vm.runInNewContext(introScript, ctx);
  return { veil, store };
}

test("the intro lasts about 2-3 s and a CSS failsafe clears the veil after it", () => {
  assert.ok(INTRO_MS >= 2000 && INTRO_MS <= 3000, `${INTRO_MS} ms`);
  assert.ok(FAILSAFE_MS > INTRO_MS + 1000 && FAILSAFE_MS <= 5000, `failsafe ${FAILSAFE_MS} ms`);
});

test("first visit in a tab: the inline script arms the veil and marks the tab as seen", () => {
  const { veil, store } = runIntroScript();
  assert.equal(veil.dataset.play, "1");
  assert.equal(veil.dataset.t0, "123.4");
  assert.equal(store.get(SEEN_KEY), "1");
});

test("already seen in this tab: no intro", () => {
  assert.equal(runIntroScript({ seen: true }).veil.dataset.play, undefined);
});

test("reduced motion: no intro, and the tab is not marked", () => {
  const { veil, store } = runIntroScript({ reduced: true });
  assert.equal(veil.dataset.play, undefined);
  assert.equal(store.size, 0);
});

test("blocked storage: no intro and no error (never risk a veil that cannot be remembered)", () => {
  assert.equal(runIntroScript({ storageThrows: true }).veil.dataset.play, undefined);
});

test("phases: a bright point, a flash, the gas grows, the veil dissolves and is gone at the end", () => {
  const at = (t) => introPhase(t);
  assert.equal(at(0).veil, 1);
  assert.ok(at(0).flash < at(INTRO_MS * 0.15).flash, "the flash builds");
  assert.ok(at(INTRO_MS * 0.15).flash > 0.8, "a real flash");
  assert.ok(at(INTRO_MS * 0.6).flash < 0.2, "the flash is over before the reveal");
  let lastR = -1, lastV = 2;
  for (let t = 0; t <= INTRO_MS; t += 50) {
    const p = at(t);
    assert.ok(p.radius >= lastR, `gas shrinks at ${t}`);
    assert.ok(p.veil <= lastV, `veil grows back at ${t}`);
    for (const k of ["flash", "radius", "veil", "gas", "galaxies"]) assert.ok(p[k] >= 0 && p[k] <= 1, `${k} ${p[k]} at ${t}`);
    lastR = p.radius;
    lastV = p.veil;
  }
  assert.equal(at(INTRO_MS).veil, 0);
  assert.equal(at(INTRO_MS + 500).veil, 0);
  assert.ok(at(INTRO_MS * 0.4).veil > 0.9, "the page stays hidden while the burst plays");
});

test("the cloud is the same every visit, in the site's palette, spread all round the burst", () => {
  const a = makeCloud(7), b = makeCloud(7);
  assert.deepEqual(a, b);
  assert.ok(a.puffs.length >= 40 && a.galaxies.length >= 30);
  const palette = new Set(BANG_COLORS);
  for (const p of [...a.puffs, ...a.galaxies]) assert.ok(palette.has(p.color), p.color);
  for (const c of BANG_COLORS) assert.ok(["#07061a", "#15123d", "#2b2a7a", "#5b54d6", "#a9a4ff", "#f2f0ff"].includes(c), c);
  const quadrants = new Set(a.puffs.map((p) => `${Math.cos(p.angle) > 0}${Math.sin(p.angle) > 0}`));
  assert.equal(quadrants.size, 4);
  for (const p of a.puffs) assert.ok(p.dist > 0 && p.dist <= 1 && p.size > 0, JSON.stringify(p));
});

test("bayer thresholds cover 0..1 evenly, so the veil dissolves pixel by pixel", () => {
  const seen = new Set();
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
    const v = bayer(x, y);
    assert.ok(v > 0 && v < 1, `${v}`);
    seen.add(v);
  }
  assert.equal(seen.size, 64);
  assert.equal(bayer(9, 3), bayer(1, 3), "tiles");
});

test("the veil is aria-hidden, hidden unless armed, cleared by reduced motion, and never needs scripts to go away", () => {
  const veil = readFileSync(new URL("../src/components/site/BigBang.tsx", import.meta.url), "utf8");
  const css = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");
  assert.match(veil, /aria-hidden="true"/);
  assert.match(veil, /id="bang"/);
  assert.match(css, /\.bang-veil\s*\{[^}]*display:\s*none/);
  assert.match(css, /\.bang-veil\[data-play\]\s*\{[^}]*display:\s*block/);
  assert.match(css, /\.bang-veil\[data-play\]\s*\{[^}]*pointer-events:\s*none/);
  assert.match(css, new RegExp(`bang-failsafe\\s+0s\\s+linear\\s+${FAILSAFE_MS / 1000}s\\s+forwards`));
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)\s*\{\s*\.bang-veil\s*\{\s*display:\s*none\s*!important/);
});
