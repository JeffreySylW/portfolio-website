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

/** How far the light on a planet comes round towards the viewer: 0 = half lit, 1 = full. Gibbous, so the HD side always shows. */
export const PLANET_PHASE = 0.4;

const D2R = Math.PI / 180;
type V3 = [number, number, number];
const frame = (lon0: number, lat0: number) => {
  const l = lon0 * D2R, p = lat0 * D2R;
  return {
    e: [-Math.sin(l), Math.cos(l), 0] as V3, // screen right
    n: [-Math.sin(p) * Math.cos(l), -Math.sin(p) * Math.sin(l), Math.cos(p)] as V3, // screen up
    f: [Math.cos(p) * Math.cos(l), Math.cos(p) * Math.sin(l), Math.sin(p)] as V3, // towards the viewer
  };
};
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/**
 * The sun for a planet that turns longitude `face` towards the viewer. The light comes from the same side
 * of the screen as on the hero Earth (the real sun), but at a fixed gibbous phase, so a planet never sits
 * all in night the way the Earth does when the Americas are dark.
 */
export function planetSun(sun: { lat: number; lon: number }, face: number): { lat: number; lon: number } {
  const v: V3 = [Math.cos(sun.lat * D2R) * Math.cos(sun.lon * D2R), Math.cos(sun.lat * D2R) * Math.sin(sun.lon * D2R), Math.sin(sun.lat * D2R)];
  const E = frame(EARTH_VIEW.lon0, EARTH_VIEW.lat0);
  let x = dot(v, E.e), y = dot(v, E.n);
  const len = Math.hypot(x, y);
  if (len < 1e-3) { x = -1; y = 0; } else { x /= len; y /= len; } // sun dead behind or in front: light from the left
  const side = Math.sqrt(1 - PLANET_PHASE * PLANET_PHASE);
  const P = frame(face, EARTH_VIEW.lat0);
  const w = [0, 1, 2].map((k) => x * side * P.e[k] + y * side * P.n[k] + PLANET_PHASE * P.f[k]) as V3;
  const lat = Math.asin(Math.max(-1, Math.min(1, w[2]))) / D2R;
  const lon = Math.atan2(w[1], w[0]) / D2R;
  return { lat, lon };
}

/** Night pixel size in CSS px for a planet `css` px across: the Earth's 7 px on big bodies, finer on small ones. */
export function planetBlockCss(css: number): number {
  return Math.min(EARTH_VIEW.blockCss, Math.max(3, css / 40));
}
