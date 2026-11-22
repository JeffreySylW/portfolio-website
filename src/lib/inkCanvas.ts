// Canvas drawing for the ink-brush Big Bang (geometry lives in src/lib/inkBrush.ts, timing in bigBang.ts).
// Everything draws in CSS pixels; the caller sets the dpr transform.
import { hash, vnoise, type BrushPath } from "./inkBrush";

const TAU = Math.PI * 2;
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

export type BrushOpts = {
  /** Brush width in px. */
  w: number;
  color: string;
  /** How much of the path has been drawn, 0..1. */
  p?: number;
  /** 0..1: how quickly the bristles break up toward the tail. */
  dry?: number;
  seed?: number;
  /** Share of the path over which the stroke swells from nothing. */
  attack?: number;
  /** Width left at the very end, as a share of w. */
  tailMin?: number;
  bristles?: number;
  /** Share of the path covered by the solid core. */
  core?: number;
  alpha?: number;
};

/** One brush stroke: a solid core plus bristles that run dry toward the tail ("flying white"). */
export function brush(ctx: CanvasRenderingContext2D, path: BrushPath, o: BrushOpts): void {
  const { pts, nrm, n } = path;
  const p = clamp01(o.p ?? 1);
  if (p <= 0) return;
  const upto = Math.max(1, Math.floor(p * n));
  const W = o.w, dry = o.dry ?? 0.45, seed = o.seed ?? 1, att = o.attack ?? 0.06, tmin = o.tailMin ?? 0.06;
  const core = o.core ?? 0.62;
  const wid = (i: number) => {
    const s = i / n, a = Math.min(1, s / att);
    return W * Math.sqrt(a) * (tmin + (1 - tmin) * (1 - 0.75 * s ** 1.6)) * (0.88 + 0.24 * vnoise(seed + 7, s * 6));
  };
  const coreEnd = Math.min(upto, Math.floor(n * core));
  const cw = (i: number) => wid(i) * 0.36 * (1 - (i / n / core) ** 3);
  ctx.save();
  ctx.globalAlpha *= o.alpha ?? 1;
  ctx.fillStyle = ctx.strokeStyle = o.color;
  ctx.beginPath();
  for (let i = 0; i <= coreEnd; i++) { const w = cw(i), [x, y] = pts[i], [nx, ny] = nrm[i]; ctx.lineTo(x + nx * w, y + ny * w); }
  for (let i = coreEnd; i >= 0; i--) { const w = cw(i), [x, y] = pts[i], [nx, ny] = nrm[i]; ctx.lineTo(x - nx * w, y - ny * w); }
  ctx.fill();
  const B = o.bristles ?? 26;
  ctx.lineCap = "round";
  for (let b = 0; b < B; b++) {
    const off = (b / (B - 1)) * 2 - 1, r = hash(seed, b * 31 + 5), edge = Math.abs(off);
    ctx.lineWidth = Math.max(0.6, W * (0.025 + 0.06 * r));
    ctx.beginPath();
    let pen = false;
    for (let i = 0; i <= upto; i++) {
      const s = i / n, thr = dry * (0.04 + s ** 1.4 * 1.25) + edge ** 3 * 0.5 * dry;
      const on = vnoise(seed * 13 + b, s * (9 + r * 16)) > thr;
      const w = wid(i) * 0.5 * off * (1 + 0.1 * (vnoise(seed + b, s * 3) - 0.5));
      const [x, y] = pts[i], [nx, ny] = nrm[i], X = x + nx * w, Y = y + ny * w;
      if (on) { if (pen) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); pen = true; } else pen = false;
    }
    ctx.stroke();
  }
  ctx.restore();
}

/** Droplets thrown in a cone (or all round with spread = TAU). */
export function splatter(ctx: CanvasRenderingContext2D, x: number, y: number, ang: number, spread: number, dist: number, count: number, size: number, seed: number, color: string, k = 1): void {
  ctx.fillStyle = color;
  for (let i = 0; i < count; i++) {
    const a = ang + (hash(seed, i * 3) - 0.5) * spread;
    const d = dist * (0.25 + hash(seed, i * 3 + 1) ** 2 * 1.05) * k;
    const s = size * (0.25 + hash(seed, i * 3 + 2) ** 2 * 1.3) * (1 - (0.45 * d) / dist);
    ctx.beginPath();
    ctx.ellipse(x + Math.cos(a) * d, y + Math.sin(a) * d, Math.max(0.2, s * (1 + hash(seed, i + 99) * 1.2)), Math.max(0.2, s), a, 0, TAU);
    ctx.fill();
  }
}

/** A rough-edged round blob path (not filled). */
export function blob(ctx: CanvasRenderingContext2D, x: number, y: number, R: number, seed: number, rough = 0.2): void {
  ctx.beginPath();
  const N = 96;
  for (let i = 0; i <= N; i++) {
    const th = (i / N) * TAU;
    const rr = R * (1 + rough * (vnoise(seed, (i / N) * 7, 7) - 0.5) * 2 + rough * 0.45 * (vnoise(seed + 3, (i / N) * 23, 23) - 0.5) * 2);
    ctx.lineTo(x + Math.cos(th) * rr, y + Math.sin(th) * rr);
  }
  ctx.closePath();
}

/** The falling teardrop; its tail grows with speed (k = 0..1). `y` is the bottom of the drop. */
export function drop(ctx: CanvasRenderingContext2D, cx: number, y: number, r: number, k: number, color: string): void {
  const rx = r * (1 - 0.1 * k), ry = r, tail = r * (0.6 + 1.8 * k), by = y - ry;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, by - ry - tail);
  ctx.bezierCurveTo(cx + rx * 0.35, by - ry - tail * 0.45, cx + rx, by - ry * 0.55, cx + rx, by);
  ctx.arc(cx, by, rx, 0, Math.PI, false);
  ctx.bezierCurveTo(cx - rx, by - ry * 0.55, cx - rx * 0.35, by - ry - tail * 0.45, cx, by - ry - tail);
  ctx.fill();
}

/** A small seeded paper-grain tile. */
export function makeGrain(): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = c.height = 160;
  const g = c.getContext("2d")!;
  const d = g.createImageData(160, 160);
  for (let i = 0; i < d.data.length; i += 4) {
    const v = hash(7, i >> 2);
    d.data[i] = d.data[i + 1] = d.data[i + 2] = v < 0.5 ? 20 : 255;
    d.data[i + 3] = Math.floor(Math.abs(v - 0.5) * 2 * 34);
  }
  g.putImageData(d, 0, 0);
  return c;
}

/** Paper: a flat colour with a little grain. */
export function paper(ctx: CanvasRenderingContext2D, grain: HTMLCanvasElement, w: number, h: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, w, h);
  const pat = ctx.createPattern(grain, "repeat");
  if (pat) { ctx.fillStyle = pat; ctx.fillRect(0, 0, w, h); }
}
