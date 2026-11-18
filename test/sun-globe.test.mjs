import { test } from "node:test";
import assert from "node:assert/strict";
import { subsolarPoint, isDaylight } from "../src/lib/sun.ts";
import { project, unproject } from "../src/lib/globe.ts";

const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b}`);

test("June solstice 2026: the sun is over the Tropic of Cancer", () => {
  near(subsolarPoint(new Date("2026-06-21T08:24:00Z")).lat, 23.44, 0.05, "lat");
});

test("December solstice 2026: the sun is over the Tropic of Capricorn", () => {
  near(subsolarPoint(new Date("2026-12-21T20:50:00Z")).lat, -23.44, 0.05, "lat");
});

test("March equinox 2026: the sun is over the equator", () => {
  near(subsolarPoint(new Date("2026-03-20T14:46:00Z")).lat, 0, 0.05, "lat");
});

test("at 12:00 UTC the sun sits near Greenwich, offset by the equation of time", () => {
  // early November the equation of time is about +16.4 min, solar noon at Greenwich is 11:44 UTC, so by 12:00 the sun is ~4.1° west
  near(subsolarPoint(new Date("2026-11-03T12:00:00Z")).lon, -4.1, 0.3, "Nov lon");
  // mid February it is about -14.2 min, solar noon is 12:14 UTC, so at 12:00 the sun is ~3.6° east
  near(subsolarPoint(new Date("2026-02-11T12:00:00Z")).lon, 3.55, 0.3, "Feb lon");
});

test("longitude moves 15° west per hour and stays in [-180, 180)", () => {
  const a = subsolarPoint(new Date("2026-11-17T00:00:00Z")).lon;
  const b = subsolarPoint(new Date("2026-11-17T01:00:00Z")).lon;
  near(((a - b + 540) % 360) - 180, 15, 0.05, "per hour");
  for (let h = 0; h < 24; h++) {
    const { lon } = subsolarPoint(new Date(Date.UTC(2026, 10, 17, h)));
    assert.ok(lon >= -180 && lon < 180, `lon ${lon}`);
  }
});

test("Richmond is in daylight at 17:00 UTC and in the dark at 05:00 UTC in November", () => {
  assert.equal(isDaylight(37.54, -77.44, new Date("2026-11-17T17:00:00Z")), true);
  assert.equal(isDaylight(37.54, -77.44, new Date("2026-11-17T05:00:00Z")), false);
});

const view = { lon0: -62, lat0: 22, radius: 500, cx: 600, cy: 550 };

test("the view centre projects to the disc centre", () => {
  const p = project(-62, 22, view);
  near(p.x, 600, 1e-6, "x");
  near(p.y, 550, 1e-6, "y");
  assert.equal(p.visible, true);
});

test("project and unproject round-trip for points on the near side", () => {
  for (const [lon, lat] of [[-77.44, 37.54], [-76.36, 37.08], [-40, -10], [-100, 60]]) {
    const p = project(lon, lat, view);
    assert.equal(p.visible, true);
    const q = unproject(p.x, p.y, view);
    near(q.lon, lon, 1e-6, "lon");
    near(q.lat, lat, 1e-6, "lat");
  }
});

test("points on the far side are not visible; outside the disc unprojects to null", () => {
  assert.equal(project(118, -22, view).visible, false);
  assert.equal(unproject(600 + 501, 550, view), null);
});

test("north is up and east is right", () => {
  assert.ok(project(-62, 40, view).y < 550);
  assert.ok(project(-50, 22, view).x > 600);
});
