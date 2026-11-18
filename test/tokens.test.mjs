import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { contrastRatio, TOKENS, TEXT_PAIRS } from "../src/lib/tokens.ts";

test("contrast ratio matches known values", () => {
  assert.equal(Math.round(contrastRatio("#000000", "#ffffff") * 10) / 10, 21);
  assert.equal(contrastRatio("#777777", "#777777"), 1);
});

test("the palette is the six flat indigo steps", () => {
  assert.deepEqual(
    [TOKENS.void, TOKENS.deep, TOKENS.indigo, TOKENS.violet, TOKENS.lavender, TOKENS.starlight],
    ["#07061a", "#15123d", "#2b2a7a", "#5b54d6", "#a9a4ff", "#f2f0ff"],
  );
});

test("every text colour on every background it is used on passes WCAG AA (4.5:1)", () => {
  for (const [fg, bg] of TEXT_PAIRS) {
    const r = contrastRatio(TOKENS[fg], TOKENS[bg]);
    assert.ok(r >= 4.5, `${fg} on ${bg} is ${r.toFixed(2)}:1`);
  }
});

test("globals.css declares every token once and uses no gradients", () => {
  const css = readFileSync("src/app/globals.css", "utf8");
  for (const [name, hex] of Object.entries(TOKENS)) assert.ok(css.includes(`--${name}: ${hex};`), `--${name}`);
  assert.ok(!/gradient\(/.test(css), "no CSS gradients");
});

test("the layout loads Big Shoulders, Atkinson Hyperlegible Next and Silkscreen, and not the old faces", () => {
  const layout = readFileSync("src/app/layout.tsx", "utf8");
  for (const f of ["Big_Shoulders", "Atkinson_Hyperlegible_Next", "Silkscreen"]) assert.ok(layout.includes(f), f);
  for (const f of ["Inter", "Space_Grotesk", "Space_Mono", "Source_Serif_4"]) assert.ok(!new RegExp(`\\b${f}\\b`).test(layout), `${f} still loaded`);
});
