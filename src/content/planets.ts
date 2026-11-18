// One world per piece of experience, for the system map. Spans come from the work list, so the
// map can never disagree with the dates printed there.
import { WORK } from "./work.ts";

export type PlanetId = "vcu" | "ta" | "aspire" | "nasa" | "bob" | "sheinkopf";

export interface Planet {
  id: PlanetId;
  /** The work row the planet links to. */
  workId: string;
  /** For a highlight inside a row (TA, ASPIRE): its name in the row. */
  highlight?: string;
  label: string;
  /** What the world is, for alt text and the credits. */
  world: string;
  /** Diameter on a desktop screen, CSS px (phones scale it down). */
  size: number;
  /** Longitude turned towards the viewer at the start. */
  face: number;
  /** Seconds per turn; the sign is the direction. */
  spin: number;
}

export const PLANETS: Planet[] = [
  { id: "vcu", workId: "vcu", label: "VCU · B.S. Computer Science", world: "a black world carrying the VCU seal and wordmark", size: 140, face: 0, spin: 120 },
  { id: "ta", workId: "vcu", highlight: "Computer Science Teaching Assistant", label: "Teaching assistant", world: "a chalkboard world written over with code", size: 52, face: 0, spin: -75 },
  { id: "aspire", workId: "vcu", highlight: "DoD ASPIRE Capstone", label: "DoD ASPIRE capstone", world: "a LiDAR world of scan lines, a point cloud and pedestrian detection boxes", size: 48, face: 0, spin: 90 },
  { id: "nasa", workId: "nasa", label: "NASA Langley", world: "a NASA-blue world carrying the NASA insignia", size: 100, face: 0, spin: 110 },
  { id: "bob", workId: "bob", label: "Bob The Tech Guy", world: "a circuit-board world", size: 120, face: 0, spin: -130 },
  { id: "sheinkopf", workId: "sheinkopf", label: "Rob Sheinkopf, Author", world: "a stitched baseball world", size: 72, face: 0, spin: 100 },
];

export interface Span {
  dates: string;
  start: string;
  end?: string;
}

/** Each planet's dates, read from its work row (or the highlight inside it). */
export function planetSpans(): Record<PlanetId, Span> {
  const out = {} as Record<PlanetId, Span>;
  for (const p of PLANETS) {
    const row = WORK.find((w) => w.id === p.workId);
    if (!row) throw new Error(`no work row ${p.workId}`);
    const src = p.highlight ? row.highlights?.find((h) => h.name === p.highlight) : row;
    if (!src) throw new Error(`no highlight ${p.highlight}`);
    out[p.id] = { dates: src.dates, start: src.start, end: src.end };
  }
  return out;
}
