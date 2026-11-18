// Bakes the hero Earth from NASA Blue Marble Next Generation (public domain, see public/textures/CREDITS.md).
// Usage: NODE_OPTIONS=--experimental-strip-types node scripts/make-earth.mjs
// Writes public/textures/earth/: day-2700.webp (texture for the live redraw) and globe-<size>.webp (default image).
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { paintGlobe, PALETTE } from "../src/lib/terminatorPaint.ts";
import { EARTH_VIEW, blockFor } from "../src/lib/earthView.ts";

const SRC = "scripts/assets/bluemarble-200411-5400.jpg";
const OUT = "public/textures/earth";
mkdirSync(OUT, { recursive: true });

// texture for the browser: half resolution keeps it near 0.5 MB
await sharp(SRC).resize(2700, 1350).webp({ quality: 80, effort: 6 }).toFile(`${OUT}/day-2700.webp`);
console.log(`wrote ${OUT}/day-2700.webp`);

const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const texture = { width: info.width, height: info.height, data };

// size -> CSS width it is shown at (desktop hero ~1100 px, phones ~600 px at 2x / 620 px at 1.5x)
for (const [size, css] of [[1600, 1100], [1200, 600], [900, 620]]) {
  const pad = Math.round(size * EARTH_VIEW.padRatio);
  const rgba = paintGlobe({ texture, size, pad, lon0: EARTH_VIEW.lon0, lat0: EARTH_VIEW.lat0, sun: EARTH_VIEW.defaultSun, block: blockFor(size, css) });
  const file = `${OUT}/globe-${size}.webp`;
  const res = await sharp(Buffer.from(rgba.buffer), { raw: { width: size, height: size, channels: 4 } })
    .webp({ quality: 84, alphaQuality: 90, effort: 6 }).toFile(file);
  console.log(`wrote ${file} (${Math.round(res.size / 1024)} KB)`);
}

// Pixel star tiles (shown scaled up with image-rendering: pixelated): dots + small plus sparkles,
// and a separate tile of big sparkles that twinkles in steps.
function starTile(seed, { dots, smallPlus, bigPlus }) {
  const W = 320, H = 200, b = Buffer.alloc(W * H * 4);
  let s = seed; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const put = (x, y, c, a = 255) => { if (x < 0 || y < 0 || x >= W || y >= H) return; const i = (y * W + x) * 4; b[i] = c[0]; b[i + 1] = c[1]; b[i + 2] = c[2]; b[i + 3] = a; };
  for (let n = 0; n < dots; n++) put(Math.floor(r() * W), Math.floor(r() * H), PALETTE[r() > 0.5 ? 3 : 4], 210);
  for (let n = 0; n < smallPlus; n++) {
    const x = Math.floor(r() * W), y = Math.floor(r() * H);
    put(x, y, PALETTE[5]); put(x - 1, y, PALETTE[4]); put(x + 1, y, PALETTE[4]); put(x, y - 1, PALETTE[4]); put(x, y + 1, PALETTE[4]);
  }
  for (let n = 0; n < bigPlus; n++) {
    const x = 20 + Math.floor(r() * (W - 40)), y = 20 + Math.floor(r() * (H - 40));
    for (let k = -4; k <= 4; k++) { const c = Math.abs(k) < 2 ? PALETTE[5] : Math.abs(k) < 4 ? PALETTE[4] : PALETTE[3]; put(x + k, y, c); put(x, y + k, c); }
    for (const [dx, dy] of [[-1, -1], [1, 1], [1, -1], [-1, 1]]) put(x + dx, y + dy, PALETTE[3]);
  }
  return sharp(b, { raw: { width: W, height: H, channels: 4 } }).png({ compressionLevel: 9 });
}
await starTile(7, { dots: 70, smallPlus: 9, bigPlus: 0 }).toFile("public/textures/stars.png");
await starTile(31, { dots: 0, smallPlus: 0, bigPlus: 3 }).toFile("public/textures/stars-twinkle.png");
console.log("wrote public/textures/stars.png, stars-twinkle.png");
