// Pure ink-brush geometry for the Big Bang intro (src/lib/bigBang.ts): repeatable noise, smooth brush paths, the
// strokes that sweep in, the slashes that burst out, and the brush strokes of "JW". No canvas here, so it is testable;
// the canvas drawing is in src/lib/inkCanvas.ts. Everything is seeded, so the intro looks the same every visit.

const TAU = Math.PI * 2;
export type Pt = [number, number];

export const SWEEP_COUNT = 9;
export const SLASH_COUNT = 12;

/** Repeatable value in 0..1 from two integers. */
export function hash(a: number, b: number): number {
  let h = Math.imul((a * 374761393 + b * 668265263) | 0, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Smooth 1-D value noise in 0..1; `period` makes it wrap (for closed outlines). */
export function vnoise(seed: number, x: number, period?: number): number {
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  const wrap = (k: number) => (period ? ((k % period) + period) % period : k);
  return hash(seed, wrap(i)) * (1 - u) + hash(seed, wrap(i + 1)) * u;
}

export type BrushPath = { pts: Pt[]; nrm: Pt[]; n: number };

/** A smooth (Catmull-Rom) path through the control points, with a unit normal at every point. */
export function makePath(ctrl: Pt[], n = 90): BrushPath {
  const pts: Pt[] = [];
  const segs = ctrl.length - 1;
  for (let i = 0; i <= n; i++) {
    const u = (i / n) * segs;
    const k = Math.min(segs - 1, Math.floor(u));
    const f = u - k, f2 = f * f, f3 = f2 * f;
    const p0 = ctrl[Math.max(0, k - 1)], p1 = ctrl[k], p2 = ctrl[k + 1], p3 = ctrl[Math.min(segs, k + 2)];
    const cr = (a: number, b: number, c: number, d: number) =>
      0.5 * (2 * b + (-a + c) * f + (2 * a - 5 * b + 4 * c - d) * f2 + (-a + 3 * b - 3 * c + d) * f3);
    pts.push([cr(p0[0], p1[0], p2[0], p3[0]), cr(p0[1], p1[1], p2[1], p3[1])]);
  }
  const nrm: Pt[] = pts.map((_, i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
    return [-dy / len, dx / len];
  });
  return { pts, nrm, n };
}

export type StrokeSpec = {
  angle: number;
  /** Control points, relative to the middle of the screen. */
  ctrl: Pt[];
  /** Brush width as a share of the screen's short side. */
  width: number;
  /** Milliseconds after the landing (sweeps) or the blast (slashes) before it starts. */
  delay: number;
  seed: number;
};

/** The strokes that sweep in from every side, spiralling to the middle. `reach` = distance to the farthest corner. */
export function sweepStrokes(reach: number): StrokeSpec[] {
  const out: StrokeSpec[] = [];
  for (let i = 0; i < SWEEP_COUNT; i++) {
    const angle = (i / SWEEP_COUNT) * TAU + 0.35 + (hash(210, i) - 0.5) * 0.5;
    const spin = (i % 2 ? 1 : -1) * 0.9;
    const ctrl = [1.08, 0.72, 0.4, 0.16, 0.02].map((f, k): Pt => {
      const aa = angle + spin * Math.max(0, 1 - f) ** 1.3 * (1 + 0.1 * k), d = reach * f;
      return [Math.cos(aa) * d, Math.sin(aa) * d];
    });
    out.push({ angle, ctrl, width: 0.09 + 0.05 * hash(211, i), delay: i * 28, seed: 220 + i });
  }
  return out;
}

/** The ink slashes of the blast, fanned out all round the middle. */
export function slashes(reach: number, m = reach * 0.6): StrokeSpec[] {
  const out: StrokeSpec[] = [];
  for (let i = 0; i < SLASH_COUNT; i++) {
    const angle = (i / SLASH_COUNT) * TAU + (hash(260, i) - 0.5) * 0.35;
    const len = reach * (0.85 + 0.5 * hash(261, i)), bend = (hash(262, i) - 0.5) * 0.5;
    const ctrl = [0, 0.3, 0.65, 1].map((f): Pt => {
      const d = m * 0.02 + len * f, aa = angle + bend * Math.sin(f * Math.PI);
      return [Math.cos(aa) * d, Math.sin(aa) * d];
    });
    out.push({ angle, ctrl, width: 0.05 + 0.08 * hash(263, i), delay: (i % 4) * 12, seed: 270 + i });
  }
  return out;
}

/** Brush strokes of "JW": the J's top bar, the J, the W. Centred on (cx, cy), box height H. */
const GLYPHS: Pt[][] = [
  [[0.12, 0.06], [0.29, 0.03], [0.47, 0.02]],
  [[0.31, 0.04], [0.32, 0.45], [0.31, 0.76], [0.19, 0.96], [0.03, 0.85]],
  [[0.56, 0.04], [0.66, 0.95], [0.8, 0.32], [0.93, 0.95], [1.07, 0.03]],
];
export function jwGlyphs(cx: number, cy: number, H: number): Pt[][] {
  return GLYPHS.map((g) => g.map(([x, y]): Pt => [cx + (x - 0.55) * H, cy + (y - 0.5) * H]));
}
