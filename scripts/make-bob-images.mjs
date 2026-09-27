// scripts/make-bob-images.mjs — crops and converts captures into the case-file images.
// Usage: node scripts/make-bob-images.mjs <captures-dir>
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const src = process.argv[2];
if (!src) throw new Error("usage: node scripts/make-bob-images.mjs <captures-dir>");
const out = "public/images/bob";
mkdirSync(out, { recursive: true });
const webp = { quality: 72, effort: 6 };

// Home before: keep the header (old logo, public toolbar) and the logo collage/tiles;
// drop the empty band where the archive did not keep the image slider.
async function homeBefore() {
  const f = join(src, "wb-home-20220118062933.png");
  const top = await sharp(f).extract({ left: 0, top: 0, width: 1440, height: 290 }).toBuffer();
  const band = await sharp({ create: { width: 1440, height: 36, channels: 3, background: "#0b1a10" } })
    .composite([{ input: Buffer.from('<svg width="1440" height="36"><text x="720" y="24" font-family="monospace" font-size="16" fill="#6ee08a" text-anchor="middle">··· image slider not preserved by the archive ···</text></svg>'), top: 0, left: 0 }])
    .png().toBuffer();
  const bottom = await sharp(f).extract({ left: 0, top: 880, width: 1440, height: 470 }).toBuffer();
  await sharp({ create: { width: 1440, height: 290 + 36 + 470, channels: 3, background: "#ffffff" } })
    .composite([{ input: top, top: 0, left: 0 }, { input: band, top: 290, left: 0 }, { input: bottom, top: 326, left: 0 }])
    .png().toBuffer()
    .then((b) => sharp(b).resize({ width: 1200 }).webp(webp).toFile(join(out, "home-before.webp")));
}

const crops = [
  ["cap-home-after.png", { left: 0, top: 0, width: 1440, height: 1000 }, "home-after.webp", 1200],
  ["wb-net.png", { left: 0, top: 0, width: 1414, height: 1300 }, "networking-before.webp", 1200],
  ["cap-net-after.png", { left: 0, top: 0, width: 1440, height: 1300 }, "networking-after.webp", 1200],
  ["cap-town-desktop.png", { left: 0, top: 0, width: 1440, height: 1300 }, "town-desktop.webp", 1200],
  ["cap-town-phone.png", { left: 0, top: 0, width: 500, height: 1500 }, "town-phone.webp", 500],
  ["cap-parental.png", { left: 0, top: 0, width: 1440, height: 1400 }, "services-parental.webp", 1200],
];

await homeBefore();
for (const [file, box, name, width] of crops) {
  await sharp(join(src, file)).extract(box).resize({ width }).webp(webp).toFile(join(out, name));
}
console.log("wrote", crops.length + 1, "images to", out);
