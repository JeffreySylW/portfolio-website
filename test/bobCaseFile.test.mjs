// test/bobCaseFile.test.mjs — run: node --test test/bobCaseFile.test.mjs
import test from "node:test";
import assert from "node:assert";
import { existsSync, readFileSync, statSync } from "node:fs";
import * as B from "../src/content/bobCaseFile.ts";

const ADDRESS = /\b\d{1,6}\s+(?:[A-Z][a-z]+\s+){1,3}(?:St|Street|Rd|Road|Ave|Avenue|Blvd|Dr|Drive|Ln|Lane|Ct|Court|Pkwy|Hwy|Tpke|Pike|Way|Pl)\b/;
const allText = JSON.stringify(B);

test("every image exists, is under 250 KB and has alt text", () => {
  for (const w of B.WORK) {
    const size = statSync("public" + w.src).size;
    assert.ok(size <= 256000, `${w.src} is ${size} bytes`);
    assert.ok(w.alt && w.alt.length > 10, `${w.src} needs alt text`);
  }
});

test("archived images say so", () => {
  for (const w of B.WORK.filter((x) => x.archived)) assert.match(w.caption, /archived 2022 via the Wayback Machine/);
});

test("no street address and no competitor names anywhere in the copy", () => {
  assert.doesNotMatch(allText, ADDRESS);
  // Competitor names live in an untracked local file so they never ship in the repo.
  const blocked = existsSync("test/.blocked-terms") ? readFileSync("test/.blocked-terms", "utf8").split(/?
/).map((l) => l.trim()).filter(Boolean) : [];
  for (const t of blocked) assert.ok(!allText.toLowerCase().includes(t.toLowerCase()), "copy mentions a blocked term");
});

test("card and results use the approved numbers", () => {
  assert.deepStrictEqual(B.CARD.stats.map((s) => s.value ?? s.text), [30, 0, "v1.1.1"]);
  assert.deepStrictEqual(B.RESULTS.map((r) => r.value), ["30", "15", "0", "7"]);
});

test("case file mentions TDD and end-to-end testing, AI note is one line", () => {
  assert.match(allText, /test-driven development/i);
  assert.match(allText, /end-to-end/i);
  assert.strictEqual(B.AI_NOTE, "AI-assisted development (Claude Code), with every change verified test-first.");
});

test("live link is Bob's site and the SSL flag is a boolean", () => {
  assert.strictEqual(B.BOB_SITE_URL, "https://bobthetechguy.com");
  assert.strictEqual(typeof B.BOB_SITE_SSL_OK, "boolean");
});
