// run: NODE_OPTIONS=--experimental-strip-types node --test test/cardGlass.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync("src/app/globals.css", "utf8");

test(".card-glass is translucent by one variable, with a blur", () => {
  assert.match(css, /--card-alpha:\s*0\.\d+/);
  assert.match(css, /\.card-glass\s*\{[^}]*color-mix\(in srgb, var\(--card-tint[^}]*var\(--card-alpha\)/s);
  assert.match(css, /\.card-glass\s*\{[^}]*backdrop-filter:\s*blur\(var\(--card-blur\)\)/s);
});

test("people who ask for reduced transparency get solid cards", () => {
  assert.match(css, /@media \(prefers-reduced-transparency: reduce\)\s*\{\s*\.card-glass\s*\{[^}]*background-color:\s*var\(--card-tint[^}]*backdrop-filter:\s*none/s);
});

test("the NASA dialog backdrop lets the planet through", () => {
  const m = css.match(/\.deep-dialog::backdrop\s*\{\s*background:\s*rgb\(3 5 11 \/ ([0-9.]+)\)/);
  assert.ok(m, "backdrop rule missing");
  assert.ok(Number(m[1]) <= 0.4, `backdrop alpha ${m[1]} hides the planet`);
});

test("the three cards use .card-glass instead of a near-solid colour", () => {
  for (const f of ["src/components/space/NasaDeepDive.tsx", "src/components/space/StoryPanel.tsx", "src/components/BobCaseFile.tsx"]) {
    const src = readFileSync(f, "utf8");
    assert.match(src, /card-glass/, `${f} does not use card-glass`);
    assert.doesNotMatch(src, /bg-\[#070b16\](\/9\d)?"|bg-\[#070b16\]\/95/, `${f} still has a near-solid background`);
  }
});

test("a backdrop-filter on the dialog would trap its fixed photo viewer, so the dialog blurs via ::backdrop instead", () => {
  assert.match(css, /\.deep-dialog\.card-glass\s*\{[^}]*backdrop-filter:\s*none/s);
  assert.match(css, /\.deep-dialog::backdrop\s*\{[^}]*backdrop-filter:\s*blur\(var\(--card-blur\)\)/s);
});

test("browsers without color-mix still get a translucent card, not a transparent one", () => {
  const rule = css.match(/\.card-glass\s*\{[^}]*\}/s)[0];
  assert.ok(rule.indexOf("background-color: rgb(") !== -1 && rule.indexOf("background-color: rgb(") < rule.indexOf("color-mix"), "plain rgb() fallback must come before the color-mix line");
});
