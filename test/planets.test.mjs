import { test } from "node:test";
import assert from "node:assert/strict";
import { paintGlobe, PALETTE, textureStats } from "../src/lib/terminatorPaint.ts";
import { PLANETS, planetSpans } from "../src/content/planets.ts";
import { WORK } from "../src/content/work.ts";
import { monthIndex, galaxyLayout, armPath, GALAXY, planetSun, planetBlockCss, spinLongitude, shimmerStep } from "../src/lib/systemMap.ts";
import { EARTH_VIEW } from "../src/lib/earthView.ts";
import { WHOOSH, whooshGain, whooshFrequency } from "../src/lib/whoosh.ts";

// ---- painter: night ramp for bodies that are not the Earth ----------------------------------------------------

// a grey moon: bright highlands on the left half of the map, dark maria on the right
function greyTexture() {
  const width = 36, height = 18, data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const v = x < 18 ? 170 : 90;
    data.set([v, v, v, 255], (y * width + x) * 4);
  }
  return { width, height, data };
}
const size = 160, c = size / 2;
const stepAt = (img, x, y) => {
  const p = Array.from(img.slice((y * size + x) * 4, (y * size + x) * 4 + 3));
  return PALETTE.findIndex((q) => q[0] === p[0] && q[1] === p[1] && q[2] === p[2]);
};

test("textureStats gives the mean and spread of a texture's luminance", () => {
  const s = textureStats(greyTexture());
  assert.ok(s.mean > 0.45 && s.mean < 0.55, `mean ${s.mean}`);
  assert.ok(s.spread > 0.12 && s.spread < 0.2, `spread ${s.spread}`);
});

test("with a night ramp a grey body's night side keeps its light and dark ground apart", () => {
  const texture = greyTexture();
  // looking at lon 0 (the boundary), sun behind: all night; left of centre = highlands, right = maria
  const img = paintGlobe({ texture, size, pad: 8, lon0: 0, lat0: 0, sun: { lat: 0, lon: 180 }, block: 8, night: textureStats(texture) });
  const bright = [], dark = [];
  for (let y = 40; y < 120; y += 8) { bright.push(stepAt(img, c - 30, y)); dark.push(stepAt(img, c + 30, y)); }
  const avg = (a) => a.reduce((s, v) => s + v, 0) / a.length;
  assert.ok(bright.every((s) => s >= 0) && dark.every((s) => s >= 0), "night side is palette steps");
  assert.ok(avg(bright) > avg(dark) + 0.6, `highlands ${avg(bright)} vs maria ${avg(dark)}`);
  assert.ok(avg(dark) < 3, "the night is mostly deep/indigo, not solid violet");
});

test("ditherShift moves the night pixels without changing the palette or the overall shade", () => {
  const texture = greyTexture();
  const o = { texture, size, pad: 8, lon0: 0, lat0: 0, sun: { lat: 0, lon: 180 }, block: 8, night: textureStats(texture) };
  const a = paintGlobe(o), b = paintGlobe({ ...o, ditherShift: 1 });
  let changed = 0, sa = 0, sb = 0, n = 0;
  for (let y = 20; y < 140; y += 4) for (let x = 20; x < 140; x += 4) {
    const pa = stepAt(a, x, y), pb = stepAt(b, x, y);
    if (pa < 0 || pb < 0) continue;
    if (pa !== pb) changed++;
    sa += pa; sb += pb; n++;
  }
  assert.ok(changed > n * 0.05, `only ${changed} of ${n} night pixels moved`);
  assert.ok(Math.abs(sa / n - sb / n) < 0.15, `shade drifted ${sa / n} -> ${sb / n}`);
});

test("shimmerStep cycles the dither through four positions, a step every quarter second", () => {
  assert.deepEqual([0, 0.26, 0.51, 0.76, 1.01].map(shimmerStep), [0, 1, 2, 3, 0]);
});

// ---- the system map -------------------------------------------------------------------------------------------

test("monthIndex counts months", () => {
  assert.equal(monthIndex("2023-01") - monthIndex("2022-12"), 1);
  assert.equal(monthIndex("2026-08") - monthIndex("2022-08"), 48);
});

test("six planets: VCU, its TA and ASPIRE moons, NASA, Bob (2026-11-17) and Rob Sheinkopf (2026-11-18); no Sports Analytics", () => {
  assert.deepEqual(PLANETS.map((p) => p.id), ["vcu", "ta", "aspire", "nasa", "bob", "sheinkopf"]);
  for (const p of PLANETS) {
    assert.ok(WORK.some((w) => w.id === p.workId), `${p.id} links to a work row`);
    assert.ok(p.label && p.world && p.size > 20, `${p.id} fields`);
  }
});

test("Sheinkopf's world is a stitched baseball (Jeff's choice, 2026-11-18: both of Rob's books are about baseball)", () => {
  const s = PLANETS.find((p) => p.id === "sheinkopf");
  assert.match(s.world, /baseball/);
  assert.equal(s.workId, "sheinkopf");
});

test("NASA's world carries the NASA insignia (Jeff's choice, 2026-11-17)", () => {
  const nasa = PLANETS.find((p) => p.id === "nasa");
  assert.match(nasa.world, /NASA insignia/);
});

test("every planet spins slowly, about a turn a minute or two, in mixed directions", () => {
  for (const p of PLANETS) assert.ok(Math.abs(p.spin) >= 60 && Math.abs(p.spin) <= 180, `${p.id} spin ${p.spin}`);
  assert.ok(PLANETS.some((p) => p.spin > 0) && PLANETS.some((p) => p.spin < 0), "mixed directions");
});

test("spinLongitude turns the face by the spin rate and wraps", () => {
  assert.equal(spinLongitude(10, 120, 0), 10);
  assert.ok(Math.abs(spinLongitude(10, 120, 30) - 100) < 1e-9, "a quarter turn in 30 s");
  assert.ok(Math.abs(spinLongitude(10, -120, 30) - -80) < 1e-9, "negative spin turns the other way");
  const w = spinLongitude(0, 60, 1000);
  assert.ok(w >= -180 && w < 180, `${w}`);
});

const MONTH = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };
const fromText = (s) => { const [m, y] = s.trim().split(" "); return `${y}-${String(MONTH[m]).padStart(2, "0")}`; };

test("every planet's span matches the dates printed in the work list", () => {
  const spans = planetSpans();
  for (const p of PLANETS) {
    const s = spans[p.id];
    const [a, b] = s.dates.split("–");
    assert.equal(s.start, fromText(a), `${p.id} start`);
    if (/present/.test(b)) assert.equal(s.end, undefined, `${p.id} is ongoing`);
    else assert.equal(s.end, fromText(b), `${p.id} end`);
  }
  assert.equal(spans.ta.dates, "Aug 2024 – May 2026");
  assert.equal(spans.aspire.dates, "Aug 2024 – May 2025");
});

test("galaxy layout: oldest near the core, each later world further out along the arm", () => {
  const L = galaxyLayout(planetSpans());
  assert.deepEqual(L.map((b) => b.id), ["vcu", "ta", "aspire", "nasa", "bob", "sheinkopf"]);
  const r = L.map((b) => Math.hypot(b.x - GALAXY.center[0], b.y - GALAXY.center[1]));
  for (let i = 1; i < r.length; i++) assert.ok(r[i] > r[i - 1], `radius ${r}`);
  assert.ok(r[0] < 0.16, "VCU sits near the core");
  for (const b of L) assert.ok(b.x > 0.04 && b.x < 0.96 && b.y > 0.04 && b.y < 0.96, `${b.id} inside the image`);
});

test("galaxy layout: no two worlds overlap (sizes as fractions of the 960 px galaxy)", () => {
  const L = galaxyLayout(planetSpans());
  const size = Object.fromEntries(PLANETS.map((p) => [p.id, p.size / GALAXY.designPx]));
  for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) {
    const d = Math.hypot(L[i].x - L[j].x, L[i].y - L[j].y);
    assert.ok(d > (size[L[i].id] + size[L[j].id]) / 2 + 0.02, `${L[i].id}/${L[j].id} ${d.toFixed(3)}`);
  }
});

test("galaxy layout: labels go on the outer side of each world", () => {
  for (const b of galaxyLayout(planetSpans())) assert.equal(b.labelSide, b.x < GALAXY.center[0] ? "left" : "right", b.id);
});

test("armPath runs from inside the core out past the newest world, as SVG points in 0..100", () => {
  const pts = armPath(40);
  assert.ok(pts.length === 40);
  for (const [x, y] of pts) assert.ok(x >= 0 && x <= 100 && y >= 0 && y <= 100);
  const rad = ([x, y]) => Math.hypot(x / 100 - GALAXY.center[0], y / 100 - GALAXY.center[1]);
  const L = galaxyLayout(planetSpans());
  assert.ok(rad(pts[0]) < Math.hypot(L[0].x - GALAXY.center[0], L[0].y - GALAXY.center[1]));
  assert.ok(rad(pts.at(-1)) >= Math.hypot(L.at(-1).x - GALAXY.center[0], L.at(-1).y - GALAXY.center[1]) - 1e-9);
});

// sun position in a view's screen frame: x right, y up, z towards the viewer
const D2R = Math.PI / 180;
function screen(sun, lon0, lat0) {
  const v = [Math.cos(sun.lat * D2R) * Math.cos(sun.lon * D2R), Math.cos(sun.lat * D2R) * Math.sin(sun.lon * D2R), Math.sin(sun.lat * D2R)];
  const [l, p] = [lon0 * D2R, lat0 * D2R];
  const e = [-Math.sin(l), Math.cos(l), 0];
  const n = [-Math.sin(p) * Math.cos(l), -Math.sin(p) * Math.sin(l), Math.cos(p)];
  const f = [Math.cos(p) * Math.cos(l), Math.cos(p) * Math.sin(l), Math.sin(p)];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  return { x: dot(v, e), y: dot(v, n), z: dot(v, f) };
}

test("planetSun: light comes from the same side of the screen as on the Earth, and planets stay mostly lit", () => {
  for (const sun of [{ lat: -19, lon: -147 }, { lat: 23, lon: 120 }, { lat: 5, lon: -62 }, { lat: -10, lon: 10 }]) {
    const earth = screen(sun, EARTH_VIEW.lon0, EARTH_VIEW.lat0);
    for (const face of [0, 10, 40, -120]) {
      const s = screen(planetSun(sun, face), face, EARTH_VIEW.lat0);
      const diff = Math.abs(Math.atan2(s.y, s.x) - Math.atan2(earth.y, earth.x));
      assert.ok(Math.min(diff, 2 * Math.PI - diff) < 1e-6, `${JSON.stringify(sun)} face ${face}: direction`);
      assert.ok(s.z > 0.2 && s.z < 0.6, `gibbous phase, z=${s.z}`);
    }
  }
});

test("planetSun: with the sun straight behind or in front of the Earth, light falls from the left", () => {
  const behind = { lat: -EARTH_VIEW.lat0, lon: EARTH_VIEW.lon0 + 180 };
  const s = screen(planetSun(behind, 0), 0, EARTH_VIEW.lat0);
  assert.ok(s.x < -0.8, `x=${s.x}`);
});

test("small bodies get finer night pixels, big ones the Earth's 7 px", () => {
  assert.equal(planetBlockCss(400), EARTH_VIEW.blockCss);
  assert.equal(planetBlockCss(140), 3.5);
  assert.equal(planetBlockCss(40), 3);
});

// ---- the hover whoosh -----------------------------------------------------------------------------------------

test("whoosh: silent at the start and the end, peaks after the attack, stays quiet", () => {
  assert.equal(whooshGain(0), 0);
  assert.ok(Math.abs(whooshGain(WHOOSH.attack) - WHOOSH.peak) < 1e-9);
  assert.ok(whooshGain(WHOOSH.duration) < 0.001);
  assert.ok(WHOOSH.peak <= 0.15, "never loud");
  for (let t = 0; t <= WHOOSH.duration; t += 0.01) assert.ok(whooshGain(t) <= WHOOSH.peak + 1e-9);
});

test("whoosh: the filter sweeps up then settles, like air moving past", () => {
  const f0 = whooshFrequency(0), fMid = whooshFrequency(WHOOSH.duration * 0.35), f1 = whooshFrequency(WHOOSH.duration);
  assert.ok(fMid > f0 * 3 && fMid > f1 * 2, `${f0} ${fMid} ${f1}`);
});
