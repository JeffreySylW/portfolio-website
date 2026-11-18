"use client";

import { useEffect, useRef } from "react";
import { BANG_COLORS, FAILSAFE_MS, IMPACT_MS, INTRO_MS, JW_SCALE, introPhase, makeStars } from "@/lib/bigBang";

const WHITE = "#f2f0ff";
const VOID = "#07061a";
const VIOLET = "#5b54d6";
const LAVENDER = "#a9a4ff";

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
    // full resolution, every display frame: smooth, not pixel-stepped like the rest of the site
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);

    // everything happens in the middle of the screen
    const cx = w / 2;
    const cy = h / 2;
    const reach = Math.hypot(cx, cy);
    const dropR = Math.min(13, Math.max(6, Math.min(w, h) * 0.013));
    const stars = makeStars();
    const byColor = BANG_COLORS.map((c) => ({ c, list: stars.filter((s) => s.color === c) }));
    const display = getComputedStyle(document.querySelector("h1") ?? document.body).fontFamily;
    const jwSize = Math.min(w, h) * JW_SCALE * 1.35; // font size for that cap height

    const glitchSlices = (amount: number) => {
      // shift a few horizontal bands sideways and lay thin purple bars over them
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      for (let i = 0; i < 9; i++) {
        const y = Math.random() * canvas.height;
        const bh = (4 + Math.random() * 36) * dpr;
        const dx = (Math.random() - 0.5) * 70 * amount * dpr;
        ctx.drawImage(canvas, 0, y, canvas.width, bh, dx, y, canvas.width, bh);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      for (let i = 0; i < 5; i++) {
        ctx.globalAlpha = 0.55 * amount;
        ctx.fillStyle = i % 2 ? VIOLET : LAVENDER;
        ctx.fillRect(0, Math.random() * h, w, 1 + Math.random() * 3);
      }
      ctx.globalAlpha = 1;
    };

    const frame = () => {
      const t = performance.now() - t0;
      if (t >= INTRO_MS) return finish();
      const p = introPhase(t);
      const d = t - IMPACT_MS;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;

      if (d < 0) {
        // white ground, one black teardrop falling down the middle; its tail grows with speed
        ctx.fillStyle = WHITE;
        ctx.fillRect(0, 0, w, h);
        const y0 = dropR * 4; // starts just inside the top edge, so it is seen from the first frame
        const y = y0 + (cy - y0) * p.drop;
        const rx = dropR * (1 - 0.1 * p.drop);
        const ry = dropR;
        const tail = dropR * (0.6 + 1.8 * p.drop);
        const by = y - ry;
        ctx.fillStyle = VOID;
        ctx.beginPath();
        ctx.moveTo(cx, by - ry - tail);
        ctx.bezierCurveTo(cx + rx * 0.35, by - ry - tail * 0.45, cx + rx, by - ry * 0.55, cx + rx, by);
        ctx.arc(cx, by, rx, 0, Math.PI, false);
        ctx.bezierCurveTo(cx - rx, by - ry * 0.55, cx - rx * 0.35, by - ry - tail * 0.45, cx, by - ry - tail);
        ctx.fill();
      } else if (d < 260) {
        // impact frames: hard black and white, flipped on the inverted frames
        const fg = p.invert ? WHITE : VOID;
        const bg = p.invert ? VOID : WHITE;
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);
        // the drop's splash: one small dot
        ctx.fillStyle = fg;
        ctx.beginPath();
        ctx.arc(cx, cy, dropR * (1 + Math.min(d, 120) / 120), 0, Math.PI * 2);
        ctx.fill();

        // JW, flashing in the purple glitch
        if (p.jw > 0.01) {
          const off = 2 + 7 * p.glitch;
          ctx.font = `800 ${Math.round(jwSize)}px ${display}`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.globalAlpha = p.jw;
          ctx.fillStyle = VIOLET;
          ctx.fillText("JW", cx - off, cy + jwSize * 1.15 + off * 0.3);
          ctx.fillStyle = LAVENDER;
          ctx.fillText("JW", cx + off, cy + jwSize * 1.15 - off * 0.3);
          ctx.fillStyle = fg;
          ctx.fillText("JW", cx, cy + jwSize * 1.15);
          ctx.globalAlpha = 1;
        }
        if (p.glitch > 0) glitchSlices(p.glitch);
      } else {
        // after the hit: the dark of space, opening from the centre onto the site
        ctx.fillStyle = VOID;
        ctx.fillRect(0, 0, w, h);
        if (p.open > 0) {
          const R = p.open * reach * 1.25 + 1;
          const feather = Math.min(0.9, (0.16 * R + 30) / R);
          const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
          g.addColorStop(0, "rgba(0,0,0,1)");
          g.addColorStop(1 - feather, "rgba(0,0,0,1)");
          g.addColorStop(1, "rgba(0,0,0,0)");
          ctx.globalCompositeOperation = "destination-out";
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, w, h);
          ctx.globalCompositeOperation = "source-over";
          // a thin bright edge on the opening
          ctx.globalAlpha = 0.8 * (1 - p.open);
          ctx.strokeStyle = LAVENDER;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(cx, cy, R * (1 - feather * 0.5), 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }

      // the shockwave: a thin ring thrown out in a blink
      if (p.shock > 0 && p.shock < 1) {
        ctx.globalAlpha = 1 - p.shock;
        ctx.strokeStyle = LAVENDER;
        ctx.lineWidth = 1 + 3 * (1 - p.shock);
        ctx.beginPath();
        ctx.arc(cx, cy, p.shock * reach * 1.15, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // the stars, shot out violently, then slowing, on top of everything until they fade
      if (p.starAlpha > 0.01) {
        const streak = (1 - p.stars) ** 1.5 * reach * 0.4;
        ctx.globalAlpha = p.starAlpha;
        ctx.lineCap = "round";
        for (const { c, list } of byColor) {
          ctx.strokeStyle = c;
          for (const s of list) {
            const dd = p.stars * reach * s.dist;
            const d0 = Math.max(0, dd - streak * s.dist - 0.5);
            const ux = Math.cos(s.angle), uy = Math.sin(s.angle);
            ctx.lineWidth = s.size;
            ctx.beginPath();
            ctx.moveTo(cx + ux * d0, cy + uy * d0);
            ctx.lineTo(cx + ux * dd, cy + uy * dd);
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
