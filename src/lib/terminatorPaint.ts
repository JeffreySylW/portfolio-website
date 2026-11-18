// Paints the Earth as one image with two resolutions: the sunlit side is the photo, the night side
// is stepped into a flat indigo palette with a 4x4 Bayer dither in square blocks, with a hard
// violet pixel outline on the night limb. A dithered band blends the two across the terminator.
// Pure and self-contained so the build script (Node) and the browser worker share it exactly.

export type RGB = [number, number, number];

/** Flat steps, darkest first: void, deep, indigo, violet, lavender, starlight. */
export const PALETTE: RGB[] = [
  [7, 6, 26],
  [21, 18, 61],
  [43, 42, 122],
  [91, 84, 214],
  [169, 164, 255],
  [242, 240, 255],
];

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
const D2R = Math.PI / 180;

export interface Texture {
  width: number;
  height: number;
  /** RGBA, row-major, equirectangular (x = longitude from -180, y = latitude from +90). */
  data: Uint8ClampedArray | Uint8Array;
}

export interface PaintOptions {
  texture: Texture;
  /** Output is size x size pixels; the disc fills it minus `pad` on each side. */
  size: number;
  pad: number;
  /** Centre of the view, degrees. */
  lon0: number;
  lat0: number;
  /** Subsolar point, degrees. */
  sun: { lat: number; lon: number };
  /** Night-side pixel block size in output pixels. */
  block: number;
}

function sample(t: Texture, lon: number, lat: number, out: number[]) {
  const u = (((lon + 180) / 360) * t.width) - 0.5;
  const v = Math.min(t.height - 1.001, Math.max(0, ((90 - lat) / 180) * t.height - 0.5));
  const x0 = Math.floor(u), y0 = Math.floor(v), fx = u - x0, fy = v - y0;
  const xa = ((x0 % t.width) + t.width) % t.width, xb = (xa + 1) % t.width, yb = Math.min(t.height - 1, y0 + 1);
  for (let k = 0; k < 3; k++) {
    const a = t.data[(y0 * t.width + xa) * 4 + k], b = t.data[(y0 * t.width + xb) * 4 + k];
    const c = t.data[(yb * t.width + xa) * 4 + k], d = t.data[(yb * t.width + xb) * 4 + k];
    out[k] = (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy;
  }
}

export function paintGlobe(o: PaintOptions): Uint8ClampedArray {
  const { texture, size, pad, lon0, lat0, block } = o;
  const R = (size - 2 * pad) / 2;
  const C = size / 2;
  const out = new Uint8ClampedArray(size * size * 4);
  const sl0 = Math.sin(lat0 * D2R), cl0 = Math.cos(lat0 * D2R);
  const sLa = o.sun.lat * D2R, sLo = o.sun.lon * D2R;
  const sun = [Math.cos(sLa) * Math.cos(sLo), Math.cos(sLa) * Math.sin(sLo), Math.sin(sLa)];
  const col = [0, 0, 0];

  // screen offset (x right, y up) -> lon, lat, depth (cos c); null outside the disc
  const inv = (x: number, y: number): [number, number, number] | null => {
    const rho = Math.hypot(x, y);
    if (rho > R) return null;
    if (rho === 0) return [lon0, lat0, 1];
    const c = Math.asin(rho / R), sc = Math.sin(c), cc = Math.cos(c);
    const lat = Math.asin(cc * sl0 + (y * sc * cl0) / rho) / D2R;
    const lon = lon0 + Math.atan2(x * sc, rho * cl0 * cc - y * sl0 * sc) / D2R;
    return [lon, lat, cc];
  };
  const light = (lon: number, lat: number) => {
    const la = lat * D2R, lo = lon * D2R;
    return Math.cos(la) * Math.cos(lo) * sun[0] + Math.cos(la) * Math.sin(lo) * sun[1] + Math.sin(la) * sun[2];
  };

  // One night colour and one lighting value per block.
  const nb = Math.ceil(size / block);
  const blockLight = new Float32Array(nb * nb).fill(NaN);
  const blockStep = new Int8Array(nb * nb).fill(-1);
  for (let by = 0; by < nb; by++) for (let bx = 0; bx < nb; bx++) {
    const x = bx * block + block / 2 - C, y = C - (by * block + block / 2);
    const h = inv(x, y);
    if (!h) continue;
    const t = BAYER[(by % 4) * 4 + (bx % 4)];
    sample(texture, h[0], h[1], col);
    const lum = (0.3 * col[0] + 0.55 * col[1] + 0.15 * col[2]) / 255;
    const land = col[2] < col[1] * 1.05 + 10; // oceans are blue-dominant
    let lvl = (land ? 1.15 + lum * 1.9 : 0.55 + lum * 0.7) + h[2] * 0.25;
    const lo = Math.floor(lvl);
    let step = Math.max(0, Math.min(4, lvl - lo > t ? lo + 1 : lo));
    if (Math.hypot(x, y) > R - block * 1.2) step = 3; // hard outline on the limb
    blockLight[by * nb + bx] = light(h[0], h[1]);
    blockStep[by * nb + bx] = step;
  }

  for (let py = 0; py < size; py++) for (let px = 0; px < size; px++) {
    const i = (py * size + px) * 4;
    const bx = Math.floor(px / block), by = Math.floor(py / block), bi = by * nb + bx;
    // dithered band across the terminator: below the threshold the block is pixel art
    if (blockStep[bi] >= 0) {
      const band = (blockLight[bi] + 0.05) / 0.17;
      if (band < BAYER[(by % 4) * 4 + (bx % 4)]) {
        const p = PALETTE[blockStep[bi]];
        out[i] = p[0]; out[i + 1] = p[1]; out[i + 2] = p[2]; out[i + 3] = 255;
        continue;
      }
    }
    const x = px + 0.5 - C, y = C - (py + 0.5);
    const rho = Math.hypot(x, y);
    const h = inv(x, y);
    if (h) {
      sample(texture, h[0], h[1], col);
      const d = Math.max(0, light(h[0], h[1]));
      const shade = 0.06 + 1.05 * Math.pow(d, 0.7);
      const rim = Math.pow(1 - h[2], 3) * d; // atmosphere on the lit limb
      out[i] = Math.min(255, col[0] * shade + rim * 120);
      out[i + 1] = Math.min(255, col[1] * shade + rim * 170);
      out[i + 2] = Math.min(255, col[2] * shade + rim * 255);
      out[i + 3] = rho > R - 1 ? Math.round(255 * Math.max(0, R - rho + 1)) : 255;
      if (out[i + 3] === 0) out[i] = out[i + 1] = out[i + 2] = 0;
      continue;
    }
    // soft halo outside the disc, only where the limb below it is lit
    const over = rho - R;
    if (over > 0 && over < pad) {
      const e = inv((x / rho) * (R - 0.5), (y / rho) * (R - 0.5));
      const d = e ? Math.max(0, light(e[0], e[1]) + 0.15) : 0;
      const g = Math.exp(-over / (pad * 0.28)) * Math.min(1, d * 1.6);
      if (g > 0.01) { out[i] = 150; out[i + 1] = 200; out[i + 2] = 255; out[i + 3] = Math.round(255 * g * 0.85); }
    }
  }
  return out;
}
