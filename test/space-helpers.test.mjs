import { test } from "node:test";
import assert from "node:assert/strict";
import { canUseWebGL } from "../src/lib/webgl.ts";
import { prefersReducedMotion } from "../src/lib/motion.ts";

test("canUseWebGL is true when webgl2 or webgl is available", () => {
  const doc = { createElement: () => ({ getContext: (t) => (t === "webgl" ? {} : null) }) };
  assert.equal(canUseWebGL(doc), true);
});

test("canUseWebGL is false when no context is returned", () => {
  const doc = { createElement: () => ({ getContext: () => null }) };
  assert.equal(canUseWebGL(doc), false);
});

test("canUseWebGL is false when getContext throws (blocked or lost context)", () => {
  const doc = {
    createElement: () => ({
      getContext: () => {
        throw new Error("blocked");
      },
    }),
  };
  assert.equal(canUseWebGL(doc), false);
});

test("prefersReducedMotion reads the media query", () => {
  assert.equal(prefersReducedMotion({ matchMedia: () => ({ matches: true }) }), true);
  assert.equal(prefersReducedMotion({ matchMedia: () => ({ matches: false }) }), false);
  assert.equal(prefersReducedMotion({}), false);
});

import {
  bodyPosition,
  cameraTargetFor,
  easeInOutCubic,
  lerpVec,
  flightDurationMs,
  rotateY,
} from "../src/lib/cameraPath.ts";

test("bodyPosition keeps a planet on its orbit radius", () => {
  const [x, y, z] = bodyPosition({ orbitRadius: 6, startAngleDeg: 20 }, 3.7);
  assert.ok(Math.abs(Math.hypot(x, z) - 6) < 1e-9);
  assert.equal(y, 0);
});

test("bodyPosition moves over time", () => {
  const a = bodyPosition({ orbitRadius: 6, startAngleDeg: 0 }, 0);
  const b = bodyPosition({ orbitRadius: 6, startAngleDeg: 0 }, 2);
  assert.notDeepEqual(a, b);
});

test("cameraTargetFor sits the requested distance in front of the body", () => {
  const { position, lookAt } = cameraTargetFor([6, 0, 0], 4);
  assert.deepEqual(lookAt, [6, 0, 0]);
  const d = Math.hypot(position[0] - 6, position[2]);
  assert.ok(Math.abs(d - 4) < 1e-9);
});

test("easeInOutCubic hits its endpoints and is monotonic", () => {
  assert.equal(easeInOutCubic(0), 0);
  assert.equal(easeInOutCubic(1), 1);
  assert.ok(easeInOutCubic(0.25) < easeInOutCubic(0.75));
});

test("lerpVec interpolates each axis", () => {
  assert.deepEqual(lerpVec([0, 0, 0], [10, -4, 2], 0.5), [5, -2, 1]);
});

test("flightDurationMs is bounded for short and long flights", () => {
  assert.equal(flightDurationMs([0, 0, 0], [0, 0, 0]), 600);
  assert.equal(flightDurationMs([0, 0, 0], [100, 0, 0]), 1400);
});

test("rotateY keeps distance from the axis and is periodic", () => {
  const v = [3, 2, 4];
  const [x, y, z] = rotateY(v, 1.234);
  assert.ok(Math.abs(Math.hypot(x, z) - 5) < 1e-9);
  assert.equal(y, 2);
  const w = rotateY(v, 2 * Math.PI);
  v.forEach((c, i) => assert.ok(Math.abs(w[i] - c) < 1e-9));
});
