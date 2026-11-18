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
  makeStars,
  inkRadius,
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

test("phases: a black drop falls onto white, lands, ink floods out, stars burst, and the page opens from the centre", () => {
  const at = (t) => introPhase(t);
  const impact = INTRO_MS * 0.25;
  assert.equal(at(0).drop, 0);
  assert.ok(at(impact - 1).drop > 0.95, "the drop has landed by the impact");
  assert.equal(at(impact).ink, 0, "no ink before it lands");
  assert.ok(at(impact - 50).flash === 0 && at(impact + 120).flash > 0.5, "the flash comes with the impact");
  assert.ok(at(INTRO_MS * 0.5).ink > 0.95, "ink covers the screen by mid-way");
  assert.ok(at(INTRO_MS * 0.4).stars > 0, "stars are bursting while the ink spreads");
  let last = { drop: -1, ink: -1, stars: -1, open: -1, veil: 2 };
  for (let t = 0; t <= INTRO_MS; t += 16) {
    const p = at(t);
    for (const k of ["drop", "ink", "flash", "stars", "starAlpha", "open", "veil"]) assert.ok(p[k] >= 0 && p[k] <= 1, `${k} ${p[k]} at ${t}`);
    for (const k of ["drop", "ink", "stars", "open"]) assert.ok(p[k] >= last[k], `${k} goes back at ${t}`);
    assert.ok(p.veil <= last.veil, `veil grows back at ${t}`);
    assert.ok(Math.abs(p.veil - (1 - p.open)) < 1e-9, "veil is what is not yet open");
    last = p;
  }
  assert.ok(at(INTRO_MS * 0.4).veil === 1, "the page stays hidden until the burst is under way");
  assert.equal(at(INTRO_MS).veil, 0);
  assert.equal(at(INTRO_MS + 500).veil, 0);
});

test("smooth, not stepped: no phase jumps more than a little between two 120 Hz frames", () => {
  for (let t = 0; t < INTRO_MS - 9; t += 4) {
    const a = introPhase(t), b = introPhase(t + 1000 / 120);
    for (const k of ["drop", "ink", "stars", "open"]) assert.ok(Math.abs(b[k] - a[k]) < 0.06, `${k} jumps at ${t}`);
  }
});

test("the ink's edge wobbles like a liquid but stays close to a circle", () => {
  let min = Infinity, max = 0;
  for (let i = 0; i < 360; i++) {
    const r = inkRadius(100, (i * Math.PI) / 180, 0.6);
    min = Math.min(min, r);
    max = Math.max(max, r);
  }
  assert.ok(max - min > 2, "edge is perfectly round");
  assert.ok(min > 85 && max < 115, `${min}..${max}`);
});

test("the stars are the same every visit, in the site's palette, spread all round the burst", () => {
  const a = makeStars(7), b = makeStars(7);
  assert.deepEqual(a, b);
  assert.ok(a.length >= 300, `${a.length} stars`);
  const palette = new Set(BANG_COLORS);
  for (const c of BANG_COLORS) assert.ok(["#07061a", "#15123d", "#2b2a7a", "#5b54d6", "#a9a4ff", "#f2f0ff"].includes(c), c);
  for (const s of a) {
    assert.ok(palette.has(s.color), s.color);
    assert.ok(s.dist > 0 && s.dist <= 1.2 && s.size > 0, JSON.stringify(s));
  }
  const quadrants = new Set(a.map((s) => `${Math.cos(s.angle) > 0}${Math.sin(s.angle) > 0}`));
  assert.equal(quadrants.size, 4);
});

test("the veil is aria-hidden, hidden unless armed, cleared by reduced motion, and never needs scripts to go away", () => {
  const veil = readFileSync(new URL("../src/components/site/BigBang.tsx", import.meta.url), "utf8");
  const css = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");
  assert.match(veil, /aria-hidden="true"/);
  assert.match(veil, /id="bang"/);
  assert.match(css, /\.bang-veil\s*\{[^}]*display:\s*none/);
  assert.match(css, /\.bang-veil\[data-play\]\s*\{[^}]*display:\s*block/);
  assert.match(css, /\.bang-veil\[data-play\]\s*\{[^}]*background:\s*var\(--starlight\)/, "starts on white");
  assert.match(css, /\.bang-veil\[data-play\]\s*\{[^}]*pointer-events:\s*none/);
  assert.match(css, new RegExp(`bang-failsafe\\s+0s\\s+linear\\s+${FAILSAFE_MS / 1000}s\\s+forwards`));
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)\s*\{\s*\.bang-veil\s*\{\s*display:\s*none\s*!important/);
});
