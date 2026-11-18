// Bakes the hero Earth from NASA Blue Marble Next Generation (public domain, see public/textures/CREDITS.md).
// Usage: NODE_OPTIONS=--experimental-strip-types node scripts/make-earth.mjs
// Writes public/textures/earth/: day-2700.webp (texture for the live redraw) and globe-<size>.webp (default image).
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { paintGlobe } from "../src/lib/terminatorPaint.ts";
import { EARTH_VIEW, blockFor } from "../src/lib/earthView.ts";

const SRC = "scripts/assets/bluemarble-200411-5400.jpg";
const OUT = "public/textures/earth";
mkdirSync(OUT, { recursive: true });

// texture for the browser: half resolution keeps it near 0.5 MB
await sharp(SRC).resize(2700, 1350).webp({ quality: 80, effort: 6 }).toFile(`${OUT}/day-2700.webp`);
console.log(`wrote ${OUT}/day-2700.webp`);

const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const texture = { width: info.width, height: info.height, data };

// size -> CSS width it is shown at (desktop hero 1100 px, phones 620 px)
for (const [size, css] of [[1600, 1100], [900, 620]]) {
  const pad = Math.round(size * EARTH_VIEW.padRatio);
  const rgba = paintGlobe({ texture, size, pad, lon0: EARTH_VIEW.lon0, lat0: EARTH_VIEW.lat0, sun: EARTH_VIEW.defaultSun, block: blockFor(size, css) });
  const file = `${OUT}/globe-${size}.webp`;
  const res = await sharp(Buffer.from(rgba.buffer), { raw: { width: size, height: size, channels: 4 } })
    .webp({ quality: 84, alphaQuality: 90, effort: 6 }).toFile(file);
  console.log(`wrote ${file} (${Math.round(res.size / 1024)} KB)`);
}
