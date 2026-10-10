// Crops the Makerspace and Tours photos out of the internship presentation as WebP.
// Usage: node scripts/make-internship-images.mjs "C:/Users/there/Downloads/Summer 2025 Internship Experience.pdf"
// Boxes were measured on a 0.7-scale render of the slides (1007x566) and are scaled up to SCALE here.
import { pdfToPng } from "pdf-to-png-converter";
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const pdf = process.argv[2];
if (!pdf) throw new Error('usage: node scripts/make-internship-images.mjs "<deck.pdf>"');
const SCALE = 4;
const K = SCALE / 0.7;

// [slide, output (under public/images), [left, top, right, bottom] at 0.7 scale, output width, output height]
const CROPS = [
  [11, "makerspace/room", [24, 21, 359, 184], 1000, 500],
  [11, "makerspace/drone-lab", [24, 203, 359, 366], 1000, 500],
  [11, "makerspace/printers", [24, 381, 359, 549], 1000, 500],
  [11, "makerspace/slicer", [676, 20, 974, 237], 1000, 720],
  [11, "makerspace/first-print", [676, 284, 974, 527], 1000, 816],
  [12, "tours/wind-tunnel-14x22", [26, 59, 203, 179], 1000, 680],
  [12, "tours/the-gantry", [233, 59, 420, 179], 1000, 680],
  [12, "tours/transonic-dynamics-tunnel", [450, 59, 636, 179], 1000, 680],
  [12, "tours/unitary-plan-wind-tunnel", [655, 59, 841, 179], 1000, 680],
  [12, "tours/national-transonic-facility", [26, 342, 184, 450], 1000, 680],
  [12, "tours/scramjet", [214, 342, 381, 450], 1000, 680],
  [12, "tours/eight-foot-high-temp-tunnel", [410, 342, 577, 450], 1000, 680],
  [12, "tours/flight-simulator", [604, 342, 771, 450], 1000, 680],
  [12, "tours/compressor-station", [799, 342, 966, 450], 1000, 680],
];

mkdirSync("public/images/makerspace", { recursive: true });
const pages = await pdfToPng(pdf, { viewportScale: SCALE, useSystemFonts: true, pagesToProcess: [11, 12] });
for (const [slide, file, [l, t, r, b], w, h] of CROPS) {
  const page = pages.find((p) => p.pageNumber === slide);
  await sharp(page.content)
    .extract({ left: Math.round(l * K), top: Math.round(t * K), width: Math.round((r - l) * K), height: Math.round((b - t) * K) })
    .resize(w, h, { fit: "cover" })
    .webp({ quality: 82, effort: 6 })
    .toFile(`public/images/${file}.webp`);
  console.log(`wrote public/images/${file}.webp ${w}x${h}`);
}
