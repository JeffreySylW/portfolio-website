import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import * as W from "../src/content/work.ts";

test("profile copy is present and says software engineer", () => {
  assert.equal(W.PROFILE.name, "Jeffrey Weaver");
  assert.match(W.PROFILE.role, /software engineer/i);
  assert.ok(W.PROFILE.intro.length > 40);
  assert.equal(W.PROFILE.resumeHref, "/documents/Jeffrey-Weaver-Resume.pdf");
});

test("work ledger is newest first and every row has the required fields", () => {
  const ids = W.WORK.map((w) => w.id);
  assert.deepEqual(ids, ["sheinkopf", "bob", "nasa", "vcu", "sports-analytics"]);
  for (const w of W.WORK) {
    assert.ok(w.org && w.role && w.dates && w.summary, `${w.id} copy`);
    assert.ok(Array.isArray(w.tools) && w.tools.length > 0, `${w.id} tools`);
  }
  const starts = W.WORK.filter((w) => w.kind === "job").map((w) => w.start);
  assert.deepEqual([...starts].sort().reverse(), starts, "jobs newest first");
});

test("NASA row keeps the approved title and dates", () => {
  const nasa = W.WORK.find((w) => w.id === "nasa");
  assert.equal(nasa.role, "Software Engineering Intern, Amentum");
  assert.equal(nasa.dates, "May 2025 – Aug 2025");
  assert.ok(!/IT Intern/i.test(JSON.stringify(W)), "never 'IT Intern'");
  assert.equal(nasa.deep, "nasa");
  assert.equal(nasa.place, "hampton");
});

test("Bob row opens the case file and sits in Richmond", () => {
  const bob = W.WORK.find((w) => w.id === "bob");
  assert.equal(bob.deep, "bob");
  assert.equal(bob.place, "richmond");
  assert.equal(bob.dates, "Aug 2026 – present");
});

test("Sheinkopf row: a finished one-time micro-internship, only the approved facts (2026-11-25)", () => {
  const s = W.WORK.find((w) => w.id === "sheinkopf");
  assert.equal(s.kind, "job");
  assert.equal(s.org, "Rob Sheinkopf, Author");
  assert.equal(s.role, "Web Development Micro-Intern, Parker Dewey");
  assert.equal(s.dates, "Nov 2026");
  assert.equal(s.start, "2026-11");
  assert.equal(s.end, "2026-11");
  assert.match(s.summary, /one-time micro-internship through VCU and Parker Dewey/);
  assert.doesNotMatch(s.summary, /in progress|!|[•]/i);
  assert.deepEqual(s.tools, ["WordPress", "CSS"]);
  assert.equal(s.link.href, "https://robsheinkopf-author.com");
  assert.doesNotMatch(JSON.stringify(s), /@|bluehost|password|login|\+?\d{3}[- .]\d{3}[- .]\d{4}|accessib|consistent/i, "nothing private or filler");
});

test("VCU row carries the TA and ASPIRE highlights with their dates", () => {
  const vcu = W.WORK.find((w) => w.id === "vcu");
  assert.equal(vcu.dates, "Aug 2022 – May 2026");
  const names = vcu.highlights.map((h) => h.name);
  assert.deepEqual(names, ["Computer Science Teaching Assistant", "DoD ASPIRE Capstone"]);
  assert.equal(vcu.highlights[0].dates, "Aug 2024 – May 2026");
  assert.equal(vcu.highlights[1].dates, "Aug 2024 – May 2025");
});

test("photos exist on disk and have alt text", () => {
  for (const w of W.WORK) {
    if (!w.photo) continue;
    assert.ok(existsSync(`public${w.photo.src}`), `${w.id} photo missing`);
    assert.ok(w.photo.alt.length > 10, `${w.id} alt`);
  }
});

test("skills: three lists, languages say C not C/C++", () => {
  assert.deepEqual(W.SKILLS.map((s) => s.label), ["Languages", "Web", "Tools and practices"]);
  const langs = W.SKILLS[0].items;
  assert.ok(langs.includes("C") && !langs.includes("C/C++"));
});

test("places are Richmond and Hampton with real coordinates", () => {
  assert.ok(Math.abs(W.PLACES.richmond.lat - 37.54) < 0.05 && Math.abs(W.PLACES.richmond.lon + 77.44) < 0.05);
  assert.ok(Math.abs(W.PLACES.hampton.lat - 37.08) < 0.1 && Math.abs(W.PLACES.hampton.lon + 76.36) < 0.1);
  for (const w of W.WORK) if (w.place) assert.ok(W.PLACES[w.place], `${w.id} place`);
});

test("content contains no street address and no competitor names", () => {
  const all = JSON.stringify(W);
  assert.ok(!/\d+\s+\w+\s+(st|street|ave|avenue|rd|road|blvd)\b/i.test(all));
  const blocked = existsSync("test/.blocked-terms") ? readFileSync("test/.blocked-terms", "utf8").split(/\r?\n/).map((l) => l.trim()).filter(Boolean) : [];
  for (const term of blocked) assert.ok(!all.toLowerCase().includes(term.toLowerCase()), `blocked term: ${term}`);
});
