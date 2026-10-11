// run: NODE_OPTIONS=--experimental-strip-types node --test test/nasaGallery.test.mjs
import test from "node:test";
import assert from "node:assert";
import { existsSync } from "node:fs";
import sharp from "sharp";
import { GALLERY, SECTIONS, inGroup } from "../src/content/nasaGallery.ts";

// Captions exactly as on the Tours slide of "Summer 2025 Internship Experience" (the only change: world's, America's apostrophes).
const DECK_TOURS = {
  "14 x 22 Subsonic Wind Tunnel": "Saw the massive tunnel used to test everything from aircraft landings to Mars helicopters!",
  "The Gantry": "Witnessed a helicopter crash-test in person, and the inside!",
  "Transonic Dynamics Tunnel": "Saw how this unique heavy-gas tunnel tests the limits of aircraft structures to prevent them from breaking apart in flight.",
  "Unitary Plan Wind Tunnel": "Learned how its massive 100,000+ horsepower & giant compressors drive system creates supersonic conditions for testing America's most advanced aircraft.",
  "National Transonic Facility": "Saw the world's largest cryogenic, high pressure, closed circuit wind tunnel!",
  "SCRAMJET": "Saw and learned about a supersonic combustion ramjet!",
  "8 Foot High Temperature Tunnel": "Witnessed a hypersonic wind tunnel that creates extreme heat and Mach 7 speeds!",
  "Flight Simulator": "Simulated landing a plane.",
  "Compressor Station": "Witnessed the process of how each facility on center gets their compressed air for tests!",
};

// Sentences from the "Side Quest #1" and "Beyond the Desk" slides, word for word.
const DECK_SIDE_QUEST_1 = [
  "Our goal was to build a system that combined live video with real-time test data.",
  "We started by positioning two cameras on the test section for different angles.",
  "Demoing wind tunnel surveillance systems in the lab room.",
];

test("the gallery has 3 surveillance, 5 makerspace and 9 tour photos, in page order", () => {
  assert.strictEqual(GALLERY.length, 17);
  assert.deepStrictEqual(GALLERY.map((g) => g.group), [
    ...Array(3).fill("surveillance"), ...Array(5).fill("makerspace"), ...Array(9).fill("tours"),
  ]);
  assert.strictEqual(inGroup("tours").length, 9);
});

test("no photo is shown twice (the Unitary Plan group photo was also listed as 'Legacy Hardware')", () => {
  assert.ok(!GALLERY.some((g) => /legacy hardware/i.test(g.name)), "Legacy Hardware duplicate is back");
  const srcs = GALLERY.map((g) => g.src);
  assert.strictEqual(new Set(srcs).size, srcs.length);
});

test("Side Quest #1 photos carry the presentation's own sentences", () => {
  assert.deepStrictEqual(inGroup("surveillance").map((g) => g.detail), DECK_SIDE_QUEST_1);
});

test("the Unitary Plan tile uses the sharp original photo, not the soft crop from the PDF", () => {
  const upwt = inGroup("tours").find((g) => g.name === "Unitary Plan Wind Tunnel");
  assert.ok(upwt.width >= 1200, `Unitary Plan tile is ${upwt.width}px wide`);
});

test("every image exists, matches its recorded size, and has alt text and a caption", async () => {
  for (const g of GALLERY) {
    assert.ok(existsSync("public" + g.src), `${g.src} missing`);
    const m = await sharp("public" + g.src).metadata();
    assert.deepStrictEqual([m.width, m.height], [g.width, g.height], `${g.src} size`);
    assert.ok(g.alt.length > 15, `${g.src} needs alt text`);
    assert.ok(g.name.length > 2 && g.detail.length > 10, `${g.src} needs a name and caption`);
  }
});

test("captions are unique, so none can sit on the wrong photo twice", () => {
  const details = GALLERY.map((g) => g.detail);
  assert.strictEqual(new Set(details).size, details.length);
});

test("tour captions are exactly the presentation's", () => {
  for (const g of inGroup("tours")) assert.strictEqual(g.detail, DECK_TOURS[g.name], g.name);
  assert.deepStrictEqual(inGroup("tours").map((g) => g.name).sort(), Object.keys(DECK_TOURS).sort());
});

test("tours and makerspace photos are big enough to look sharp (at least 900px wide)", () => {
  for (const g of [...inGroup("tours"), ...inGroup("makerspace")]) assert.ok(g.width >= 900, `${g.src} is ${g.width}px wide`);
});

test("NASA deep-dive section headings appear in the required order", () => {
  assert.deepStrictEqual(
    SECTIONS.map((s) => s.heading),
    ["Overview", "My main project", "How it works", "Problems and solutions", "Side quest 1: wind tunnel surveillance system", "Side quest 2: cable labelling", "Makerspace", "What I learned", "Takeaway"],
  );
});
