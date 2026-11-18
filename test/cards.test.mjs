import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { ME_CARD, EXPERIENCE_CARDS, DEEP_IDS, isDeepId } from "../src/content/cards.ts";
import { PLANETS } from "../src/content/planets.ts";
import { WORK } from "../src/content/work.ts";

test("the 'me' card says what Jeff asked for, with his photos", () => {
  assert.equal(ME_CARD.title, "Hi, I'm Jeff");
  assert.match(ME_CARD.lead, /this is my portfolio website/i);
  assert.match(ME_CARD.lead, /my road as a software engineer/i);
  assert.ok(ME_CARD.photos.length === 3);
  for (const p of [...ME_CARD.photos, ME_CARD.face]) {
    assert.ok(p.alt && p.alt.length > 10, `alt for ${p.src}`);
    assert.ok(p.width > 0 && p.height > 0);
    for (const src of [p.src, ...(p.small ? [p.small] : [])]) {
      const file = `public${src}`;
      assert.ok(existsSync(file), file);
      // no camera metadata (location!) in what we publish
      assert.doesNotMatch(readFileSync(file).toString("latin1"), /EXIF|XMP /, `${file} still carries metadata`);
    }
  }
});

test("the VCU, TA and ASPIRE cards repeat the work list word for word (no new claims)", () => {
  const vcu = WORK.find((w) => w.id === "vcu");
  const byName = (n) => vcu.highlights.find((h) => h.name === n);
  assert.deepEqual(Object.keys(EXPERIENCE_CARDS).sort(), ["aspire", "ta", "vcu"]);
  assert.equal(EXPERIENCE_CARDS.vcu.title, vcu.org);
  assert.equal(EXPERIENCE_CARDS.vcu.role, vcu.role);
  assert.equal(EXPERIENCE_CARDS.vcu.dates, vcu.dates);
  assert.equal(EXPERIENCE_CARDS.vcu.summary, vcu.summary);
  for (const [id, name] of [["ta", "Computer Science Teaching Assistant"], ["aspire", "DoD ASPIRE Capstone"]]) {
    const h = byName(name);
    assert.equal(EXPERIENCE_CARDS[id].title, h.name);
    assert.equal(EXPERIENCE_CARDS[id].role, h.role);
    assert.equal(EXPERIENCE_CARDS[id].dates, h.dates);
    assert.equal(EXPERIENCE_CARDS[id].summary, h.summary);
  }
});

test("every planet opens a card, and the core opens the 'me' card", () => {
  for (const p of PLANETS) assert.ok(isDeepId(p.id), `${p.id} has no card`);
  assert.ok(isDeepId("me"));
  assert.ok(!isDeepId("work") && !isDeepId("contact") && !isDeepId(""));
  assert.deepEqual([...DEEP_IDS].sort(), ["aspire", "bob", "me", "nasa", "ta", "vcu"]);
  const map = readFileSync("src/components/site/SystemMap.tsx", "utf8");
  assert.match(map, /href=\{`#\$\{p\.id\}`\}/, "planets link to their card");
  assert.match(map, /href="#me"/, "the core links to the me card");
  assert.match(map, /gal-core[^"]*phase|phase[^"]*gal-core/, "the core glitches like the planets");
});

test("the Milky Way swirls slowly, labels stay upright, and nothing turns under reduced motion", () => {
  const css = readFileSync("src/app/globals.css", "utf8");
  const m = css.match(/@media \(prefers-reduced-motion: no-preference\)\s*\{\s*\.gal-swirl\s*\{\s*animation:\s*gal-swirl\s+(\d+)s linear infinite;?\s*\}\s*\.gal-upright\s*\{\s*animation:\s*gal-upright\s+(\d+)s linear infinite;?\s*\}/);
  assert.ok(m, "swirl rules missing");
  assert.equal(m[1], m[2], "counter-turn must match the swirl");
  assert.ok(Number(m[1]) >= 180, `a turn every ${m[1]} s is not slow`);
  assert.match(css, /@keyframes gal-swirl\s*\{\s*to\s*\{\s*rotate:\s*360deg/);
  assert.match(css, /@keyframes gal-upright\s*\{\s*to\s*\{\s*rotate:\s*-360deg/);
});
