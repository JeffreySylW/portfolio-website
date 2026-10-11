// run: NODE_OPTIONS=--experimental-strip-types node --test test/planetSpin.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { nextSpin, PLANET_SPIN_SPEED } from "../src/lib/cameraPath.ts";

const TURN = 2 * Math.PI;
const run = (offset, seconds, speed) => {
  for (let t = 0; t < seconds; t += 1 / 60) offset = nextSpin(offset, 1 / 60, speed);
  return offset;
};

test("every planet keeps turning at its speed, including the one being followed", () => {
  assert.ok(Math.abs(nextSpin(1, 0.5, 0.4) - 1.2) < 1e-12);
  assert.ok(run(0, 3, 0.25) > 0.7, "planet did not turn");
});

test("the turn wraps at a full revolution so it never grows without bound", () => {
  const wrapped = nextSpin(TURN - 0.05, 1, 0.4);
  assert.ok(wrapped >= 0 && wrapped < TURN, `offset ${wrapped} not wrapped`);
  assert.ok(Math.abs(wrapped - 0.35) < 1e-9);
  const long = run(0, 600, 0.25);
  assert.ok(long >= 0 && long < TURN);
});

test("speed 0 (reduced motion) leaves the logo facing the camera", () => {
  assert.equal(run(0, 5, 0), 0);
});

test("planets turn slowly: one full turn takes about a minute", () => {
  assert.ok(PLANET_SPIN_SPEED > 0, "planets must still turn");
  const secondsPerTurn = TURN / PLANET_SPIN_SPEED;
  assert.ok(secondsPerTurn >= 55 && secondsPerTurn <= 75, `one turn takes ${secondsPerTurn.toFixed(0)}s`);
});

test("a planet turning the other way still wraps into [0, 2π)", () => {
  const w = nextSpin(0.05, 1, -0.4);
  assert.ok(w >= 0 && w < TURN, `offset ${w} not wrapped`);
  assert.ok(Math.abs(w - (TURN - 0.35)) < 1e-9);
});
