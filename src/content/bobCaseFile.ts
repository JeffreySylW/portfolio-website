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

// Left column = old site (Wayback Machine captures), right column = current live site.
export const WORK = [
  { side: "before", src: "/images/bob/home-before.webp", width: 1200, height: 663, archived: true, alt: "Old home page: old pixel logo, a public login bar, and a collage of brand logos", caption: "Old home page: logo collage and a login bar — archived 2022 via the Wayback Machine" },
  { side: "before", src: "/images/bob/before-services.webp", width: 1000, height: 819, archived: true, alt: "Old Services page: the old pixel logo and a plain list of large text links", caption: "Old services page: a bare list of text links — archived 2022 via the Wayback Machine" },
  { side: "before", src: "/images/bob/before-antivirus.webp", width: 1000, height: 903, archived: true, alt: "Old Anti-Virus page: the old pixel logo above a wall of small grey paragraphs and bullet lines", caption: "Old service page: long paragraphs and plain bullets — archived 2022 via the Wayback Machine" },
  { side: "before", src: "/images/bob/before-hardware.webp", width: 1000, height: 611, archived: true, alt: "Old Hardware Repair page: the old pixel logo and one long, dense paragraph", caption: "Old service page: one dense paragraph — archived 2022 via the Wayback Machine" },
  { side: "before", src: "/images/bob/networking-before.webp", width: 1200, height: 1103, archived: true, alt: "Old Networking page with long paragraphs and plain bullet lines", caption: "Old networking page: long paragraphs — archived 2022 via the Wayback Machine" },
  { side: "before", src: "/images/bob/before-footer.webp", width: 1000, height: 639, archived: true, alt: "Old footer: a long list of near-identical town links, a veteran badge, and an Instagram button", caption: "Old footer: a long list of town links — archived 2022 via the Wayback Machine" },
  { side: "after", src: "/images/bob/after-home-hero.webp", width: 1000, height: 694, alt: "New home page: dark hero with Bob’s photo, a dialable phone button, a 5-star and veteran-owned line, a link for northern New Jersey, and an opening-hours pill", caption: "New home page: photo, call button, trust line and hours pill" },
  { side: "after", src: "/images/bob/after-why-bob.webp", width: 1000, height: 810, alt: "New home page section: four “Why Choose Bob” cards with icons", caption: "New home page: “Why Choose Bob” cards" },
  { side: "after", src: "/images/bob/after-networking.webp", width: 1000, height: 799, alt: "New Networking page: dark hero with a call button, three summary cards, and check-mark lists", caption: "New services page: summary cards and a call to action" },
  { side: "after", src: "/images/bob/after-services.webp", width: 1000, height: 799, alt: "New Services page: dark hero and three grouped cards of service links", caption: "New services page: services grouped into three cards" },
  { side: "after", src: "/images/bob/after-towns-map.webp", width: 1000, height: 833, alt: "New town page: town pills and a Virginia service-area map with a boundary and labelled towns", caption: "New town page: town pills and a service-area map" },
  { side: "after", src: "/images/bob/after-footer.webp", width: 1000, height: 546, alt: "New footer: Virginia and northern New Jersey service-area maps beside the opening hours", caption: "New footer: two service-area maps and opening hours" },
  { side: "after", src: "/images/bob/after-reviews.webp", width: 1000, height: 417, alt: "New Reviews page header: dark hero with a call button and a 5-star, veteran-owned line", caption: "New reviews page: hero and trust line" },
  { side: "after", src: "/images/bob/after-phone.webp", width: 780, height: 1688, phone: true, alt: "New home page on an iPhone-sized screen: new logo, dark hero, photo, headline and a tap-to-call button", caption: "New site on a phone: hero and tap-to-call" },
] as { side: "before" | "after"; src: string; width: number; height: number; alt: string; caption: string; archived?: boolean; phone?: boolean }[];

export const RESULTS = [
  { value: "30", label: "pages on one managed bundle" },
  { value: "15", label: "pages turned into summary cards" },
  { value: "47", label: "versioned releases, v1.0.0 → v1.7.4" },
];
