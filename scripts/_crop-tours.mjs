import sharp from "sharp";
import path from "node:path";

const src = path.resolve("Images/Tours.jpg");
const outDir = path.join((await import("node:os")).tmpdir(), "tour-crops");
await (await import("node:fs/promises")).mkdir(outDir, { recursive: true });

const crops = {
  "14x22-subsonic": { left: 38, top: 56, width: 262, height: 234 },
  "transonic-dynamics": { left: 700, top: 56, width: 312, height: 234 },
  "national-transonic": { left: 38, top: 528, width: 262, height: 188 },
  "compressor-station": { left: 1250, top: 528, width: 282, height: 188 },
};

for (const [name, region] of Object.entries(crops)) {
  const outPath = path.join(outDir, `${name}.jpg`);
  await sharp(src).extract(region).toFile(outPath);
  console.log(`Wrote ${outPath}`);
}
