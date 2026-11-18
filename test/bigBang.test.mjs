import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import {
  INTRO_MS,
  FAILSAFE_MS,
  IMPACT_MS,
  JW_SCALE,
  introScript,
  introPhase,
  makeStars,
  BANG_COLORS,
} from "../src/lib/bigBang.ts";

// run the inline <script> the way the browser would, against a stub page
function runIntroScript({ reduced = false, storageThrows = false } = {}) {
  const veil = { dataset: {} };
  const boom = () => { throw new Error("storage should not be touched"); };
  const ctx = {
    document: { getElementById: (id) => (id === "bang" ? veil : null) },
    matchMedia: (q) => ({ matches: reduced && q.includes("reduce") }),
    sessionStorage: storageThrows ? { getItem: boom, setItem: boom } : { getItem: () => "1", setItem: () => {} },
    performance: { now: () => 123.4 },
  };
  ctx.window = ctx;
  vm.runInNewContext(introScript, ctx);
  return veil;
}

test("the intro lasts about 2-3 s and a CSS failsafe clears the veil after it", () => {
  assert.ok(INTRO_MS >= 2000 && INTRO_MS <= 3000, `${INTRO_MS} ms`);
  assert.ok(FAILSAFE_MS > INTRO_MS + 1000 && FAILSAFE_MS <= 5000, `failsafe ${FAILSAFE_MS} ms`);
});

test("every load arms the veil, even after an earlier visit, and storage is never needed", () => {
  const v = runIntroScript();
  assert.equal(v.dataset.play, "1");
  assert.equal(v.dataset.t0, "123.4");
  assert.equal(runIntroScript({ storageThrows: true }).dataset.play, "1");
});

test("reduced motion: no intro", () => {
  assert.equal(runIntroScript({ reduced: true }).dataset.play, undefined);
});

test("the drop falls, lands at the impact and the impact frames flip black and white", () => {
  const at = (t) => introPhase(t);
  assert.equal(at(0).drop, 0);
  assert.ok(at(IMPACT_MS - 1).drop > 0.99, "landed at the impact");
  assert.ok(IMPACT_MS >= 1100 && IMPACT_MS > INTRO_MS * 0.4, `a slow drop: impact at ${IMPACT_MS}`);
  assert.ok(at(IMPACT_MS * 0.5).drop < 0.3, "it takes its time at first");
  assert.equal(at(IMPACT_MS - 20).invert, false, "not inverted before the impact");
  assert.equal(at(IMPACT_MS + 10).invert, true, "first impact frame is inverted");
  assert.equal(at(IMPACT_MS + 100).invert, false, "then flips back");
  assert.equal(at(IMPACT_MS + 180).invert, true, "then inverts again");
  assert.equal(at(IMPACT_MS + 400).invert, false, "and settles");
  assert.ok(at(IMPACT_MS + 200).glitch > 0, "glitch slices during the second inversion");
  assert.equal(at(IMPACT_MS - 20).glitch, 0);
  assert.equal(at(IMPACT_MS + 600).glitch, 0);
});

test("JW flashes with the impact frames, and only then", () => {
  const at = (t) => introPhase(t);
  assert.equal(at(IMPACT_MS - 1).jw, 0);
  assert.ok(at(IMPACT_MS + 10).jw > 0.9);
  assert.ok(at(IMPACT_MS + 200).jw > 0.9);
  assert.equal(at(IMPACT_MS + 400).jw, 0);
  for (let t = 0; t <= INTRO_MS; t += 10) assert.ok(at(t).jw >= 0 && at(t).jw <= 1);
});

test("then it explodes violently and fast, and the site opens straight after", () => {
  const at = (t) => introPhase(t);
  let last = { drop: -1, shock: -1, stars: -1, open: -1 };
  for (let t = 0; t <= INTRO_MS; t += 16) {
    const p = at(t);
    for (const k of ["drop", "shock", "glitch", "stars", "starAlpha", "open", "veil"]) assert.ok(p[k] >= 0 && p[k] <= 1, `${k} ${p[k]} at ${t}`);
    for (const k of ["drop", "shock", "stars", "open"]) assert.ok(p[k] >= last[k], `${k} goes back at ${t}`);
    assert.ok(Math.abs(p.veil - (1 - p.open)) < 1e-9);
    last = p;
  }
  assert.equal(at(IMPACT_MS - 1).stars, 0);
  assert.equal(at(IMPACT_MS).veil, 1, "the site stays hidden until the hit");
  assert.ok(at(IMPACT_MS + 350).stars > 0.7, "the stars shoot out fast");
  assert.ok(at(IMPACT_MS + 350).shock > 0.8, "the shockwave is out in a blink");
  assert.ok(at(IMPACT_MS + 700).open > 0.7, "the site is mostly open within 0.7 s of the hit");
  assert.ok(INTRO_MS - IMPACT_MS <= 1200, "no lingering after the explosion");
  assert.equal(at(INTRO_MS).veil, 0);
  assert.equal(at(INTRO_MS + 500).veil, 0);
});

test("the slow drop is smooth: no jump bigger than a little between two 120 Hz frames", () => {
  for (let t = 0; t < IMPACT_MS - 9; t += 4) {
    const a = introPhase(t), b = introPhase(t + 1000 / 120);
    assert.ok(Math.abs(b.drop - a.drop) < 0.03, `drop jumps at ${t}`);
  }
});

test("JW is small: a mark, not a headline", () => {
  assert.ok(JW_SCALE > 0 && JW_SCALE <= 0.12, `JW at ${JW_SCALE} of the short side`);
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
