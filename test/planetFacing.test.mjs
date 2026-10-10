// run: NODE_OPTIONS=--experimental-strip-types node --test test/planetFacing.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { faceYaw } from "../src/lib/cameraPath.ts";

// three.js rotation about Y by phi sends the +X axis to (cos phi, 0, -sin phi).
const facing = (phi) => [Math.cos(phi), 0, -Math.sin(phi)];
const unit = (from, to) => {
  const d = [to[0] - from[0], to[1] - from[1], to[2] - from[2]];
  const n = Math.hypot(d[0], d[2]);
  return [d[0] / n, 0, d[2] / n];
};
const near = (a, b) => a.every((v, i) => Math.abs(v - b[i]) < 1e-9);

test("the texture centre points at the camera from all four sides", () => {
  const body = [3, 0, -2];
  for (const cam of [[10, 5, -2], [3, 1, 9], [-8, 2, -2], [3, 4, -15], [7, 3, 6]]) {
    assert.ok(near(facing(faceYaw(body, cam)), unit(body, cam)), `camera ${cam}`);
  }
});

test("height of the camera does not change the yaw", () => {
  assert.equal(faceYaw([0, 0, 0], [5, 0, 5]), faceYaw([0, 0, 0], [5, 40, 5]));
});

test("a camera straight above (or exactly on) the body gives 0, never NaN", () => {
  assert.equal(faceYaw([1, 2, 3], [1, 9, 3]), 0);
  assert.equal(faceYaw([1, 2, 3], [1, 2, 3]), 0);
});
