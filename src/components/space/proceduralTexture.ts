import * as THREE from "three";
import { BODIES } from "@/content/space";

const W = 512;
const H = 256;
const TAU = Math.PI * 2;

// Seeded integer hash -> [0,1)
function hash(x: number, y: number, z: number, seed: number): number {
  let h = (x * 374761393 + y * 668265263 + z * 2147483647 + seed * 1274126177) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

const fade = (t: number) => t * t * (3 - 2 * t);
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

function noise3(x: number, y: number, z: number, seed: number): number {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const fx = fade(x - xi), fy = fade(y - yi), fz = fade(z - zi);
  const c = (dx: number, dy: number, dz: number) => hash(xi + dx, yi + dy, zi + dz, seed);
  return mix(
    mix(mix(c(0, 0, 0), c(1, 0, 0), fx), mix(c(0, 1, 0), c(1, 1, 0), fx), fy),
    mix(mix(c(0, 0, 1), c(1, 0, 1), fx), mix(c(0, 1, 1), c(1, 1, 1), fx), fy),
    fz,
  );
}

// Periodic in u: sample the noise on a circle so the left and right edges meet.
function fbm(u: number, v: number, freq: number, seed: number, oct = 4): number {
  let sum = 0, amp = 0.5, f = freq;
  for (let i = 0; i < oct; i++) {
    sum += amp * noise3(Math.cos(u) * f, v * f * 0.5, Math.sin(u) * f, seed + i);
    amp *= 0.5;
    f *= 2;
  }
  return sum;
}

type RGB = [number, number, number];
const hex = (c: string): RGB => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
const lerp3 = (a: RGB, b: RGB, t: number): RGB => {
  const k = Math.min(1, Math.max(0, t));
  return [mix(a[0], b[0], k), mix(a[1], b[1], k), mix(a[2], b[2], k)];
};
// piecewise colour ramp over t in [0,1]
const ramp = (stops: RGB[], t: number): RGB => {
  const s = Math.min(0.9999, Math.max(0, t)) * (stops.length - 1);
  const i = Math.floor(s);
  return lerp3(stops[i], stops[i + 1], s - i);
};
// wrapped horizontal distance in [0,1]
const wrapDx = (a: number, b: number) => {
  const d = Math.abs(a - b);
  return Math.min(d, 1 - d);
};

type Shade = (u: number, v: number, px: number, py: number) => RGB;

function sun(): Shade {
  const stops: RGB[] = [hex("#7a1204"), hex("#d9380d"), hex("#ff8c1a"), hex("#ffd24a"), hex("#fffbe0")];
  return (u, v) => {
    const warp = fbm(u, v, 2, 11, 3);
    const n = fbm(u + warp * 1.5, v + warp, 5, 3, 5);
    const cells = 1 - Math.abs(fbm(u, v, 9, 7, 3) - 0.5) * 2.4; // bright centres, dark lanes
    return ramp(stops, 0.25 + n * 0.55 + Math.max(0, cells) * 0.35);
  };
}

function gas(): Shade {
  const teal = hex("#12b5b0"), deep = hex("#0b3d63"), violet = hex("#8a4fd8"), pale = hex("#b6f2ee");
  return (u, v) => {
    const x = u / TAU;
    const dx = wrapDx(x, 0.35) / 0.14, dy = (v - 0.58) / 0.07;
    const d = dx * dx + dy * dy;
    let bv = v * 16 + fbm(u, v, 3, 5, 4) * 2.2;
    if (d < 1.6) bv += Math.sin(Math.atan2(dy, dx) * 2 + d * 5) * (1.6 - d) * 1.4; // storm swirl
    const b = 0.5 + 0.5 * Math.sin(bv * 2);
    let c = lerp3(lerp3(deep, teal, b), violet, fbm(u, v, 2, 9, 3) * 1.3 - 0.35);
    c = lerp3(c, pale, Math.max(0, fbm(u, v, 12, 2, 2) - 0.6) * 1.5);
    if (d < 1) c = lerp3(c, d < 0.35 ? hex("#ffd9f2") : hex("#e0508c"), Math.min(1, (1 - d) * 1.6));
    return c;
  };
}

function rock(): Shade {
  const craters = Array.from({ length: 28 }, (_, i) => ({
    x: hash(i, 1, 0, 42), y: 0.1 + hash(i, 2, 0, 42) * 0.8, r: 0.012 + hash(i, 3, 0, 42) ** 2 * 0.05,
  }));
  const rust = hex("#c4561c"), dark = hex("#4a1d0c"), dust = hex("#f0c48a");
  return (u, v) => {
    const x = u / TAU;
    let c = lerp3(lerp3(dark, rust, 0.35 + fbm(u, v, 4, 8, 5) * 0.9), dust, Math.max(0, fbm(u, v, 7, 4, 3) - 0.55) * 1.6);
    const crack = Math.abs(fbm(u, v, 6, 21, 3) - 0.5);
    if (crack < 0.018) c = lerp3(c, dark, 1 - crack / 0.018);
    for (const k of craters) {
      const dx = wrapDx(x, k.x) * 2, dy = v - k.y; // x spans 2:1 vs y
      const d = Math.hypot(dx, dy) / k.r;
      if (d < 1) c = lerp3(c, dark, 0.85 * (1 - d * d * 0.4));
      else if (d < 1.35) c = lerp3(c, dust, 0.55 * (1.35 - d) / 0.35);
    }
    return c;
  };
}

function star(color: string): Shade {
  const base = hex(color);
  return (u, v) => {
    const n = fbm(u, v, 3, 17, 4);
    return lerp3(lerp3(base, [255, 255, 255], 0.35 + n * 0.5), base, Math.abs(n - 0.5) * 2.5);
  };
}

function metal(accent: string | null, station: boolean): Shade {
  const acc = hex(accent ?? "#ffffff");
  return (u, v, px, py) => {
    const panel = hash(Math.floor(px / 32), Math.floor(py / 16), 0, 5);
    let c = lerp3(hex("#6c7684"), hex("#c9d3e0"), 0.35 + panel * 0.35 + fbm(u, v, 20, 6, 2) * 0.25);
    if (px % 32 < 1.5 || py % 16 < 1.5) c = lerp3(c, hex("#2a3038"), 0.7); // panel seams
    if (accent && v > 0.4 && v < 0.6) c = lerp3(c, acc, 0.9);
    if (station) c = lerp3(c, hex("#ffcf8a"), Math.max(0, Math.cos(u - 1) ) * 0.35 * (1 - Math.abs(v - 0.5)));
    return c;
  };
}

const cache = new Map<string, THREE.CanvasTexture>();

/** Equirectangular, horizontally wrapping canvas texture for a body id ("sun" or a BODIES id). Cached per id. */
export function proceduralTexture(id: string): THREE.CanvasTexture {
  const hit = cache.get(id);
  if (hit) return hit;
  const body = BODIES.find((b) => b.id === id);
  const shade: Shade =
    id === "sun" ? sun()
    : body?.look === "gas" ? gas()
    : body?.look === "rock" ? rock()
    : body?.look === "star" ? star(body.color)
    : body?.look === "module" ? metal(body.color, false)
    : metal(null, true);
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const img = ctx.createImageData(W, H);
    for (let py = 0; py < H; py++) {
      for (let px = 0; px < W; px++) {
        const [r, g, b] = shade((px / W) * TAU, py / H, px, py);
        const i = (py * W + px) * 4;
        img.data[i] = r; img.data[i + 1] = g; img.data[i + 2] = b; img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  cache.set(id, tex);
  return tex;
}
