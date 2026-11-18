// Pop-up cards opened from the Milky Way: the "me" card at the core, and one card per planet.
// NASA and Bob keep their own deep views; VCU, TA, ASPIRE and Sheinkopf repeat the work list word for word.
import { WORK } from "./work.ts";

export interface Photo {
  src: string;
  /** Smaller copy for narrow screens. */
  small?: string;
  width: number;
  height: number;
  alt: string;
}

export const ME_CARD = {
  title: "Hi, I'm Jeff",
  lead: "This is my portfolio website and my road as a software engineer.",
  photos: [
    { src: "/images/me/grad-campus-1040.webp", small: "/images/me/grad-campus-560.webp", width: 1040, height: 695, alt: "Jeff in his VCU graduation gown, sitting on the grass on campus holding his cap" },
    { src: "/images/me/grad-lake-1040.webp", small: "/images/me/grad-lake-560.webp", width: 1040, height: 693, alt: "Jeff in his graduation gown by a lake at dusk, making a peace sign" },
    { src: "/images/me/overlook-720.webp", small: "/images/me/overlook-400.webp", width: 720, height: 960, alt: "Jeff sitting on the rocks of a mountain overlook, looking out over the ridges at sunset" },
  ] as Photo[],
};

export interface ExperienceCard {
  title: string;
  role: string;
  dates: string;
  summary: string;
  tools?: string[];
  /** The work row, for "See it in the work list". */
  workId: string;
}

const vcu = WORK.find((w) => w.id === "vcu")!;
const highlight = (name: string) => vcu.highlights!.find((h) => h.name === name)!;
const fromHighlight = (name: string): ExperienceCard => {
  const h = highlight(name);
  return { title: h.name, role: h.role, dates: h.dates, summary: h.summary, workId: "vcu" };
};

const fromRow = (id: string): ExperienceCard => {
  const w = WORK.find((r) => r.id === id)!;
  return { title: w.org, role: w.role, dates: w.dates, summary: w.summary, tools: w.tools, workId: w.id };
};

export const EXPERIENCE_CARDS = {
  vcu: { title: vcu.org, role: vcu.role, dates: vcu.dates, summary: vcu.summary, tools: vcu.tools, workId: "vcu" },
  ta: fromHighlight("Computer Science Teaching Assistant"),
  aspire: fromHighlight("DoD ASPIRE Capstone"),
  sheinkopf: fromRow("sheinkopf"),
} satisfies Record<string, ExperienceCard>;

export type CardId = keyof typeof EXPERIENCE_CARDS;
export const isCardId = (h: string): h is CardId => h in EXPERIENCE_CARDS;
export const DEEP_IDS = ["nasa", "bob", "me", "vcu", "ta", "aspire", "sheinkopf"] as const;
export type DeepId = (typeof DEEP_IDS)[number];
export const isDeepId = (h: string): h is DeepId => (DEEP_IDS as readonly string[]).includes(h);
