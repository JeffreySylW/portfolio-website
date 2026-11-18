import { test } from "node:test";
import assert from "node:assert/strict";
import { statSync, readFileSync } from "node:fs";
import sharp from "sharp";

const kb = (f) => statSync(f).size / 1024;

test("baked globes exist, are square, and stay small enough for a fast first paint", async () => {
  for (const [size, budget] of [[1600, 200], [1200, 130], [900, 100]]) {
    const f = `public/textures/earth/globe-${size}.webp`;
    const m = await sharp(f).metadata();
    assert.equal(m.width, size); assert.equal(m.height, size); assert.ok(m.hasAlpha);
    assert.ok(kb(f) < budget, `${f} is ${kb(f)} KB`);
  }
});

test("the live-redraw texture is 2700x1350 and under 400 KB", async () => {
  const f = "public/textures/earth/day-2700.webp";
  const m = await sharp(f).metadata();
  assert.equal(m.width, 2700); assert.equal(m.height, 1350);
  assert.ok(kb(f) < 400, `${kb(f)} KB`);
});

test("credits name the Blue Marble source", () => {
  assert.match(readFileSync("public/textures/CREDITS.md", "utf8"), /Blue Marble Next Generation/);
});
