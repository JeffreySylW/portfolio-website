// run: node --test test/nasaGallery.test.mjs
import test from "node:test";
import assert from "node:assert";
import { existsSync } from "node:fs";
import { GALLERY } from "../src/content/nasaGallery.ts";

test("every internship and tour image in the NASA gallery exists on disk", () => {
  assert.strictEqual(GALLERY.length, 11);
  for (const g of GALLERY) {
    assert.ok(existsSync("public" + g.src), `${g.src} missing`);
    assert.ok(g.alt.length > 10, `${g.src} needs alt text`);
  }
});
