// Bakes the Milky Way behind the system map: the bright galaxy stays the HD illustration, its faint glow
// steps into the site's indigo palette with a 4x4 Bayer dither, so it melts into the page with no gradient.
// Source: NASA/JPL-Caltech/ESO/R. Hurt, eso1339g (CC BY 4.0), see public/textures/CREDITS.md.
// Usage: node scripts/make-galaxy.mjs  ->  public/textures/galaxy/milkyway-1600.webp, milkyway-900.webp
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const SRC = "scripts/assets/galaxy/milkyway-eso1339g-3840.jpg";
const OUT = "public/textures/galaxy";
mkdirSync(OUT, { recursive: true });

// void, deep, indigo, violet (same steps as src/lib/terminatorPaint.ts PALETTE)
const P = [[7, 6, 26], [21, 18, 61], [43, 42, 122], [91, 84, 214]];
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);

async function bake(size, block, quality) {
  const { data } = await sharp(SRC).resize(size, size, { kernel: "lanczos3" }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const out = Buffer.alloc(size * size * 3);
  const lum = (i) => (0.3 * data[i] + 0.55 * data[i + 1] + 0.15 * data[i + 2]) / 255;
  for (let by = 0; by < size; by += block) for (let bx = 0; bx < size; bx += block) {
    let s = 0, n = 0;
    for (let y = by; y < Math.min(size, by + block); y++) for (let x = bx; x < Math.min(size, bx + block); x++) { s += lum((y * size + x) * 3); n++; }
    const L = s / n;
    const t = BAYER[((by / block) % 4) * 4 + ((bx / block) % 4)];
    // bright galaxy: the photo; a dithered band hands over to pixels; faint glow: palette steps
    const photo = L > 0.22 || (L > 0.13 && (L - 0.13) / 0.09 > t);
    const lvl = Math.max(0, Math.min(3.999, (L - 0.05) * 13));
    const lo = Math.floor(lvl);
    const c = P[Math.min(3, lvl - lo > t ? lo + 1 : lo)];
    for (let y = by; y < Math.min(size, by + block); y++) for (let x = bx; x < Math.min(size, bx + block); x++) {
      const i = (y * size + x) * 3;
      if (photo) { out[i] = data[i]; out[i + 1] = data[i + 1]; out[i + 2] = data[i + 2]; }
      else { out[i] = c[0]; out[i + 1] = c[1]; out[i + 2] = c[2]; }
    }
  }
  const f = `${OUT}/milkyway-${size}.webp`;
  const res = await sharp(out, { raw: { width: size, height: size, channels: 3 } }).webp({ quality, effort: 6 }).toFile(f);
  console.log(`wrote ${f} (${Math.round(res.size / 1024)} KB)`);
}

await bake(1600, 7, 80);
await bake(900, 5, 80);
