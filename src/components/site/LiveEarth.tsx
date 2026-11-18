"use client";

import { useEffect, useRef, useState } from "react";
import { EARTH_VIEW, blockFor } from "@/lib/earthView";
import { subsolarPoint } from "@/lib/sun";
import { sunReadout } from "@/lib/readout";

const REPAINT_MS = 10 * 60 * 1000;

/**
 * Repaints the hero Earth for the real sun, on top of the baked image (which stays as the fallback).
 * Needs Worker + OffscreenCanvas; without them the baked image is all anyone sees.
 */
export function LiveEarth() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = canvas.current;
    if (!el || typeof Worker === "undefined" || typeof OffscreenCanvas === "undefined") return;
    const worker = new Worker(new URL("../../lib/earth.worker.ts", import.meta.url), { type: "module" });
    let timer: ReturnType<typeof setTimeout> | undefined;

    const paint = () => {
      const css = el.getBoundingClientRect().width;
      if (!css) return;
      const size = Math.min(EARTH_VIEW.maxDevicePx, Math.round(css * (window.devicePixelRatio || 1)));
      worker.postMessage({
        textureUrl: "/textures/earth/day-2700.webp",
        size,
        pad: Math.round(size * EARTH_VIEW.padRatio),
        block: blockFor(size, css),
        lon0: EARTH_VIEW.lon0,
        lat0: EARTH_VIEW.lat0,
        sun: subsolarPoint(new Date()),
      });
    };
    worker.onmessage = (e: MessageEvent<{ bitmap?: ImageBitmap; error?: string }>) => {
      if (!e.data.bitmap) return; // keep the baked image
      el.width = e.data.bitmap.width;
      el.height = e.data.bitmap.height;
      el.getContext("bitmaprenderer")?.transferFromImageBitmap(e.data.bitmap);
      el.dataset.paintedAt = new Date().toISOString();
      setReady(true);
      timer = setTimeout(() => { if (document.visibilityState === "visible") paint(); }, REPAINT_MS);
    };
    // paint once the browser is idle so the baked image and text paint first
    const hasIdle = typeof window.requestIdleCallback === "function";
    const idle = hasIdle ? window.requestIdleCallback(paint, { timeout: 1500 }) : window.setTimeout(paint, 300);
    return () => {
      if (hasIdle) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
      clearTimeout(timer);
      worker.terminate();
    };
  }, []);

  return (
    <canvas
      ref={canvas}
      aria-hidden="true"
      data-live-earth={ready ? "ready" : "waiting"}
      className={`absolute inset-0 h-full w-full ${ready ? "opacity-100" : "opacity-0"}`}
    />
  );
}

/** "Sun overhead at … · Richmond: day/night". Before hydration it describes the baked image honestly. */
export function SunReadout() {
  const [r, setR] = useState<ReturnType<typeof sunReadout> | null>(null);
  useEffect(() => {
    const tick = () => setR(sunReadout(new Date()));
    tick();
    const t = setInterval(tick, 60_000);
    return () => clearInterval(t);
  }, []);
  return (
    <p className="px-label flex flex-wrap gap-x-5 gap-y-1 text-[12px] text-lavender" data-readout={r ? "live" : "static"}>
      {r ? (
        <>
          <span className="text-starlight">Live sunlight</span>
          <span>Sun overhead at {r.overhead}</span>
          <span>Richmond: {r.richmond === "day" ? "daytime" : "night"}</span>
        </>
      ) : (
        <span>Sunlight drawn for a November afternoon</span>
      )}
    </p>
  );
}
