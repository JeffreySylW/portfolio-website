// Bakes the system-map planets. Usage: NODE_OPTIONS=--experimental-strip-types node scripts/make-planets.mjs
// 1. Made worlds (VCU, TA, ASPIRE, Bob) are drawn as 4096x2048 equirectangular masters in
//    scripts/assets/planets/<id>-4096.webp (front decals face the Earth's view latitude).
// 2. Every planet gets public/textures/planets/<id>-tex.webp (1024x512, for the live repaint in the browser)
//    and <id>.webp (painted by terminatorPaint.ts for the default sun, at twice its desktop size).
// Outside textures: the Moon and Neptune from Solar System Scope (CC BY 4.0), see public/textures/CREDITS.md.
import sharp from "sharp";
import { mkdirSync, existsSync } from "node:fs";
import { paintGlobe, textureStats } from "../src/lib/terminatorPaint.ts";
import { EARTH_VIEW } from "../src/lib/earthView.ts";
import { PLANETS } from "../src/content/planets.ts";
import { planetSun, planetBlockCss } from "../src/lib/systemMap.ts";

const W = 4096, H = 2048;
const SRC = "scripts/assets/planets";
const OUT = "public/textures/planets";
mkdirSync(OUT, { recursive: true });
const D2R = Math.PI / 180;
const VIEW_LAT = EARTH_VIEW.lat0 * D2R;

function rng(seed) { // mulberry32
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const hash2 = (a, b) => {
  let h = (a * 374761393 + b * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
const svg = (parts) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${parts.join("")}</svg>`);

async function raw(input, opts = {}) {
  const { data, info } = await sharp(input, opts).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height };
}
function bilinear({ data, w }, x, y) {
  const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0;
  const at = (xx, yy, c) => data[(yy * w + xx) * 4 + c];
  const out = [0, 0, 0, 0];
  for (let c = 0; c < 4; c++) out[c] = at(x0, y0, c) * (1 - fx) * (1 - fy) + at(x0 + 1, y0, c) * fx * (1 - fy) + at(x0, y0 + 1, c) * (1 - fx) * fy + at(x0 + 1, y0 + 1, c) * fx * fy;
  return out;
}

/** Fine material grain, multiplied in so flat colours read as a surface up close. */
function grain(img, amount, seed) {
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) {
    const n = 1 + (hash2(x + seed, y * 7 + seed) - 0.5) * amount;
    const i = (y * img.w + x) * 4;
    for (let c = 0; c < 3; c++) img.data[i + c] = Math.max(0, Math.min(255, img.data[i + c] * n));
  }
  return img;
}

/**
 * Paints `decal` onto the face the viewer sees (longitude 0, the Earth's view latitude) as an orthographic
 * projection, so it reads undistorted on the planet. centerPx: decal pixel at the face centre;
 * pxPerRadius: decal pixels per planet radius; key -> 0..1 makes parts of the decal transparent.
 */
function decalOnto(base, decal, { centerPx, pxPerRadius, key }) {
  const sv = Math.sin(VIEW_LAT), cv = Math.cos(VIEW_LAT);
  for (let py = 0; py < base.h; py++) {
    const lat = (0.5 - (py + 0.5) / base.h) * Math.PI, sl = Math.sin(lat), cl = Math.cos(lat);
    for (let px = 0; px < base.w; px++) {
      const lon = ((px + 0.5) / base.w - 0.5) * 2 * Math.PI;
      if (sv * sl + cv * cl * Math.cos(lon) <= 0) continue; // far side
      const ix = centerPx[0] + cl * Math.sin(lon) * pxPerRadius;
      const iy = centerPx[1] - (cv * sl - sv * cl * Math.cos(lon)) * pxPerRadius;
      if (ix < 0 || iy < 0 || ix >= decal.w - 1 || iy >= decal.h - 1) continue;
      const [r, g, b, a0] = bilinear(decal, ix, iy);
      const a = (key ? key(r, g, b) : 1) * (a0 / 255);
      const i = (py * base.w + px) * 4;
      base.data[i] += (r - base.data[i]) * a;
      base.data[i + 1] += (g - base.data[i + 1]) * a;
      base.data[i + 2] += (b - base.data[i + 2]) * a;
    }
  }
  return base;
}

// ---- VCU: black and gold, with the seal and wordmark lockup (supplied by Jeff, used unaltered) ----------------
async function vcu() {
  const r = rng(3);
  const parts = [`<rect width="${W}" height="${H}" fill="#050507"/>`];
  // faint gold latitude bands, like a gas giant drawn in VCU's colours
  for (let y = 40; y < H; y += 26 + Math.floor(r() * 60)) {
    const h = 2 + Math.floor(r() * 9);
    parts.push(`<rect x="0" y="${y}" width="${W}" height="${h}" fill="#f8b300" fill-opacity="${(0.025 + r() * 0.05).toFixed(3)}"/>`);
  }
  const base = grain(await raw(svg(parts)), 0.18, 3);
  const lockup = await raw(`${SRC}/vcu-lockup.png`);
  const key = (rr, g, b) => Math.min(1, Math.max(0, (Math.max(rr, g, b) - 8) / 24)); // drop the lockup's black ground
  return decalOnto(base, lockup, { centerPx: [600, 316], pxPerRadius: 613, key });
}

// ---- Bob: a circuit board in the case file's colours ----------------------------------------------------------
function pcbParts() {
  const r = rng(7);
  const MASK = "#0a2415", TRACE = "#2c9a57", BRIGHT = "#6ee08a", GOLD = "#c9a24a", SILK = "#cfe8d6";
  const G = 64; // routing grid
  const p = [`<rect width="${W}" height="${H}" fill="${MASK}"/>`];
  for (let x = 0; x < W; x += G * 2) p.push(`<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="#0e2f1c" stroke-width="3"/>`);
  for (let y = 0; y < H; y += G * 2) p.push(`<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#0e2f1c" stroke-width="3"/>`);
  // copper pours under everything
  for (let i = 0; i < 26; i++) {
    const w = (3 + Math.floor(r() * 8)) * G, h = (2 + Math.floor(r() * 5)) * G;
    p.push(`<rect x="${Math.floor(r() * (W / G)) * G}" y="${Math.floor(r() * (H / G)) * G}" width="${w}" height="${h}" fill="#0d2c19"/>`);
  }
  const trace = (n, width, colourOf, step) => {
    for (let i = 0; i < n; i++) {
      let x = Math.round(r() * (W / step)) * step, y = Math.round(r() * (H / step)) * step;
      const pts = [[x, y]];
      for (let s = 0; s < 5; s++) {
        const len = (1 + Math.floor(r() * 6)) * step;
        if (s % 2 === 0) x += (r() < 0.5 ? -1 : 1) * len; else y += (r() < 0.5 ? -1 : 1) * len;
        pts.push([x, y]);
        if (r() < 0.3) { const d = (r() < 0.5 ? -1 : 1) * (step / 2); x += d; y += d; pts.push([x, y]); } // short 45° jog
      }
      const c = colourOf();
      p.push(`<polyline points="${pts.map((q) => q.join(",")).join(" ")}" fill="none" stroke="${c}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="round"/>`);
      for (const [px, py] of [pts[0], pts[pts.length - 1]]) p.push(`<circle cx="${px}" cy="${py}" r="${width * 1.6}" fill="${GOLD}"/><circle cx="${px}" cy="${py}" r="${width * 0.6}" fill="${MASK}"/>`);
    }
  };
  trace(420, 4, () => "#1f6e3e", 32); // fine signal traces
  trace(220, 10, () => (r() < 0.16 ? BRIGHT : TRACE), 64); // main traces
  for (let i = 0; i < 900; i++) { // vias
    const x = Math.round(r() * (W / 32)) * 32, y = Math.round(r() * (H / 32)) * 32;
    p.push(`<circle cx="${x}" cy="${y}" r="7" fill="${GOLD}" fill-opacity="0.85"/><circle cx="${x}" cy="${y}" r="3" fill="#06120b"/>`);
  }
  for (let i = 0; i < 46; i++) { // chips with gold pins and silkscreen outlines
    const w = (2 + Math.floor(r() * 4)) * G, h = (1 + Math.floor(r() * 3)) * G;
    const x = Math.round(r() * ((W - w) / G)) * G, y = Math.round(r() * ((H - h) / G)) * G;
    p.push(`<rect x="${x - 10}" y="${y - 22}" width="${w + 20}" height="${h + 44}" fill="none" stroke="${SILK}" stroke-opacity="0.5" stroke-width="3" stroke-dasharray="14 8"/>`);
    p.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="#06120b" stroke="${TRACE}" stroke-width="4"/>`);
    for (let q = 12; q < w - 8; q += 22) p.push(`<rect x="${x + q}" y="${y - 12}" width="10" height="12" fill="${GOLD}"/><rect x="${x + q}" y="${y + h}" width="10" height="12" fill="${GOLD}"/>`);
    p.push(`<circle cx="${x + 14}" cy="${y + 14}" r="5" fill="${BRIGHT}"/>`);
    for (let q = 0; q < 3; q++) p.push(`<rect x="${x + 30 + q * 26}" y="${y + h / 2 - 3}" width="18" height="6" fill="${SILK}" fill-opacity="0.35"/>`);
  }
  return p;
}
async function bob() {
  const base = grain(await raw(svg(pcbParts())), 0.16, 7);
  // the case file's "bug fixed" check mark on the face
  const S = 400;
  const mark = await raw(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="-100 -100 200 200"><circle r="70" fill="#0a1810" stroke="#6ee08a" stroke-width="9"/><path d="M-30 0 L-9 24 L34 -22" stroke="#6ee08a" stroke-width="13" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`));
  return decalOnto(base, mark, { centerPx: [S / 2, S / 2], pxPerRadius: S * 1.9 });
}

// ---- ASPIRE: LiDAR scan lines, a point cloud and pedestrian detection boxes -----------------------------------
async function aspire() {
  const r = rng(11);
  const p = [`<rect width="${W}" height="${H}" fill="#06190f"/>`];
  for (let y = 12; y < H; y += 24) p.push(`<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#81c784" stroke-opacity="${(0.12 + 0.1 * Math.sin(y / 60)).toFixed(2)}" stroke-width="2"/>`);
  for (let i = 0; i < 42000; i++) {
    const y = 12 + 24 * Math.floor(r() * (H / 24));
    const x = r() * W;
    const near = Math.abs(x - W / 2) < 900 ? 1 : 0.55;
    p.push(`<circle cx="${x.toFixed(1)}" cy="${(y + (r() - 0.5) * 12).toFixed(1)}" r="${(1.2 + r() * 2.2).toFixed(1)}" fill="${r() < 0.2 ? "#b9f6ca" : r() < 0.08 ? "#ffd180" : "#81c784"}" fill-opacity="${(0.3 + 0.6 * r() * near).toFixed(2)}"/>`);
  }
  return grain(await raw(svg(p)), 0.1, 11);
}
async function aspireBoxes(base) {
  const S = 600, c = 40;
  const boxes = [[120, 170, 110, 260], [270, 200, 100, 230], [410, 150, 115, 280]];
  const parts = boxes.map(([x, y, w, h]) => `<path d="M${x} ${y + c} V${y} H${x + c} M${x + w - c} ${y} H${x + w} V${y + c} M${x + w} ${y + h - c} V${y + h} H${x + w - c} M${x + c} ${y + h} H${x} V${y + h - c}" fill="none" stroke="#b9f6ca" stroke-width="8"/>`);
  const mark = await raw(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}">${parts.join("")}</svg>`));
  return decalOnto(base, mark, { centerPx: [S / 2, S / 2], pxPerRadius: S * 0.62 });
}

// ---- TA: a chalkboard written over with code ------------------------------------------------------------------
async function ta() {
  const r = rng(23);
  const p = [`<rect width="${W}" height="${H}" fill="#22342c"/>`];
  for (let i = 0; i < 90; i++) p.push(`<ellipse cx="${(r() * W).toFixed(0)}" cy="${(r() * H).toFixed(0)}" rx="${(160 + r() * 400).toFixed(0)}" ry="${(40 + r() * 100).toFixed(0)}" fill="#ffffff" fill-opacity="0.022"/>`);
  const indents = [0, 70, 70, 140, 140, 70, 0, 70, 0];
  let row = 0;
  for (let y = 150; y < H - 120; y += 64, row++) {
    let x = 30 + indents[row % indents.length];
    while (x < W - 50) {
      const len = 26 + r() * 90;
      const colour = r() < 0.14 ? "#e57373" : r() < 0.18 ? "#ffd180" : "#e8efe9";
      const op = (Math.abs(x - W / 2) < 700 ? 0.85 : 0.45) * (0.75 + r() * 0.25);
      // chalk: a main stroke and a broken, slightly offset second pass
      p.push(`<line x1="${x.toFixed(0)}" y1="${y}" x2="${(x + len).toFixed(0)}" y2="${y}" stroke="${colour}" stroke-opacity="${op.toFixed(2)}" stroke-width="9" stroke-linecap="round"/>`);
      p.push(`<line x1="${(x + 3).toFixed(0)}" y1="${y + 3}" x2="${(x + len - 4).toFixed(0)}" y2="${y + 2}" stroke="${colour}" stroke-opacity="${(op * 0.5).toFixed(2)}" stroke-width="4" stroke-dasharray="${(4 + r() * 10).toFixed(0)} ${(3 + r() * 6).toFixed(0)}"/>`);
      x += len + 22;
      if (r() < 0.08) x += 150;
    }
  }
  return grain(await raw(svg(p)), 0.22, 23);
}

async function saveMaster(id, img) {
  const f = `${SRC}/${id}-4096.webp`;
  await sharp(img.data, { raw: { width: img.w, height: img.h, channels: 4 } }).removeAlpha().webp({ quality: 86, effort: 5 }).toFile(f);
  console.log(`wrote ${f}`);
  return f;
}

const masters = {};
if (!process.argv.includes("--skip-masters") || !existsSync(`${SRC}/bob-4096.webp`)) {
  masters.vcu = await saveMaster("vcu", await vcu());
  masters.ta = await saveMaster("ta", await ta());
  masters.aspire = await saveMaster("aspire", await aspireBoxes(await aspire()));
  masters.bob = await saveMaster("bob", await bob());
} else for (const id of ["vcu", "ta", "aspire", "bob"]) masters[id] = `${SRC}/${id}-4096.webp`;
masters.nasa = `${SRC}/moon-4096.jpg`;
masters["sports-analytics"] = `${SRC}/neptune-2048.jpg`;

for (const p of PLANETS) {
  const src = masters[p.id];
  // texture for the browser's live repaint
  await sharp(src).resize(1024, 512, { kernel: "lanczos3" }).webp({ quality: 82, effort: 6 }).toFile(`${OUT}/${p.id}-tex.webp`);
  // default image: painted at twice the desktop size for the build-time default sun
  const { data, info } = await sharp(src).resize(2048, 1024, { kernel: "lanczos3" }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const texture = { width: info.width, height: info.height, data };
  const size = p.size * 2;
  const rgba = paintGlobe({
    texture, size,
    pad: Math.round(size * EARTH_VIEW.padRatio),
    lon0: p.face, lat0: EARTH_VIEW.lat0,
    sun: planetSun(EARTH_VIEW.defaultSun, p.face),
    block: Math.max(2, Math.round(planetBlockCss(p.size) * 2)),
    night: textureStats(texture),
  });
  const res = await sharp(Buffer.from(rgba.buffer), { raw: { width: size, height: size, channels: 4 } })
    .webp({ quality: 86, alphaQuality: 90, effort: 6 }).toFile(`${OUT}/${p.id}.webp`);
  console.log(`wrote ${OUT}/${p.id}.webp (${Math.round(res.size / 1024)} KB), ${p.id}-tex.webp`);
}
