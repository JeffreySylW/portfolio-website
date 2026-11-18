"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { PLANETS, planetSpans, type Planet } from "@/content/planets";
import { EARTH_VIEW } from "@/lib/earthView";
import { planetBlockCss, planetSun, shimmerStep, spinLongitude, systemLayout } from "@/lib/systemMap";
import { subsolarPoint } from "@/lib/sun";
import { playWhoosh } from "@/lib/whoosh";

const REPAINT_MS = 10 * 60 * 1000;
const SOUND_KEY = "jw-sound";
const SPANS = planetSpans();
const BY_ID = Object.fromEntries(PLANETS.map((p) => [p.id, p])) as Record<string, Planet>;

type Vars = CSSProperties & Record<`--${string}`, string | number>;

// ---- small external stores (read by useSyncExternalStore, so the server render and hydration agree) ----------
const soundListeners = new Set<() => void>();
const soundStore = {
  get(): boolean {
    try {
      return localStorage.getItem(SOUND_KEY) !== "off";
    } catch {
      return true;
    }
  },
  set(on: boolean) {
    try {
      localStorage.setItem(SOUND_KEY, on ? "on" : "off");
    } catch {}
    soundListeners.forEach((l) => l());
  },
  subscribe(l: () => void) {
    soundListeners.add(l);
    return () => soundListeners.delete(l);
  },
};
/** The page is built ahead of time: the build's month first, then the visitor's. */
const BUILT_MONTH = Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 15);
const thisMonth = () => Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 15);
const noSubscribe = () => () => {};

function useWhoosh() {
  const ctx = useRef<AudioContext | null>(null);
  const last = useRef(0);
  const on = useSyncExternalStore(soundStore.subscribe, soundStore.get, () => true);
  const [count, setCount] = useState(0);

  useEffect(() => {
    // browsers only allow sound after the visitor clicks, taps or types somewhere
    const unlock = () => {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      if (!ctx.current) ctx.current = new AC();
      if (ctx.current.state === "suspended") void ctx.current.resume();
    };
    window.addEventListener("pointerdown", unlock, { passive: true });
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      void ctx.current?.close();
      ctx.current = null;
    };
  }, []);

  const toggle = () => soundStore.set(!on);

  const play = (pan: number) => {
    const c = ctx.current;
    const now = performance.now();
    if (!on || !c || c.state !== "running" || now - last.current < 140) return;
    last.current = now;
    playWhoosh(c, pan);
    setCount((n) => n + 1);
  };

  return { on, toggle, play, count };
}

const FRAME_MS = 125; // about 8 frames a second: smooth enough for a slow turn, stepped like the pixel art
const SUN_MS = 60 * 1000;

/**
 * Paints every planet for the real sun once the map comes near the screen, then keeps them turning
 * (and the night dither shimmering) while the map is on screen and the tab is visible. Under reduced
 * motion each planet is painted once, still, and refreshed for the sun every 10 minutes.
 */
function useLivePlanets(section: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = section.current;
    if (!el || typeof Worker === "undefined" || typeof OffscreenCanvas === "undefined" || typeof IntersectionObserver === "undefined") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let worker: Worker | null = null;
    let visible = false;
    let sun = subsolarPoint(new Date());
    let sunAt = performance.now();
    let lastStill = 0;
    const t0 = performance.now();
    const busy = new Set<string>();

    const post = (c: HTMLCanvasElement, t: number) => {
      const p = BY_ID[c.dataset.id!];
      const css = c.getBoundingClientRect().width;
      if (!worker || !p || !css || busy.has(p.id)) return;
      const size = Math.min(p.size * 3, Math.round(css * (window.devicePixelRatio || 1)));
      const lon0 = spinLongitude(p.face, p.spin, t);
      busy.add(p.id);
      worker.postMessage({
        id: p.id,
        textureUrl: `/textures/planets/${p.id}-tex.webp`,
        size,
        pad: Math.round(size * EARTH_VIEW.padRatio),
        block: Math.max(2, Math.round((planetBlockCss(p.size) * size) / css)),
        lon0,
        lat0: EARTH_VIEW.lat0,
        sun: planetSun(sun, lon0),
        ownNight: true,
        ditherShift: shimmerStep(t),
      });
    };

    const tick = () => {
      if (!worker || !visible || document.visibilityState !== "visible") return;
      const now = performance.now();
      if (now - sunAt > SUN_MS) { sun = subsolarPoint(new Date()); sunAt = now; }
      const still = reduce.matches;
      if (still && lastStill && now - lastStill < REPAINT_MS) return;
      if (still) lastStill = now;
      const t = still ? 0 : (now - t0) / 1000;
      for (const c of el.querySelectorAll<HTMLCanvasElement>("canvas[data-live]")) post(c, t);
    };

    const start = () => {
      worker = new Worker(new URL("../../lib/earth.worker.ts", import.meta.url), { type: "module" });
      worker.onmessage = (e: MessageEvent<{ id?: string; bitmap?: ImageBitmap }>) => {
        if (e.data.id) busy.delete(e.data.id);
        const c = e.data.id && el.querySelector<HTMLCanvasElement>(`canvas[data-id="${e.data.id}"]`);
        if (!c || !e.data.bitmap) return; // keep the baked image
        if (c.width !== e.data.bitmap.width) { c.width = e.data.bitmap.width; c.height = e.data.bitmap.height; }
        c.getContext("bitmaprenderer")?.transferFromImageBitmap(e.data.bitmap);
        c.dataset.live = "ready";
        c.dataset.frames = String(Number(c.dataset.frames || 0) + 1);
      };
    };

    const io = new IntersectionObserver((entries) => {
      visible = entries.some((e) => e.isIntersecting);
      if (visible && !worker) start();
      if (visible) tick();
    }, { rootMargin: "200px 0px" });
    io.observe(el);
    const timer = setInterval(tick, FRAME_MS);
    const onMotion = () => { lastStill = 0; tick(); };
    reduce.addEventListener("change", onMotion);
    return () => {
      io.disconnect();
      clearInterval(timer);
      reduce.removeEventListener("change", onMotion);
      worker?.terminate();
    };
  }, [section]);
}

export function SystemMap() {
  const section = useRef<HTMLElement>(null);
  const month = useSyncExternalStore(noSubscribe, thisMonth, () => BUILT_MONTH);
  const layout = systemLayout(SPANS, new Date(month));
  const sound = useWhoosh();
  useLivePlanets(section);

  return (
    <section
      ref={section}
      id="system"
      data-whooshes={sound.count}
      aria-labelledby="system-title"
      className="sys relative isolate mx-auto max-w-[1312px] overflow-x-clip px-5 pb-16 pt-20 md:px-16"
    >
      <div aria-hidden="true" className="stars absolute inset-0 -z-10 opacity-70" />
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <h2 id="system-title" className="font-display text-[48px] font-extrabold uppercase leading-none md:text-[64px]">
            The system
          </h2>
          <p className="px-label mt-3 text-[12px] text-lavender">
            <span className="text-on-sky">Each world sits where it started · its trail runs to where it ended</span>
          </p>
        </div>
        <button type="button" aria-pressed={sound.on} onClick={sound.toggle} className="px-label min-h-[44px] px-1 text-[12px] text-starlight hover:text-lavender">
          <span className="text-on-sky">Sound: {sound.on ? "on" : "off"}</span>
        </button>
      </div>

      <ol className="sys-track mt-10" aria-label="Experience by date, oldest first">
        {layout.bodies.map((b) => {
          const p = BY_ID[b.id];
          const span = SPANS[p.id];
          const ongoing = !span.end;
          const vars: Vars = { "--s": p.size, "--x0": b.x0, "--x1": b.x1, "--ghost": `url(/textures/planets/${p.id}.webp)` };
          return (
            <li key={p.id} className="sys-lane" style={vars}>
              <p className="sys-mlabel px-label text-[12px] leading-[1.5] md:hidden">
                {p.label} <span className="text-lavender">· {span.dates}</span>
              </p>
              <div className="sys-line">
                <div aria-hidden="true" className={`sys-trail ${ongoing ? "bg-violet" : "bg-indigo"}`} />
                <a
                  href={`#work-${p.workId}`}
                  data-planet={p.id}
                  aria-label={`${p.label}, ${span.dates}`}
                  className="sys-planet phase"
                  onPointerEnter={() => sound.play(b.x0 * 1.6 - 0.8)}
                  onFocus={() => sound.play(b.x0 * 1.6 - 0.8)}
                >
                  <span className="phase-wrap">
                    <span data-phase className="phase-body">
                      {/* eslint-disable-next-line @next/next/no-img-element -- exact pixels: the night side must not be resampled */}
                      <img src={`/textures/planets/${p.id}.webp`} alt="" width={p.size * 2} height={p.size * 2} loading="lazy" decoding="async" />
                      <canvas data-live="waiting" data-id={p.id} aria-hidden="true" />
                    </span>
                  </span>
                  <span aria-hidden="true" className={`sys-label px-label ${b.labelSide === "left" ? "sys-label-left" : ""}`}>
                    <span className="text-on-sky text-starlight">{p.label}</span>
                    <br />
                    <span className="text-on-sky text-lavender">{span.dates}</span>
                  </span>
                </a>
              </div>
            </li>
          );
        })}
      </ol>
      <div aria-hidden="true" className="sys-axis">
        {layout.ticks.map((t) => (
          <span
            key={t.label}
            data-tick
            className={`px-label text-[12px] text-lavender ${t.label !== "Now" && t.x > 0.78 ? "max-md:hidden" : ""}`}
            style={{ "--x": t.x } as Vars}
          >
            {t.label}
          </span>
        ))}
      </div>
    </section>
  );
}
