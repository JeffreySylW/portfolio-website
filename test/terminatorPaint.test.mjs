import { test } from "node:test";
import assert from "node:assert/strict";
import { paintGlobe, PALETTE } from "../src/lib/terminatorPaint.ts";

// 36x18 fake world: a green continent between 100°W and 60°W, blue ocean elsewhere
function fakeTexture() {
  const width = 36, height = 18, data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const lon = -180 + (x + 0.5) * 10;
    const land = lon > -100 && lon < -60;
    const i = (y * width + x) * 4;
    data.set(land ? [60, 120, 60, 255] : [20, 40, 120, 255], i);
  }
  return { width, height, data };
}

const size = 200, pad = 12, radius = (size - 2 * pad) / 2, c = size / 2;
const base = { texture: fakeTexture(), size, pad, lon0: -80, lat0: 0, block: 8 };
const px = (img, x, y) => Array.from(img.slice((y * size + x) * 4, (y * size + x) * 4 + 4));
const inPalette = ([r, g, b]) => PALETTE.some((p) => p[0] === r && p[1] === g && p[2] === b);

test("returns an RGBA image of the requested size", () => {
  const img = paintGlobe({ ...base, sun: { lat: 0, lon: -80 } });
  assert.equal(img.length, size * size * 4);
});

test("the point under the sun is the photo, not a palette step", () => {
  const img = paintGlobe({ ...base, sun: { lat: 0, lon: -80 } });
  const p = px(img, c, c);
  assert.equal(p[3], 255);
  assert.ok(!inPalette(p), `centre ${p}`);
  assert.ok(p[1] > p[2], "green land shows through");
});

test("with the sun behind the globe, the near side is all indigo pixel steps", () => {
  const img = paintGlobe({ ...base, sun: { lat: 0, lon: 100 } });
  for (const [x, y] of [[c, c], [c - 40, c + 20], [c + 50, c - 30]]) {
    const p = px(img, x, y);
    assert.ok(inPalette(p), `(${x},${y}) ${p}`);
  }
});

test("night pixels come in solid blocks", () => {
  const img = paintGlobe({ ...base, sun: { lat: 0, lon: 100 } });
  const x0 = 96, y0 = 96; // inside one 8px block (96..103)
  const first = px(img, x0, y0);
  for (let dy = 0; dy < 8; dy++) for (let dx = 0; dx < 8; dx++) assert.deepEqual(px(img, x0 + dx, y0 + dy), first);
});

test("land at night is lighter than ocean at night", () => {
  const img = paintGlobe({ ...base, sun: { lat: 0, lon: 100 } });
  const lum = (p) => p[0] + p[1] + p[2];
  assert.ok(lum(px(img, c, c)) > lum(px(img, c + 70, c)), "continent vs ocean");
});

test("corners are transparent and the night limb has the violet outline", () => {
  const img = paintGlobe({ ...base, sun: { lat: 0, lon: 100 } });
  assert.equal(px(img, 0, 0)[3], 0);
  const edge = px(img, c + Math.floor(radius) - 3, c);
  assert.deepEqual(edge.slice(0, 3), PALETTE[3]);
});

test("same input, same pixels", () => {
  const a = paintGlobe({ ...base, sun: { lat: 10, lon: -30 } });
  const b = paintGlobe({ ...base, sun: { lat: 10, lon: -30 } });
  assert.deepEqual(a, b);
});
