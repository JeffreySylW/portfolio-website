"use client";

import { useEffect, useRef } from "react";
import { FAILSAFE_MS, INTRO_MS, bayer, introPhase, makeCloud } from "@/lib/bigBang";

/** Canvas pixels per screen pixel: a quarter-resolution canvas, scaled up, keeps the glow soft and cheap. */
const SCALE = 4;

function glowSprite(color: string): HTMLCanvasElement {
  const s = document.createElement("canvas");
  s.width = s.height = 64;
  const g = s.getContext("2d")!;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, color);
  grad.addColorStop(0.35, color + "99");
  grad.addColorStop(1, color + "00");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return s;
}

export function BigBangPlayer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const veil = canvas?.parentElement;
    if (!canvas || !veil || veil.dataset.play !== "1") return;

    const t0 = Number(veil.dataset.t0) || performance.now();
    let raf = 0;
    const events = ["pointerdown", "keydown", "wheel", "touchstart"] as const;
    const finish = () => {
      cancelAnimationFrame(raf);
      for (const e of events) window.removeEventListener(e, finish, true);
      veil.removeAttribute("data-play");
      veil.dataset.bang = "done";
      canvas.width = canvas.height = 0;
    };
    // hydrated too late to be worth starting (slow phone, background tab): just get out of the way
    if (performance.now() - t0 > FAILSAFE_MS - 600) return finish();
    for (const e of events) window.addEventListener(e, finish, { capture: true, passive: true });

    const ctx = canvas.getContext("2d");
    if (!ctx) return finish();
    const cw = Math.ceil(window.innerWidth / SCALE);
    const ch = Math.ceil(window.innerHeight / SCALE);
    canvas.width = cw;
    canvas.height = ch;

    // the burst starts at the hero Earth's centre (kept on screen)
    const r = document.querySelector("[data-earth]")?.getBoundingClientRect();
    const ox = Math.min(cw, Math.max(0, r ? (r.left + r.width / 2) / SCALE : cw * 0.3));
    const oy = Math.min(ch, Math.max(0, r ? (r.top + r.height / 2) / SCALE : ch * 0.5));
    const reach = Math.hypot(Math.max(ox, cw - ox), Math.max(oy, ch - oy));

    const { puffs, galaxies } = makeCloud();
    const sprites = new Map<string, HTMLCanvasElement>();
    const sprite = (c: string) => sprites.get(c) ?? sprites.set(c, glowSprite(c)).get(c)!;

    // the veil: void-coloured pixels, each with a Bayer threshold in 8x8 screen-pixel cells
    const veilImg = ctx.createImageData(cw, ch);
    const thresholds = new Float32Array(cw * ch);
    for (let y = 0; y < ch; y++)
      for (let x = 0; x < cw; x++) {
        const i = y * cw + x;
        thresholds[i] = bayer(x >> 1, y >> 1);
        veilImg.data[i * 4] = 7;
        veilImg.data[i * 4 + 1] = 6;
        veilImg.data[i * 4 + 2] = 26;
      }
    let lastVeil = -1;

    const frame = () => {
      const t = performance.now() - t0;
      if (t >= INTRO_MS) return finish();
      const p = introPhase(t);

      if (p.veil !== lastVeil) {
        const d = veilImg.data;
        for (let i = 0; i < thresholds.length; i++) d[i * 4 + 3] = thresholds[i] < p.veil ? 255 : 0;
        lastVeil = p.veil;
      }
      ctx.putImageData(veilImg, 0, 0);
      ctx.globalCompositeOperation = "lighter";

      // glowing gas, rushing out from the point
      for (const q of puffs) {
        const a = p.gas * q.alpha;
        if (a <= 0.01) continue;
        const d = p.radius * reach * q.dist;
        const s = reach * q.size * (0.35 + 0.65 * p.radius);
        ctx.globalAlpha = a;
        ctx.drawImage(sprite(q.color), ox + Math.cos(q.angle) * d - s, oy + Math.sin(q.angle) * d - s, s * 2, s * 2);
      }
      // galaxies condensing inside it: a hard bright pixel in a small halo
      for (const g of galaxies) {
        const a = p.galaxies * g.alpha * Math.min(1, Math.max(0, (p.radius - g.delay) * 4));
        if (a <= 0.01) continue;
        const d = p.radius * reach * g.dist;
        const x = ox + Math.cos(g.angle) * d, y = oy + Math.sin(g.angle) * d;
        const s = Math.max(1.5, reach * g.size * 2);
        ctx.globalAlpha = a * 0.7;
        ctx.drawImage(sprite(g.color), x - s, y - s, s * 2, s * 2);
        ctx.globalAlpha = a;
        ctx.fillStyle = g.color;
        ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
      }
      // the white-hot point and its flash
      if (p.flash > 0.01) {
        const s = reach * (0.02 + 0.6 * p.flash);
        ctx.globalAlpha = Math.min(1, p.flash * 1.4);
        ctx.drawImage(sprite("#f2f0ff"), ox - s, oy - s, s * 2, s * 2);
        ctx.drawImage(sprite("#f2f0ff"), ox - s / 3, oy - s / 3, (s * 2) / 3, (s * 2) / 3);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      raf = requestAnimationFrame(frame);
    };

    veil.style.background = "transparent";
    frame();
    return finish;
  }, []);

  return (
    <>
      <canvas ref={canvasRef} className="bang-canvas" />
      <button type="button" tabIndex={-1} className="bang-skip px-label">
        Skip intro
      </button>
    </>
  );
}
