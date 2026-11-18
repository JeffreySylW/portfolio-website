/// <reference lib="webworker" />
// Paints the live Earth off the main thread and hands back a bitmap.
import { paintGlobe } from "./terminatorPaint.ts";

export interface EarthJob {
  textureUrl: string;
  size: number;
  pad: number;
  block: number;
  lon0: number;
  lat0: number;
  sun: { lat: number; lon: number };
}

let texture: { width: number; height: number; data: Uint8ClampedArray } | null = null;

self.onmessage = async (e: MessageEvent<EarthJob>) => {
  try {
    const job = e.data;
    if (!texture) {
      const bmp = await createImageBitmap(await (await fetch(job.textureUrl)).blob());
      const c = new OffscreenCanvas(bmp.width, bmp.height);
      const ctx = c.getContext("2d")!;
      ctx.drawImage(bmp, 0, 0);
      texture = { width: bmp.width, height: bmp.height, data: ctx.getImageData(0, 0, bmp.width, bmp.height).data };
    }
    const rgba = paintGlobe({ ...job, texture });
    const bitmap = await createImageBitmap(new ImageData(rgba, job.size, job.size));
    (self as unknown as DedicatedWorkerGlobalScope).postMessage({ bitmap }, [bitmap]);
  } catch (err) {
    (self as unknown as DedicatedWorkerGlobalScope).postMessage({ error: String(err) });
  }
};
