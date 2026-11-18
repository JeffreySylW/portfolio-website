import { test } from "node:test";
import assert from "node:assert/strict";
import { paintGlobe, PALETTE, textureStats } from "../src/lib/terminatorPaint.ts";
import { PLANETS, planetSpans } from "../src/content/planets.ts";
import { WORK } from "../src/content/work.ts";
import { monthIndex, systemLayout, planetSun, planetBlockCss } from "../src/lib/systemMap.ts";
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

// ---- the system map -------------------------------------------------------------------------------------------

test("monthIndex counts months", () => {
  assert.equal(monthIndex("2023-01") - monthIndex("2022-12"), 1);
  assert.equal(monthIndex("2026-08") - monthIndex("2022-08"), 48);
});

test("one planet per experience: VCU, its TA and ASPIRE moons, Sports Analytics, NASA and Bob", () => {
  assert.deepEqual(PLANETS.map((p) => p.id), ["vcu", "ta", "aspire", "sports-analytics", "nasa", "bob"]);
  for (const p of PLANETS) {
    assert.ok(WORK.some((w) => w.id === p.workId), `${p.id} links to a work row`);
    assert.ok(p.label && p.world && p.size > 20, `${p.id} fields`);
  }
});

test("NASA's world is the Moon, never the insignia", () => {
  const nasa = PLANETS.find((p) => p.id === "nasa");
  assert.match(nasa.world, /Moon/);
  assert.ok(!/insignia|logo|meatball/i.test(JSON.stringify(PLANETS)));
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

test("layout: oldest first, each planet at its start, its trail to its end (ongoing runs to now)", () => {
  const now = new Date(Date.UTC(2026, 10, 17));
  const L = systemLayout(planetSpans(), now);
  assert.deepEqual(L.bodies.map((b) => b.id), ["vcu", "ta", "aspire", "sports-analytics", "nasa", "bob"]);
  const by = Object.fromEntries(L.bodies.map((b) => [b.id, b]));
  assert.equal(by.vcu.x0, 0);
  assert.equal(by.bob.x1, 1, "Bob runs to now");
  for (const b of L.bodies) assert.ok(b.x0 >= 0 && b.x1 <= 1 && b.x0 < b.x1, `${b.id} ${b.x0}..${b.x1}`);
  assert.equal(by.ta.x0, by.aspire.x0, "TA and ASPIRE started together");
  assert.ok(by.aspire.x1 < by.ta.x1);
  assert.ok(by["nasa"].x0 > by["sports-analytics"].x0 && by["bob"].x0 > by["nasa"].x0);
  // labels go on the side with room
  assert.equal(by.vcu.labelSide, "right");
  assert.equal(by.bob.labelSide, "left");
});

test("layout ticks: one per January in range, then Now at the end", () => {
  const L = systemLayout(planetSpans(), new Date(Date.UTC(2026, 10, 17)));
  assert.deepEqual(L.ticks.map((t) => t.label), ["2023", "2024", "2025", "2026", "Now"]);
  const t = L.ticks;
  for (let i = 1; i < t.length; i++) assert.ok(t[i].x > t[i - 1].x);
  assert.equal(t.at(-1).x, 1);
  // Jan 2023 is 5 of the 51 months after Aug 2022
  assert.ok(Math.abs(t[0].x - 5 / 51) < 1e-9, `${t[0].x}`);
});

test("planetSun keeps the Earth's light direction on screen whatever face a planet shows", () => {
  const sun = { lat: -19, lon: -147 };
  assert.deepEqual(planetSun(sun, EARTH_VIEW.lon0), sun);
  const s = planetSun(sun, EARTH_VIEW.lon0 + 100);
  assert.equal(s.lat, sun.lat);
  assert.ok(Math.abs(((s.lon - sun.lon + 540) % 360) - 180 - 100) < 1e-9);
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
