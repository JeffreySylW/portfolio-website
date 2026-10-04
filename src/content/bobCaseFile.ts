// src/content/bobCaseFile.ts — all copy and image metadata for the Bob case study.
// A later, deeper design write-up = add entries here, not new components.

export const BOB_SITE_URL = "https://bobthetechguy.com";
// Flip to true once Bob's SSL certificate is fixed; removes the warning note.
export const BOB_SITE_SSL_OK = false;

export const CARD = {
  label: "CLIENT WORK // BOB THE TECH GUY · CHESTERFIELD, VA",
  dates: "AUG 2026 – PRESENT",
  title: "Freelance Web Developer",
  summary:
    "Redesigned the WordPress site for a real small-business client relocating his computer-repair business to Chesterfield, VA — built to earn phone calls and compete with other local repair shops.",
  stats: [
    { label: "VERSIONED RELEASES", value: 47 },
  ] as { label: string; value?: number; text?: string }[],
  tags: ["HTML", "CSS", "JAVASCRIPT", "WORDPRESS", "REST API", "GIT"],
};

export const CLIENT = [
  "Bob has 25 years in IT, runs a veteran-owned business, and built a 5-star reputation with customers in New Jersey before moving the business to Chesterfield, Virginia.",
  "His site hadn't been touched in years. The goal: look credible next to the other repair businesses in the area, load fast on phones, and make calling him the obvious next step — for both his Virginia and New Jersey customers.",
];

export const COMMUNICATION = [
  { title: "Discovery call", detail: "Recorded and summarized his goals, services, and priorities before touching anything." },
  { title: "Specs before code", detail: "Every change was written up and approved before it shipped." },
  { title: "Questions for the client", detail: "A running list of decisions that were his to make — never guessed on his behalf." },
  { title: "Release notes", detail: "Each version shipped with a plain-language summary of what changed and why." },
];

export const PIPELINE = [
  { label: "DISCOVER", detail: "Measured every page to find the walls of text." },
  { label: "SPEC", detail: "Wrote the design; client approved it." },
  { label: "PLAN", detail: "Broke it into small tasks with exact tests." },
  { label: "TEST-FIRST", detail: "Test-driven development: every change began as a failing test.", test: true },
  { label: "DRY RUN", detail: "Ran every change against live content without saving." },
  { label: "SHIP ONE PAGE", detail: "Released to a single page first." },
  { label: "VERIFY LIVE", detail: "End-to-end testing against the live site: public HTML on all 30 pages, screenshots at desktop and phone widths.", test: true },
  { label: "REVIEW", detail: "An independent code review before calling it done." },
] as { label: string; detail: string; test?: boolean }[];

export const TOOLING = [
  { name: "CSS / JS bundle", detail: "One versioned stylesheet and script, served from a CDN (jsDelivr) to every page." },
  { name: "WordPress REST API", detail: "Scripted, reversible content updates with every page backed up first." },
  { name: "node:test", detail: "68 automated tests covering the transforms and styles." },
  { name: "Content-safety checker", detail: "Proves no sentence was added, lost, reordered, or reworded." },
  { name: "Headless browser", detail: "End-to-end screenshots and layout measurements of the live pages." },
  { name: "Git + GitHub", detail: "Tagged releases (v1.0.0 → v1.7.4) with one-line rollbacks." },
];

export const AI_NOTE = "AI-assisted development (Claude Code), with every change verified test-first.";

export const WORK = [
  { pair: "Home", src: "/images/bob/home-before.webp", archived: true, alt: "Bob The Tech Guy homepage in 2022: old pixel logo, a public login bar, and a collage of brand logos", caption: "Home, before — archived 2022 via the Wayback Machine" },
  { pair: "Home", src: "/images/bob/home-after.webp", alt: "Redesigned homepage with a full-width dark hero, a dialable phone button, and a 5-star trust line", caption: "Home, after — full-width hero and a dialable call button" },
  { pair: "Networking", src: "/images/bob/networking-before.webp", archived: true, alt: "Networking page in 2022 with long paragraphs and plain bullet lines", caption: "Networking, before — archived 2022 via the Wayback Machine" },
  { pair: "Networking", src: "/images/bob/networking-after.webp", alt: "Redesigned Networking page with a dark hero, three summary cards, and a check-mark list", caption: "Networking, after — summary cards and a real checklist" },
  { src: "/images/bob/town-desktop.webp", alt: "Chester, Virginia service page with six summary cards on desktop", caption: "New town pages — six summary cards on desktop" },
  { phone: true, src: "/images/bob/phone-top.webp", alt: "Chester, Virginia page on an iPhone-sized screen: dark hero, headline, and a tap-to-call phone button", caption: "On a phone — hero and tap-to-call" },
  { phone: true, src: "/images/bob/phone-cards.webp", alt: "Chester, Virginia page on an iPhone-sized screen: summary cards stacked in one column", caption: "On a phone — cards stack into one column" },
  { src: "/images/bob/services-parental.webp", alt: "Parental Controls page with a single summary card, checklist, and call-to-action block", caption: "Services — one card, a checklist, and a clear call to action" },
] as { pair?: string; phone?: boolean; src: string; alt: string; caption: string; archived?: boolean }[];

export const RESULTS = [
  { value: "30", label: "pages on one managed bundle" },
  { value: "15", label: "pages turned into summary cards" },
  { value: "47", label: "versioned releases, v1.0.0 → v1.7.4" },
];
