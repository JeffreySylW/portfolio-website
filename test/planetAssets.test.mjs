import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, statSync, readFileSync } from "node:fs";
import sharp from "sharp";
import { PLANETS } from "../src/content/planets.ts";

const kb = (f) => statSync(f).size / 1024;
const DIR = "public/textures/planets";

test("each planet has a baked image at twice its desktop size, with alpha, and small", async () => {
  let total = 0;
  for (const p of PLANETS) {
    const f = `${DIR}/${p.id}.webp`;
    const m = await sharp(f).metadata();
    assert.equal(m.width, p.size * 2, `${f} width`);
    assert.equal(m.height, p.size * 2, `${f} height`);
    assert.ok(m.hasAlpha, `${f} alpha`);
    total += kb(f);
  }
  assert.ok(total < 200, `baked planets total ${total.toFixed(0)} KB`);
});

test("each planet has a 1024x512 texture for the live repaint, under 220 KB", async () => {
  for (const p of PLANETS) {
    const f = `${DIR}/${p.id}-tex.webp`;
    const m = await sharp(f).metadata();
    assert.equal(m.width, 1024, f); assert.equal(m.height, 512, f);
    assert.ok(kb(f) < 220, `${f} ${kb(f).toFixed(0)} KB`);
  }
});

test("high-resolution masters are baked at 4096x2048 for the made worlds", async () => {
  for (const id of ["vcu", "ta", "aspire", "bob", "nasa"]) {
    const m = await sharp(`scripts/assets/planets/${id}-4096.webp`).metadata();
    assert.equal(m.width, 4096); assert.equal(m.height, 2048);
  }
});

test("the credits name every outside texture and record the NASA insignia's restriction", () => {
  const credits = readFileSync("public/textures/CREDITS.md", "utf8");
  assert.match(credits, /Solar System Scope/);
  assert.match(credits, /CC BY 4\.0/);
  assert.match(credits, /Neptune/);
  assert.match(credits, /VCU/);
  assert.match(credits, /14 CFR 1221/);
  assert.ok(existsSync("scripts/assets/planets/nasa-logo.svg"));
  assert.ok(!existsSync("scripts/assets/planets/moon-4096.jpg"), "the unused Moon map is gone");
});
