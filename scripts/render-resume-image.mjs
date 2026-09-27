import { pdfToPng } from "pdf-to-png-converter";
import { writeFile } from "node:fs/promises";
import path from "node:path";

const pdfPath = path.resolve("public/documents/Jeffrey-Weaver-Resume.pdf");
const outPath = path.resolve("public/documents/resume-preview.png");

const pages = await pdfToPng(pdfPath, {
  viewportScale: 3,
  useSystemFonts: true,
  pagesToProcess: [1],
});

await writeFile(outPath, pages[0].content);
console.log(`Wrote ${outPath} (${pages[0].width}x${pages[0].height})`);
