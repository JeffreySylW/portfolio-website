// The system map: the experience worlds inside the Milky Way, along one spiral arm by date, plus the
// lighting and motion helpers shared by the bake script and the browser.
import { EARTH_VIEW } from "./earthView.ts";

export const monthIndex = (ym: string): number => {
  const [y, m] = ym.split("-").map(Number);
  return y * 12 + (m - 1);
};

export interface SpanLike {
  start: string;
  end?: string;
}

/** The Milky Way image the planets sit in. Positions are fractions of its width/height (y down). */
export const GALAXY = {
  /** Where the core is in the image (measured from the bright bar). */
  center: [0.5, 0.5] as const,
  /** The galaxy's width on a desktop screen; planet sizes are relative to it. */
  designPx: 960,
  /** The arm: radius and angle (degrees, clockwise from +x) at f = 0 (oldest) and the spread to f = 1 (newest). */
  r0: 0.115,
  dr: 0.31,
  a0: 200,
  da: 260,
};

const armPoint = (f: number): [number, number] => {
  const r = GALAXY.r0 + GALAXY.dr * f;
  const a = ((GALAXY.a0 + GALAXY.da * f) * Math.PI) / 180;
  return [GALAXY.center[0] + r * Math.cos(a), GALAXY.center[1] + r * Math.sin(a)];
};

export interface GalaxyBody {
  id: string;
  x: number;
  y: number;
  /** Labels go on the outer side, away from the core. */
  labelSide: "left" | "right";
}

/**
 * Places each world along one spiral arm by start date: the oldest near the core, the newest on the rim.
 * Evenly spaced by order (TA and the capstone began the same month, so months alone would stack them).
 */
export function galaxyLayout<K extends string>(spans: Record<K, SpanLike>): GalaxyBody[] {
  const ids = (Object.keys(spans) as K[])
    .map((id, order) => ({ id, order, s: monthIndex(spans[id].start) }))
    .sort((a, b) => a.s - b.s || a.order - b.order);
  const n = Math.max(1, ids.length - 1);
  return ids.map(({ id }, k) => {
    const [x, y] = armPoint(k / n);
    return { id, x, y, labelSide: x < GALAXY.center[0] ? "left" : "right" };
  });
}

/** The arm as `count` points in 0..100 (for an SVG viewBox), from inside the core to the newest world. */
export function armPath(count: number): [number, number][] {
  const from = -0.35;
  return Array.from({ length: count }, (_, i) => {
    const [x, y] = armPoint(from + ((1 - from) * i) / (count - 1));
    return [x * 100, y * 100];
  });
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

/** The longitude facing the viewer `t` seconds in, for a planet turning once every `spin` seconds (sign = direction). */
export function spinLongitude(face: number, spin: number, t: number): number {
  const lon = face + (360 * t) / spin;
  return ((((lon + 180) % 360) + 360) % 360) - 180;
}

/** Dither offset for the night-side shimmer: steps through four positions, one every quarter second. */
export function shimmerStep(t: number): number {
  return Math.floor(t * 4 + 1e-9) % 4;
}
