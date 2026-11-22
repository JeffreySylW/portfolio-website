import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import {
  INTRO_MS,
  FAILSAFE_MS,
  LAND_MS,
  POINT_MS,
  IMPACT1_MS,
  IMPACT2_MS,
  BURST_MS,
  JW_SCALE,
  introScript,
  introPhase,
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

test("the ink drop falls slowly down the middle and lands at LAND_MS", () => {
  assert.equal(introPhase(0).drop, 0);
  assert.ok(introPhase(LAND_MS - 1).drop > 0.99, "landed");
  assert.ok(introPhase(LAND_MS * 0.5).drop < 0.3, "slow at first, gravity");
  assert.equal(introPhase(LAND_MS + 50).drop, 1);
  assert.ok(LAND_MS >= 500 && LAND_MS <= 900, `${LAND_MS}`);
});

test("ink strokes sweep in from every side after the landing and are all in by POINT_MS", () => {
  assert.equal(introPhase(LAND_MS).sweep, 0);
  assert.ok(introPhase(LAND_MS + 150).sweep > 0, "strokes start right after the landing");
  assert.ok(introPhase(POINT_MS - 20).sweep >= 0.99, "the last stroke is in as the point forms");
  assert.equal(introPhase(POINT_MS).sweep, 1);
});

test("the ink condenses to a point in the middle, which then holds still for a beat", () => {
  const mass = (t) => introPhase(t).mass;
  assert.ok(mass(LAND_MS + 300) > 0.8, "a body of ink has gathered before it shrinks");
  assert.ok(mass(POINT_MS) <= 0.05 && mass(POINT_MS) > 0, "a tiny point remains, not nothing");
  assert.equal(introPhase(LAND_MS + 100).impact, 0);
  assert.equal(introPhase(POINT_MS).impact, 0, "no impact until the beat has been held");
  assert.ok(IMPACT1_MS - POINT_MS >= 40 && IMPACT1_MS - POINT_MS <= 120, "a short hold on the point");
  for (let t = LAND_MS + 100; t <= POINT_MS; t += 8) assert.ok(mass(t + 8) <= mass(t) + 1e-9 || t < LAND_MS + 380, `mass grows again at ${t}`);
  assert.ok(introPhase(POINT_MS - 5).converge >= 0.99 && introPhase(LAND_MS).converge === 0, "converge runs 0..1 to the point");
});

test("two hard impact frames: inverted, then normal, only between IMPACT1 and BURST", () => {
  assert.equal(introPhase(IMPACT1_MS - 1).impact, 0);
  assert.equal(introPhase(IMPACT1_MS).impact, 1);
  assert.equal(introPhase(IMPACT2_MS - 1).impact, 1);
  assert.equal(introPhase(IMPACT2_MS).impact, 2);
  assert.equal(introPhase(BURST_MS - 1).impact, 2);
  assert.equal(introPhase(BURST_MS).impact, 0);
  assert.ok(BURST_MS - IMPACT1_MS >= 100 && BURST_MS - IMPACT1_MS <= 160, "hard frames, over in a blink");
});

test("JW shows in the impact frames, is carried off by the blast, and is never there otherwise", () => {
  assert.equal(introPhase(POINT_MS).jw, 0);
  assert.equal(introPhase(IMPACT1_MS).jw, 1);
  assert.equal(introPhase(BURST_MS - 1).jw, 1);
  assert.ok(introPhase(BURST_MS + 100).jw < 1 && introPhase(BURST_MS + 100).jw > 0);
  assert.equal(introPhase(BURST_MS + 200).jw, 0);
  assert.equal(introPhase(LAND_MS + 100).jw, 0);
});

test("the explosion itself reveals the site: nothing opens before the hit, it is mostly open within 0.35 s", () => {
  assert.equal(introPhase(BURST_MS - 1).open, 0, "the page stays hidden until the blast");
  assert.equal(introPhase(IMPACT1_MS + 20).open, 0);
  assert.ok(introPhase(BURST_MS + 40).open > 0, "opens from the very first blast frames");
  assert.ok(introPhase(BURST_MS + 350).open >= 0.9, "most of the page is open within 0.35 s of the hit");
  assert.equal(introPhase(BURST_MS + 700).open, 1);
  assert.equal(introPhase(INTRO_MS).veil, 0);
  assert.ok(INTRO_MS - BURST_MS <= 900, "no separate pan or wipe after the explosion");
});

test("the blast has ink slashes, a shockwave ring and a short white flash", () => {
  assert.equal(introPhase(BURST_MS - 1).slashes, 0);
  assert.ok(introPhase(BURST_MS + 120).slashes > 0.5, "slashes shoot out fast");
  assert.equal(introPhase(BURST_MS + 400).slashes, 1);
  assert.equal(introPhase(BURST_MS - 1).flash, 0);
  assert.ok(introPhase(BURST_MS + 30).flash > 0.9, "flash peaks as the blast starts");
  assert.equal(introPhase(BURST_MS + 150).flash, 0, "and is gone within 0.15 s");
  assert.equal(introPhase(BURST_MS - 1).ring, 0);
  assert.ok(introPhase(BURST_MS + 200).ring > 0.5 && introPhase(BURST_MS + 200).ring < 1);
  assert.equal(introPhase(BURST_MS + 500).ring, 1);
  assert.equal(introPhase(BURST_MS + 100).ink, 1, "the ink is still there early in the blast");
  assert.equal(introPhase(BURST_MS + 550).ink, 0, "and has faded off the site by the end");
});

test("every phase value stays in 0..1 and only moves the way it should", () => {
  const mono = ["drop", "sweep", "open", "slashes", "ring"];
  let last = null;
  for (let t = 0; t <= INTRO_MS + 100; t += 4) {
    const p = introPhase(t);
    for (const k of ["drop", "sweep", "converge", "mass", "jw", "open", "veil", "slashes", "ring", "flash", "ink"]) assert.ok(p[k] >= 0 && p[k] <= 1, `${k} ${p[k]} at ${t}`);
    assert.ok([0, 1, 2].includes(p.impact));
    assert.ok(Math.abs(p.veil - (1 - p.open)) < 1e-9);
    if (last) for (const k of mono) assert.ok(p[k] >= last[k] - 1e-9, `${k} goes back at ${t}`);
    last = p;
  }
});

test("the slow drop is smooth: no jump bigger than a little between two 120 Hz frames", () => {
  for (let t = 0; t < LAND_MS - 9; t += 4) {
    const a = introPhase(t), b = introPhase(t + 1000 / 120);
    assert.ok(Math.abs(b.drop - a.drop) < 0.03, `drop jumps at ${t}`);
  }
});

test("JW is a mark, not a headline", () => {
  assert.ok(JW_SCALE > 0 && JW_SCALE <= 0.12, `JW at ${JW_SCALE} of the short side`);
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
