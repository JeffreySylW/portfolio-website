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
