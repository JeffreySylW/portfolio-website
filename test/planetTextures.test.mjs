// run: NODE_OPTIONS=--experimental-strip-types node --test test/planetTextures.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import sharp from "sharp";

const IDS = ["nasa", "bob", "education", "aspire", "ta"];

async function stats(id) {
  const { data, info } = await sharp(`public/textures/planets/${id}.webp`).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  let r = 0, g = 0, b = 0, gold = 0, bright = 0;
  const n = info.width * info.height;
  for (let i = 0; i < data.length; i += 3) {
    r += data[i]; g += data[i + 1]; b += data[i + 2];
    if (data[i] > 180 && data[i + 1] > 130 && data[i + 2] < 90) gold++;
    if (Math.max(data[i], data[i + 1], data[i + 2]) > 200) bright++;
  }
  return { w: info.width, h: info.height, r: r / n, g: g / n, b: b / n, gold: gold / n, bright: bright / n };
}

test("every planet texture exists at 2048x1024", async () => {
  for (const id of IDS) {
    assert.ok(existsSync(`public/textures/planets/${id}.webp`), `${id}.webp missing`);
    const s = await stats(id);
    assert.deepEqual([s.w, s.h], [2048, 1024], id);
  }
});

test("NASA is blue with white lettering and stars", async () => {
  const s = await stats("nasa");
  assert.ok(s.b > s.r + 40 && s.b > s.g + 20, `not blue: ${JSON.stringify(s)}`);
  assert.ok(s.bright > 0.002, "no white insignia lettering");
});

test("VCU is all black with a gold lockup", async () => {
  const s = await stats("education");
  assert.ok(s.r < 20 && s.g < 20 && s.b < 20, `not black: ${JSON.stringify(s)}`);
  assert.ok(s.gold > 0.005, "no gold lockup");
});

test("Bob is circuit-board green with bright traces", async () => {
  const s = await stats("bob");
  assert.ok(s.g > s.r && s.g > s.b, `not green: ${JSON.stringify(s)}`);
  assert.ok(s.bright > 0.001, "no bright traces");
});

test("ASPIRE is LiDAR green", async () => {
  const s = await stats("aspire");
  assert.ok(s.g > s.r && s.g > s.b, `not green: ${JSON.stringify(s)}`);
});

test("TA is a dim chalkboard with bright chalk", async () => {
  const s = await stats("ta");
  const lum = (s.r + s.g + s.b) / 3;
  assert.ok(lum > 20 && lum < 90, `luminance ${lum}`);
  assert.ok(s.bright > 0.002, "no chalk strokes");
});
