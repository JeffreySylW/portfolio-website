/// <reference lib="webworker" />
// Paints the live Earth, or any planet, off the main thread and hands back a bitmap.
import { paintGlobe, textureStats, type Texture } from "./terminatorPaint.ts";

export interface EarthJob {
  /** Echoed back so one worker can paint several bodies. */
  id?: string;
  textureUrl: string;
  size: number;
  pad: number;
  block: number;
  lon0: number;
  lat0: number;
  sun: { lat: number; lon: number };
  /** Use the texture's own night ramp (every body but the Earth). */
  ownNight?: boolean;
}

const textures = new Map<string, Promise<Texture & { night: { mean: number; spread: number } }>>();

function load(url: string) {
  let t = textures.get(url);
  if (!t) {
    t = (async () => {
      const bmp = await createImageBitmap(await (await fetch(url)).blob());
      const c = new OffscreenCanvas(bmp.width, bmp.height);
      const ctx = c.getContext("2d")!;
      ctx.drawImage(bmp, 0, 0);
      const tex = { width: bmp.width, height: bmp.height, data: ctx.getImageData(0, 0, bmp.width, bmp.height).data };
      return { ...tex, night: textureStats(tex) };
    })();
    textures.set(url, t);
  }
  return t;
}

self.onmessage = async (e: MessageEvent<EarthJob>) => {
  const job = e.data;
  try {
    const texture = await load(job.textureUrl);
    const rgba = paintGlobe({ ...job, texture, night: job.ownNight ? texture.night : undefined });
    const bitmap = await createImageBitmap(new ImageData(rgba, job.size, job.size));
    (self as unknown as DedicatedWorkerGlobalScope).postMessage({ id: job.id, bitmap }, [bitmap]);
  } catch (err) {
    (self as unknown as DedicatedWorkerGlobalScope).postMessage({ id: job.id, error: String(err) });
  }
};
