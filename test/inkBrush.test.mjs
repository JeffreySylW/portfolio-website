import { test } from "node:test";
import assert from "node:assert/strict";
import { hash, vnoise, makePath, sweepStrokes, slashes, jwGlyphs, SWEEP_COUNT, SLASH_COUNT } from "../src/lib/inkBrush.ts";

const quadrants = (angles) => new Set(angles.map((a) => `${Math.cos(a) > 0}${Math.sin(a) > 0}`)).size;

test("hash and value noise are repeatable and stay in 0..1", () => {
  assert.equal(hash(3, 4), hash(3, 4));
  assert.notEqual(hash(3, 4), hash(4, 3));
  for (let i = 0; i < 500; i++) {
    const h = hash(i, i * 7), n = vnoise(i % 13, i * 0.37), p = vnoise(5, i * 0.37, 7);
    for (const v of [h, n, p]) assert.ok(v >= 0 && v <= 1, `${v}`);
  }
  assert.equal(vnoise(2, 0, 7), vnoise(2, 7, 7), "periodic noise wraps");
});

test("a brush path runs through its first and last control points with unit normals", () => {
  const ctrl = [[0, 0], [10, 5], [20, -5], [40, 0]];
  const path = makePath(ctrl, 60);
  assert.equal(path.pts.length, 61);
  assert.deepEqual(path.pts[0].map(Math.round), [0, 0]);
  assert.deepEqual(path.pts[60].map(Math.round), [40, 0]);
  for (const [nx, ny] of path.nrm) assert.ok(Math.abs(Math.hypot(nx, ny) - 1) < 1e-6);
});

test("the sweep strokes come from every side, start off-screen and end at the middle", () => {
  const reach = 800;
  const s = sweepStrokes(reach);
  assert.equal(s.length, SWEEP_COUNT);
  assert.equal(SWEEP_COUNT, 9);
  assert.equal(quadrants(s.map((x) => x.angle)), 4);
  for (const x of s) {
    const first = x.ctrl[0], last = x.ctrl[x.ctrl.length - 1];
    assert.ok(Math.hypot(...first) >= reach, "starts at or beyond the corner");
    assert.ok(Math.hypot(...last) < reach * 0.05, "ends at the middle");
    assert.ok(x.width > 0 && x.delay >= 0);
  }
  assert.deepEqual(sweepStrokes(reach), sweepStrokes(reach), "the same every visit");
  const radii = s[0].ctrl.map((p) => Math.hypot(...p));
  for (let i = 1; i < radii.length; i++) assert.ok(radii[i] < radii[i - 1], "each stroke spirals steadily inward");
});

test("the blast slashes fan out all round, longer than the distance to the corners, the same every visit", () => {
  const reach = 800;
  const s = slashes(reach);
  assert.equal(s.length, SLASH_COUNT);
  assert.equal(SLASH_COUNT, 12);
  assert.equal(quadrants(s.map((x) => x.angle)), 4);
  for (const x of s) {
    const end = x.ctrl[x.ctrl.length - 1];
    assert.ok(Math.hypot(...end) > reach * 0.8, "reaches the screen edge");
    assert.ok(x.width > 0);
  }
  assert.deepEqual(slashes(reach), slashes(reach));
});

test("JW is three brush strokes (the J's top bar, the J, the W) inside a box of height H", () => {
  const g = jwGlyphs(0, 0, 100);
  assert.equal(g.length, 3);
  for (const stroke of g) for (const [x, y] of stroke) assert.ok(Math.abs(x) <= 70 && Math.abs(y) <= 60, `${x},${y}`);
});
