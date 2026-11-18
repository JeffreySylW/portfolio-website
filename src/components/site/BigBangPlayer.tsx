"use client";

import { useEffect, useRef } from "react";
import { FAILSAFE_MS, INTRO_MS, inkRadius, introPhase, makeStars, BANG_COLORS } from "@/lib/bigBang";

const WHITE = "#f2f0ff";
const VOID = "#07061a";

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
    // full resolution, every display frame: this part is smooth, not pixel-stepped like the rest of the site
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);

    // the drop lands on the hero Earth's centre (kept on screen, with room to fall)
    const r = document.querySelector("[data-earth]")?.getBoundingClientRect();
    const ox = Math.min(w * 0.9, Math.max(w * 0.1, r ? r.left + r.width / 2 : w * 0.3));
    const oy = Math.min(h * 0.85, Math.max(h * 0.3, r ? r.top + r.height / 2 : h * 0.5));
    const reach = Math.hypot(Math.max(ox, w - ox), Math.max(oy, h - oy));
    const dropR = Math.min(22, Math.max(9, Math.min(w, h) * 0.022));
    const impactMs = INTRO_MS * 0.25;
    const stars = makeStars();
    const byColor = BANG_COLORS.map((c) => ({ c, list: stars.filter((s) => s.color === c) }));

    const frame = () => {
      const t = performance.now() - t0;
      if (t >= INTRO_MS) return finish();
      const p = introPhase(t);
      const secs = t / 1000;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;

      // the white ground, and the ink flooding out over it
      if (p.ink < 1) {
        ctx.fillStyle = WHITE;
        ctx.fillRect(0, 0, w, h);
      }
      if (p.ink > 0) {
        ctx.fillStyle = VOID;
        if (p.ink >= 1) ctx.fillRect(0, 0, w, h);
        else {
          const R = dropR + p.ink * reach * 1.1;
          const wobble = 1 - p.ink * 0.75;
          ctx.beginPath();
          for (let i = 0; i <= 120; i++) {
            const a = (i / 120) * Math.PI * 2;
            const rr = inkRadius(R, a, wobble, secs);
            if (i) ctx.lineTo(ox + Math.cos(a) * rr, oy + Math.sin(a) * rr);
            else ctx.moveTo(ox + Math.cos(a) * rr, oy + Math.sin(a) * rr);
          }
          ctx.fill();
        }
      }

      // the falling drop: round at rest, drawn out as it speeds up, a short squash as it lands
      if (t < impactMs + 90) {
        const y = -dropR * 3 + (oy + dropR * 3) * p.drop;
        const land = Math.max(0, (t - impactMs) / 90);
        const rx = dropR * (1 - 0.1 * p.drop) * (1 + 0.7 * land);
        const ry = dropR * (1 - 0.55 * land);
        const tail = dropR * (0.6 + 1.6 * p.drop) * (1 - land);
        const cy = y - ry;
        // a teardrop: round body, a tail that grows with speed
        ctx.fillStyle = VOID;
        ctx.beginPath();
        ctx.moveTo(ox, cy - ry - tail);
        ctx.bezierCurveTo(ox + rx * 0.35, cy - ry - tail * 0.45, ox + rx, cy - ry * 0.55, ox + rx, cy);
        ctx.arc(ox, cy, rx, 0, Math.PI, false);
        ctx.bezierCurveTo(ox - rx, cy - ry * 0.55, ox - rx * 0.35, cy - ry - tail * 0.45, ox, cy - ry - tail);
        ctx.fill();
      }

      // the flash on impact: a soft bloom and a thin ring racing out
      if (p.flash > 0.01) {
        const k = Math.min(1, (t - impactMs) / (INTRO_MS * 0.25));
        const bloom = reach * (0.04 + 0.16 * p.flash);
        const g = ctx.createRadialGradient(ox, oy, 0, ox, oy, bloom);
        g.addColorStop(0, `rgba(255,255,255,${p.flash})`);
        g.addColorStop(0.18, `rgba(242,240,255,${p.flash * 0.9})`);
        g.addColorStop(0.5, `rgba(169,164,255,${p.flash * 0.25})`);
        g.addColorStop(1, "rgba(91,84,214,0)");
        ctx.fillStyle = g;
        ctx.fillRect(ox - bloom, oy - bloom, bloom * 2, bloom * 2);
        ctx.globalAlpha = p.flash;
        ctx.strokeStyle = "#a9a4ff";
        ctx.lineWidth = 1.5 + 2 * p.flash;
        ctx.beginPath();
        ctx.arc(ox, oy, reach * 0.75 * (1 - (1 - k) ** 2), 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // the page opens from the centre with a soft edge
      if (p.open > 0) {
        const R = p.open * reach * 1.25 + 1;
        const feather = Math.min(0.9, (0.18 * R + 40) / R);
        const g = ctx.createRadialGradient(ox, oy, 0, ox, oy, R);
        g.addColorStop(0, "rgba(0,0,0,1)");
        g.addColorStop(1 - feather, "rgba(0,0,0,1)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.globalCompositeOperation = "destination-out";
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = "source-over";
      }

      // the stars, streaking outward and slowing, on top of everything until they fade
      if (p.starAlpha > 0.01) {
        const streak = (1 - p.stars) ** 2 * reach * 0.16;
        ctx.globalAlpha = p.starAlpha;
        ctx.lineCap = "round";
        for (const { c, list } of byColor) {
          ctx.strokeStyle = c;
          for (const s of list) {
            const d = p.stars * reach * s.dist;
            const d0 = Math.max(0, d - streak * s.dist - 0.5);
            const cx = Math.cos(s.angle), cy = Math.sin(s.angle);
            ctx.lineWidth = s.size;
            ctx.beginPath();
            ctx.moveTo(ox + cx * d0, oy + cy * d0);
            ctx.lineTo(ox + cx * d, oy + cy * d);
            ctx.stroke();
          }
        }
        ctx.globalAlpha = 1;
      }

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
