import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync("src/app/globals.css", "utf8");
const views = ["src/components/NasaDeepDive.tsx", "src/components/BobCaseFile.tsx"];

test("the NASA card and Bob case file are solid pixel-framed panels, not see-through glass", () => {
  for (const f of views) {
    const src = readFileSync(f, "utf8");
    assert.match(src, /px-frame/, `${f} has no pixel frame`);
    assert.match(src, /bg-void/, `${f} is not solid`);
    assert.doesNotMatch(src, /card-glass|sky-\d|slate-\d|pcb-/, `${f} still uses the old look`);
  }
  assert.doesNotMatch(css, /card-glass/, "glass styles left in globals.css");
});

test("no backdrop-filter on the dialogs: it would trap the NASA card's fixed photo viewer (Lessons 2026-10-10)", () => {
  assert.doesNotMatch(css, /\.deep-dialog[^{]*\{[^}]*backdrop-filter/s);
  for (const f of views) assert.doesNotMatch(readFileSync(f, "utf8"), /backdrop-blur|backdrop-filter/, f);
});

test("the Bob case file no longer draws the circuit board", () => {
  assert.doesNotMatch(readFileSync("src/components/BobCaseFile.tsx", "utf8"), /CircuitBoard/);
});

test("deep views open from #nasa / #bob and hand focus back on close", () => {
  const src = readFileSync("src/components/site/DeepViews.tsx", "utf8");
  assert.match(src, /hashchange/);
  assert.match(src, /returnFocusTo/);
});
