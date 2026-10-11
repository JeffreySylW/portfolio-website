import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import * as S from "../src/content/space.ts";

test("every body has a unique id and the required copy fields", () => {
  const ids = S.BODIES.map((b) => b.id);
  assert.equal(new Set(ids).size, ids.length, "ids must be unique");
  for (const b of S.BODIES) {
    assert.ok(b.name && b.subtitle && b.summary, `${b.id} needs name, subtitle, summary`);
    assert.ok(Array.isArray(b.tools) && b.tools.length > 0, `${b.id} needs tools`);
  }
});

test("exactly two planets, the ISS, its modules and the stars", () => {
  const count = (k) => S.BODIES.filter((b) => b.kind === k).length;
  assert.equal(count("planet"), 2);
  assert.equal(count("station"), 1);
  assert.equal(count("module"), 2);
  assert.equal(count("star"), 4);
});

test("every parent reference points to a real body", () => {
  const ids = new Set(S.BODIES.map((b) => b.id));
  for (const b of S.BODIES) {
    if (b.parent) assert.ok(ids.has(b.parent), `${b.id} parent ${b.parent} missing`);
  }
});

test("modules attach to the station", () => {
  for (const b of S.BODIES.filter((x) => x.kind === "module")) {
    assert.equal(b.parent, "education");
  }
});

test("timeline lists every planet, the station and its modules, newest first", () => {
  const planets = S.BODIES.filter((b) => b.kind === "planet").map((b) => b.id);
  for (const id of [...planets, "education", "aspire", "ta"]) {
    assert.ok(S.TIMELINE.includes(id), `${id} missing from timeline`);
  }
  assert.equal(S.TIMELINE[0], "bob", "Bob is the newest role");
});

test("content contains no street address and no competitor names", () => {
  const text = JSON.stringify([S.SUN, S.BODIES]);
  assert.doesNotMatch(text, /Richmond, VA \d|Chesterfield, VA \d/);
  const blocked = existsSync("test/.blocked-terms") ? readFileSync("test/.blocked-terms", "utf8").split(/\r?\n/).map((l) => l.trim()).filter(Boolean) : [];
  for (const t of blocked) assert.ok(!text.toLowerCase().includes(t.toLowerCase()), "content mentions a blocked term");
});

test("every body has a procedural look matching its kind", () => {
  const looks = { planet: ["gas", "rock"], station: ["station"], module: ["module"], star: ["star"] };
  for (const b of S.BODIES) assert.ok(looks[b.kind].includes(b.look), `${b.id} needs a valid look`);
  assert.equal(S.BODIES.find((x) => x.id === "nasa").look, "gas");
  assert.equal(S.BODIES.find((x) => x.id === "bob").look, "rock");
});

test("textured bodies point at baked texture files; skills stars stay plain", () => {
  const textured = S.BODIES.filter((b) => b.texture).map((b) => b.id).sort();
  assert.deepEqual(textured, ["aspire", "bob", "education", "nasa", "ta"]);
  for (const b of S.BODIES.filter((x) => x.texture)) {
    assert.equal(b.texture, `/textures/planets/${b.id}.webp`);
    assert.ok(existsSync("public" + b.texture), `${b.id} texture missing`);
  }
  for (const b of S.BODIES.filter((x) => x.kind === "star")) assert.equal(b.texture, undefined, `${b.id} must stay a plain star`);
});

test("a textured body's glow and label colour matches the dominant colour of its planet", () => {
  const dominant = (hex) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
    return r > g && r > b ? "red" : g >= r && g >= b ? "green" : "blue";
  };
  const expected = { nasa: "blue", bob: "green", aspire: "green", ta: "green" };
  for (const [id, channel] of Object.entries(expected)) {
    assert.equal(dominant(S.BODIES.find((b) => b.id === id).color), channel, `${id} glow colour`);
  }
});

test("textured planets don't all spin the same way, and each turns in roughly a minute", () => {
  const TURN = 2 * Math.PI, BASE = 0.1; // PLANET_SPIN_SPEED
  const spins = S.BODIES.filter((b) => b.texture).map((b) => [b.id, b.spin]);
  for (const [id, spin] of spins) {
    assert.equal(typeof spin, "number", `${id} needs a spin`);
    const seconds = TURN / Math.abs(BASE * spin);
    assert.ok(seconds >= 45 && seconds <= 90, `${id} turns once every ${seconds.toFixed(0)}s`);
  }
  assert.ok(spins.some(([, s]) => s > 0) && spins.some(([, s]) => s < 0), "every planet spins the same way");
  assert.ok(new Set(spins.map(([, s]) => Math.abs(s))).size > 2, "every planet spins at the same speed");
});

test("orbits sit at natural distances: clear of the sun's glow and of each other, with gaps that widen outward", () => {
  const SUN_GLOW = 2.4; // radius of the sun's glow in GalaxyCanvas
  const moonsOf = (id) => S.BODIES.filter((b) => b.parent === id);
  const reach = (b) => Math.max(b.size, ...moonsOf(b.id).map((m) => m.orbitRadius + m.size));
  const bands = S.BODIES.filter((b) => !b.parent && b.kind !== "star")
    .sort((a, b) => a.orbitRadius - b.orbitRadius)
    .map((b) => ({ id: b.id, inner: b.orbitRadius - reach(b), outer: b.orbitRadius + reach(b) }));
  let gap = bands[0].inner - SUN_GLOW;
  assert.ok(gap >= 0.6, `${bands[0].id} is only ${gap.toFixed(2)} from the sun's glow`);
  for (let i = 1; i < bands.length; i++) {
    const next = bands[i].inner - bands[i - 1].outer;
    assert.ok(next >= gap - 1e-9, `gap inside ${bands[i].id} (${next.toFixed(2)}) is narrower than the one before it (${gap.toFixed(2)})`);
    gap = next;
  }
  const outermost = bands[bands.length - 1].outer;
  for (const s of S.BODIES.filter((b) => b.kind === "star")) {
    assert.ok(s.orbitRadius - s.size - outermost >= gap, `${s.id} crowds the outermost planet`);
  }
  for (const m of S.BODIES.filter((b) => b.parent)) {
    const p = S.BODIES.find((b) => b.id === m.parent);
    assert.ok(m.orbitRadius - m.size - p.size >= 0.3, `${m.id} touches ${p.id}`);
  }
});

test("when the page loads, no planet or moon looks like it is touching the sun from the home view", async () => {
  const { bodyPosition } = await import("../src/lib/cameraPath.ts");
  const CAM = [0, 14, 22]; // HOME camera in GalaxyCanvas, looking at the sun
  const SUN_GLOW = 2.4;
  const sub = (a, b) => a.map((v, i) => v - b[i]);
  const len = (v) => Math.hypot(...v);
  const angle = (a, b) => (Math.acos(a.reduce((s, v, i) => s + v * b[i], 0) / (len(a) * len(b))) * 180) / Math.PI;
  const deg = (r) => (r * 180) / Math.PI;
  const toSun = sub([0, 0, 0], CAM);
  const glow = deg(Math.asin(SUN_GLOW / len(toSun)));
  for (const b of S.BODIES.filter((x) => x.kind !== "star")) {
    const parent = b.parent ? S.BODIES.find((x) => x.id === b.parent) : null;
    const p = bodyPosition(b, 0);
    const o = parent ? bodyPosition(parent, 0) : [0, 0, 0];
    const toBody = sub([p[0] + o[0], p[1] + o[1], p[2] + o[2]], CAM);
    const apart = angle(toBody, toSun);
    const needed = glow + deg(Math.asin(b.size / len(toBody))) + 1;
    assert.ok(apart >= needed, `${b.id} sits ${apart.toFixed(1)}° from the sun on screen, needs ${needed.toFixed(1)}°`);
  }
});
