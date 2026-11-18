// The system map: one line of time, each planet placed where its experience started, with a trail to
// where it ended. Positions are fractions of the axis (0 = the first start, 1 = now) so CSS can lay
// them out at any width.
import { EARTH_VIEW } from "./earthView.ts";

export const monthIndex = (ym: string): number => {
  const [y, m] = ym.split("-").map(Number);
  return y * 12 + (m - 1);
};

export interface SpanLike {
  start: string;
  end?: string;
}

export interface BodyLayout {
  id: string;
  /** Start and end along the axis, 0..1. */
  x0: number;
  x1: number;
  /** Which side of the planet its label goes, so it never runs off the axis. */
  labelSide: "left" | "right";
}

export interface SystemLayout {
  bodies: BodyLayout[];
  ticks: { label: string; x: number }[];
}

export function systemLayout<K extends string>(spans: Record<K, SpanLike>, now: Date): SystemLayout {
  const ids = Object.keys(spans) as K[];
  const nowM = now.getUTCFullYear() * 12 + now.getUTCMonth();
  const from = Math.min(...ids.map((id) => monthIndex(spans[id].start)));
  const len = Math.max(1, nowM - from);
  const at = (m: number) => Math.min(1, Math.max(0, (m - from) / len));
  const bodies = ids
    .map((id, order) => ({ id, order, s: monthIndex(spans[id].start), e: spans[id].end ? monthIndex(spans[id].end!) : nowM }))
    .sort((a, b) => a.s - b.s || a.order - b.order)
    .map(({ id, s, e }) => {
      const x0 = at(s);
      return { id, x0, x1: at(e), labelSide: (x0 > 0.62 ? "left" : "right") as BodyLayout["labelSide"] };
    });
  const ticks: SystemLayout["ticks"] = [];
  for (let y = Math.floor(from / 12) + 1; y * 12 < nowM; y++) ticks.push({ label: String(y), x: at(y * 12) });
  ticks.push({ label: "Now", x: 1 });
  return { bodies, ticks };
}

/**
 * The sun for a planet that turns longitude `face` towards the viewer, so it is lit from the same
 * screen direction as the hero Earth (same view latitude, sun turned with the view).
 */
export function planetSun(sun: { lat: number; lon: number }, face: number): { lat: number; lon: number } {
  const lon = sun.lon + (face - EARTH_VIEW.lon0);
  return { lat: sun.lat, lon: ((((lon + 180) % 360) + 360) % 360) - 180 };
}

/** Night pixel size in CSS px for a planet `css` px across: the Earth's 7 px on big bodies, finer on small ones. */
export function planetBlockCss(css: number): number {
  return Math.min(EARTH_VIEW.blockCss, Math.max(3, css / 40));
}
