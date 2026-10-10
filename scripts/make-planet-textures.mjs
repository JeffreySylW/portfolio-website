// Bakes one 2048x1024 equirectangular texture per body into public/textures/planets/.
// Usage: node scripts/make-planet-textures.mjs
// Column 0.5 of each texture (the +X axis of a three.js sphere) is the side that faces the camera.
// Fonts are never used (text would depend on the machine): code and silkscreen are drawn as strokes.
import sharp from "sharp";
import { mkdirSync, readFileSync } from "node:fs";

const W = 2048;
const H = 1024;
const OUT = "public/textures/planets";
mkdirSync(OUT, { recursive: true });
const WEBP = { quality: 90, effort: 6 };

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

async function saveRgb(name, rgb) {
  await sharp(rgb, { raw: { width: W, height: H, channels: 3 } }).webp(WEBP).toFile(`${OUT}/${name}.webp`);
  console.log(`wrote ${OUT}/${name}.webp`);
}
async function saveSvg(name, svg) {
  await sharp(Buffer.from(svg)).resize(W, H).webp(WEBP).toFile(`${OUT}/${name}.webp`);
  console.log(`wrote ${OUT}/${name}.webp`);
}

async function loadRaw(input, opts = {}) {
  const { data, info } = await sharp(input, opts).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height };
}
function sample({ data, w }, x, y) {
  const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0;
  const at = (xx, yy, c) => data[(yy * w + xx) * 4 + c];
  const out = [0, 0, 0, 0];
  for (let c = 0; c < 4; c++) {
    out[c] = at(x0, y0, c) * (1 - fx) * (1 - fy) + at(x0 + 1, y0, c) * fx * (1 - fy) + at(x0, y0 + 1, c) * (1 - fx) * fy + at(x0 + 1, y0 + 1, c) * fx * fy;
  }
  return out;
}

// Paints `img` onto the front of the sphere as an orthographic decal (undistorted when the sphere is seen head-on),
// over base(lon, lat). centerPx = the image pixel that lands on the sphere's centre; pxPerSphere = image pixels per
// sphere radius; key(r,g,b) -> 0..1 optionally makes parts of the image transparent.
function bakeSphere({ base, img, centerPx, pxPerSphere, key }) {
  const out = Buffer.alloc(W * H * 3);
  for (let py = 0; py < H; py++) {
    const lat = (0.5 - (py + 0.5) / H) * Math.PI;
    const cl = Math.cos(lat);
    const sl = Math.sin(lat);
    for (let px = 0; px < W; px++) {
      const lon = ((px + 0.5) / W - 0.5) * 2 * Math.PI;
      let [r, g, b] = base(lon, lat);
      if (img && cl * Math.cos(lon) > 0) {
        const ix = centerPx[0] + cl * Math.sin(lon) * pxPerSphere;
        const iy = centerPx[1] - sl * pxPerSphere;
        if (ix >= 0 && iy >= 0 && ix < img.w - 1 && iy < img.h - 1) {
          const [sr, sg, sb, sa] = sample(img, ix, iy);
          const a = (key ? key(sr, sg, sb) : 1) * (sa / 255);
          r += (sr - r) * a; g += (sg - g) * a; b += (sb - b) * a;
        }
      }
      const o = (py * W + px) * 3;
      out[o] = r; out[o + 1] = g; out[o + 2] = b;
    }
  }
  return out;
}

// ---- NASA: the whole planet is the insignia ------------------------------------------------------------------
function nasaBase() {
  const seam = (deg) => { const m = ((deg % 30) + 30) % 30; return Math.min(m, 30 - m); };
  return (lon, lat) => {
    let c = [11, 61, 145]; // #0b3d91, the insignia's blue
    if (hash2(Math.round(lon * 260), Math.round(lat * 260)) > 0.9985) c = [255, 255, 255]; // stars
    else if (seam((lon * 180) / Math.PI) < 0.35 || seam((lat * 180) / Math.PI) < 0.35) c = c.map((v) => v * 0.8); // panel seams
    return c;
  };
}
async function nasa() {
  const S = 10; // SVG user units -> pixels
  const img = await loadRaw(readFileSync("scripts/assets/nasa-logo.svg"), { density: 72 * S });
  if (img.w !== 110 * S) throw new Error(`NASA SVG rendered ${img.w}px wide, expected ${110 * S}`);
  const DISC = 0.85; // insignia disc radius as a fraction of the planet's radius (its disc centre is (50.049, 45), radius 40.14)
  await saveRgb("nasa", bakeSphere({ base: nasaBase(), img, centerPx: [50.049 * S, 45 * S], pxPerSphere: (40.14 * S) / DISC }));
}

// ---- VCU: all black with the official lockup ------------------------------------------------------------------
async function vcu() {
  const img = await loadRaw("scripts/assets/vcu-lockup.png");
  // the lockup sits on black; near-black pixels become the planet's own black so no rectangle shows
  const key = (r, g, b) => Math.min(1, Math.max(0, (Math.max(r, g, b) - 8) / 24));
  await saveRgb("education", bakeSphere({ base: () => [4, 4, 6], img, centerPx: [600, 316], pxPerSphere: 613, key }));
}

// ---- Bob: a circuit board in the case file's colours ----------------------------------------------------------
function pcbSvg() {
  const r = rng(7);
  const MASK = "#0a2415", TRACE = "#2c9a57", BRIGHT = "#6ee08a", GOLD = "#c9a24a";
  const parts = [`<rect width="${W}" height="${H}" fill="${MASK}"/>`];
  for (let x = 0; x < W; x += 64) parts.push(`<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="#0e2f1c" stroke-width="2"/>`);
  for (let y = 0; y < H; y += 64) parts.push(`<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#0e2f1c" stroke-width="2"/>`);
  for (let i = 0; i < 150; i++) { // manhattan traces ending in gold pads
    let x = Math.round(r() * (W / 32)) * 32, y = Math.round(r() * (H / 32)) * 32;
    const pts = [[x, y]];
    for (let s = 0; s < 4; s++) {
      const len = (1 + Math.floor(r() * 5)) * 32;
      if (s % 2 === 0) x += (r() < 0.5 ? -1 : 1) * len; else y += (r() < 0.5 ? -1 : 1) * len;
      pts.push([x, y]);
    }
    const bright = r() < 0.18;
    parts.push(`<polyline points="${pts.map((p) => p.join(",")).join(" ")}" fill="none" stroke="${bright ? BRIGHT : TRACE}" stroke-width="${bright ? 5 : 6}" stroke-linejoin="round"/>`);
    for (const [px, py] of [pts[0], pts[pts.length - 1]]) parts.push(`<circle cx="${px}" cy="${py}" r="9" fill="${GOLD}"/><circle cx="${px}" cy="${py}" r="3.5" fill="${MASK}"/>`);
  }
  for (let i = 0; i < 22; i++) { // chips with gold pins
    const w = (2 + Math.floor(r() * 3)) * 32, h = (1 + Math.floor(r() * 3)) * 32;
    const x = Math.round(r() * ((W - w) / 32)) * 32, y = Math.round(r() * ((H - h) / 32)) * 32;
    parts.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="#06120b" stroke="${TRACE}" stroke-width="3"/>`);
    for (let p = 8; p < w - 4; p += 14) parts.push(`<rect x="${x + p}" y="${y - 7}" width="6" height="7" fill="${GOLD}"/><rect x="${x + p}" y="${y + h}" width="6" height="7" fill="${GOLD}"/>`);
    parts.push(`<circle cx="${x + 9}" cy="${y + 9}" r="3" fill="${BRIGHT}"/>`);
  }
  // the case file's "bug fixed" check mark, dead centre where the camera looks
  parts.push(`<g transform="translate(${W / 2} ${H / 2})"><circle r="40" fill="#0a1810" stroke="${BRIGHT}" stroke-width="5"/><path d="M-16 0 L-5 13 L19 -12" stroke="${BRIGHT}" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${parts.join("")}</svg>`;
}

// ---- ASPIRE: LiDAR scan lines, a point cloud and detection boxes ----------------------------------------------
function lidarSvg() {
  const r = rng(11);
  const parts = [`<rect width="${W}" height="${H}" fill="#06190f"/>`];
  for (let y = 16; y < H; y += 32) parts.push(`<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#81c784" stroke-opacity="${(0.14 + 0.1 * Math.sin(y / 40)).toFixed(2)}" stroke-width="2"/>`);
  for (let i = 0; i < 9000; i++) {
    const y = 16 + 32 * Math.floor(r() * (H / 32));
    const x = r() * W;
    const near = Math.abs(x - W / 2) < 420 ? 1 : 0.5;
    parts.push(`<circle cx="${x.toFixed(1)}" cy="${(y + (r() - 0.5) * 10).toFixed(1)}" r="${(1.2 + r() * 1.6).toFixed(1)}" fill="${r() < 0.2 ? "#b9f6ca" : "#81c784"}" fill-opacity="${(0.3 + 0.6 * r() * near).toFixed(2)}"/>`);
  }
  const c = 28;
  for (const [x, y, w, h] of [[W / 2 - 200, H / 2 - 100, 110, 220], [W / 2 - 45, H / 2 - 70, 100, 190], [W / 2 + 100, H / 2 - 110, 110, 230]]) {
    parts.push(`<path d="M${x} ${y + c} V${y} H${x + c} M${x + w - c} ${y} H${x + w} V${y + c} M${x + w} ${y + h - c} V${y + h} H${x + w - c} M${x + c} ${y + h} H${x} V${y + h - c}" fill="none" stroke="#b9f6ca" stroke-width="5"/>`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${parts.join("")}</svg>`;
}

// ---- TA: a chalkboard covered in code strokes ----------------------------------------------------------------
function chalkSvg() {
  const r = rng(23);
  const parts = [`<rect width="${W}" height="${H}" fill="#22342c"/>`];
  for (let i = 0; i < 40; i++) parts.push(`<ellipse cx="${(r() * W).toFixed(0)}" cy="${(r() * H).toFixed(0)}" rx="${(80 + r() * 200).toFixed(0)}" ry="${(20 + r() * 50).toFixed(0)}" fill="#ffffff" fill-opacity="0.025"/>`);
  const indents = [0, 56, 56, 112, 112, 56, 0, 56, 0];
  let row = 0;
  for (let y = 110; y < H - 90; y += 52, row++) {
    let x = 20 + indents[row % indents.length];
    while (x < W - 40) {
      const len = 20 + r() * 70;
      const colour = r() < 0.15 ? "#e57373" : r() < 0.2 ? "#ffd180" : "#e8efe9";
      const op = Math.abs(x - W / 2) < 260 ? 0.9 : 0.4; // brightest where the camera looks
      parts.push(`<line x1="${x.toFixed(0)}" y1="${y}" x2="${(x + len).toFixed(0)}" y2="${y}" stroke="${colour}" stroke-opacity="${op}" stroke-width="7" stroke-linecap="round"/>`);
      x += len + 18;
      if (r() < 0.08) x += 120; // gaps between statements
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${parts.join("")}</svg>`;
}

await nasa();
await vcu();
await saveSvg("bob", pcbSvg());
await saveSvg("aspire", lidarSvg());
await saveSvg("ta", chalkSvg());
