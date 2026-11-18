import { test } from "node:test";
import assert from "node:assert/strict";
import { pinPosition } from "../src/lib/pins.ts";
import { sunReadout, formatLatLon } from "../src/lib/readout.ts";

const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b}`);

test("Richmond and Hampton pins land where the baked globe shows Virginia", () => {
  const r = pinPosition("richmond");
  near(r.x, 0.4058, 0.002, "richmond x");
  near(r.y, 0.3756, 0.002, "richmond y");
  const h = pinPosition("hampton");
  assert.ok(h.x > r.x && h.y > r.y, "Hampton is east and south of Richmond");
});

test("lat/lon format uses hemispheres and one decimal", () => {
  assert.equal(formatLatLon(-19.34, -151.25), "19.3°S 151.3°W");
  assert.equal(formatLatLon(23.44, 4.1), "23.4°N 4.1°E");
});

test("readout says where the sun is overhead and whether Richmond is in daylight", () => {
  const day = sunReadout(new Date("2026-11-17T17:00:00Z"));
  assert.equal(day.richmond, "day");
  assert.match(day.overhead, /^\d+\.\d°S \d+\.\d°[EW]$/);
  assert.equal(sunReadout(new Date("2026-11-17T05:00:00Z")).richmond, "night");
});
