"use client";

import { useEffect, useRef } from "react";
import {
  BURST_MS, FAILSAFE_MS, IMPACT1_MS, INTRO_MS, JW_SCALE, LAND_MS, POINT_MS, introPhase, outQuint, span,
} from "@/lib/bigBang";
import { hash, jwGlyphs, makePath, slashes, sweepStrokes, type Pt } from "@/lib/inkBrush";
import { blob, brush, drop, makeGrain, paper, splatter } from "@/lib/inkCanvas";

const TAU = Math.PI * 2;
const PAPER = "#f2f0ff"; // the site's starlight, so the veil's CSS white and the canvas paper match
const INK = "#0c0a1a";
const WHITE = "#f2f0ff";
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
    // full resolution, every display frame
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = window.innerWidth;
    const h = window.innerHeight;
    // a hidden or zero-size window has nothing to draw on: just get out of the way
    if (w < 2 || h < 2) return finish();
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    // the paper is torn on a second layer, so the real page shows through the holes of the main canvas
    const layer = document.createElement("canvas");
    layer.width = canvas.width;
    layer.height = canvas.height;
    const lctx = layer.getContext("2d");
    if (!lctx) return finish();

    const cx = w / 2, cy = h / 2, m = Math.min(w, h), reach = Math.hypot(cx, cy);
    const grain = makeGrain();
    const sweeps = sweepStrokes(reach).map((s) => ({ ...s, path: makePath(s.ctrl.map(([x, y]): Pt => [cx + x, cy + y]), 110) }));
    const blasts = slashes(reach, m).map((s) => ({ ...s, path: makePath(s.ctrl.map(([x, y]): Pt => [cx + x, cy + y]), 90) }));
    const jwH = m * JW_SCALE * 1.18;
    const jw = jwGlyphs(cx, cy, jwH).map((g) => makePath(g, 60));
    const jwShift = (dx: number, dy: number) => jwGlyphs(cx + dx, cy + dy, jwH).map((g) => makePath(g, 60));
    const dropR = Math.min(13, Math.max(6, m * 0.016));

    const reset = (c: CanvasRenderingContext2D) => {
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.globalAlpha = 1;
      c.globalCompositeOperation = "source-over";
    };
    const jwDraw = (c: CanvasRenderingContext2D, color: string, seed: number, paths = jw) =>
      paths.forEach((path, i) => brush(c, path, { w: m * 0.03, color, seed: seed + i, dry: 0.1, bristles: 10 }));

    const frame = () => {
      try {
        draw();
      } catch {
        // never leave the page covered: any drawing error ends the intro
        finish();
      }
    };
    const draw = () => {
      const t = performance.now() - t0;
      if (t >= INTRO_MS) return finish();
      const p = introPhase(t);
      reset(ctx);
      ctx.clearRect(0, 0, w, h);

      if (t < IMPACT1_MS) {
        // 1-3: paper, the falling drop with its dry-brush streak, the strokes sweeping in, the point
        paper(ctx, grain, w, h, PAPER);
        if (t < LAND_MS) {
          const r = dropR, y0 = r * 4, y = y0 + (cy - y0) * p.drop, len = Math.min(y, m * (0.12 + 0.55 * p.drop));
          brush(ctx, makePath([[cx, y - r], [cx + 2, y - len * 0.5], [cx - 2, y - len]], 40), { w: m * 0.026, color: INK, seed: 201, dry: 0.7, attack: 0.02, tailMin: 0.05, bristles: 18 });
          drop(ctx, cx, y, r, p.drop, INK);
        } else {
          const fade = 1 - span(t, 980, POINT_MS);
          if (fade > 0) for (const s of sweeps) {
            const k = outQuint(span(t, LAND_MS + s.delay, LAND_MS + s.delay + 380));
            if (k > 0) brush(ctx, s.path, { w: m * s.width, p: k, color: INK, seed: s.seed, dry: 0.55, attack: 0.12, tailMin: 0.12, core: 0.7, alpha: fade });
          }
          ctx.fillStyle = INK;
          blob(ctx, cx, cy, m * (0.0045 + 0.0925 * p.mass), 6, 0.16 * p.mass);
          ctx.fill();
          if (t < 1000) splatter(ctx, cx, cy, 0, TAU, m * 0.22, 30, m * 0.007, 24, INK, outQuint(span(t, LAND_MS, LAND_MS + 110)));
          // tiny motes pulled into the point
          const sp = span(t, 1000, POINT_MS);
          for (let i = 0; i < 18; i++) {
            const a = hash(230, i) * TAU, d = m * 0.26 * (1 - sp) * (0.4 + hash(231, i));
            ctx.beginPath();
            ctx.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, m * 0.004 * (1 - sp), 0, TAU);
            ctx.fill();
          }
        }
      } else if (t < BURST_MS) {
        // 4: two hard impact frames, JW in ink; ragged radial lines; the second has a violet/lavender glitch
        const inv = p.impact === 1;
        ctx.fillStyle = inv ? INK : PAPER;
        ctx.fillRect(0, 0, w, h);
        const sk = Math.floor(t / 16);
        ctx.translate((hash(8, sk) - 0.5) * m * 0.028, (hash(9, sk) - 0.5) * m * 0.028);
        const fg = inv ? WHITE : INK;
        ctx.fillStyle = fg;
        const seed = inv ? 301 : 302;
        for (let i = 0; i < 26; i++) {
          const a = hash(seed, i) * TAU, d0 = m * (0.07 + hash(seed, i + 40) * 0.06), d1 = reach * (0.35 + hash(seed, i + 80) * 0.8), bw = m * (0.004 + hash(seed, i + 120) * 0.02);
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(a - 0.015) * d0, cy + Math.sin(a - 0.015) * d0);
          ctx.lineTo(cx + Math.cos(a) * d1, cy + Math.sin(a) * d1);
          ctx.lineTo(cx + Math.cos(a + 0.015 + bw / d1) * d0, cy + Math.sin(a + 0.015 + bw / d1) * d0);
          ctx.fill();
        }
        blob(ctx, cx, cy, m * (inv ? 0.12 : 0.09), 16, 0.3);
        ctx.fill();
        splatter(ctx, cx, cy, 0, TAU, m * 0.45, 70, m * 0.01, 17, fg);
        if (!inv) {
          const off = m * 0.014;
          jwDraw(ctx, VIOLET, 240, jwShift(-off, off * 0.3));
          jwDraw(ctx, LAVENDER, 244, jwShift(off, -off * 0.3));
        }
        jwDraw(ctx, inv ? INK : WHITE, 250);
      } else {
        // 5: the explosion tears the paper away; the real page is underneath
        lctx.setTransform(1, 0, 0, 1, 0, 0);
        lctx.globalCompositeOperation = "source-over";
        lctx.clearRect(0, 0, layer.width, layer.height);
        reset(lctx);
        paper(lctx, grain, w, h, PAPER);
        lctx.globalCompositeOperation = "destination-out";
        lctx.fillStyle = "#000";
        blob(lctx, cx, cy, p.open * reach * 1.25 + 1, 41, 0.16);
        lctx.fill();
        for (const s of blasts) {
          const k = outQuint(span(t, BURST_MS + s.delay, BURST_MS + s.delay + 230));
          brush(lctx, s.path, { w: m * (s.width + 0.05), p: k, color: "#000", seed: s.seed, dry: 0.5, attack: 0.02, tailMin: 0.1 });
        }
        lctx.globalCompositeOperation = "source-over";
        const e = t - BURST_MS;
        const shake = e < 90 ? m * 0.02 : 0;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.drawImage(layer, shake ? (hash(10, Math.floor(t / 16)) - 0.5) * shake * dpr : 0, shake ? (hash(11, Math.floor(t / 16)) - 0.5) * shake * dpr : 0);
        reset(ctx);
        // black ink slashes shot out over the page, thinning and fading as they fly
        if (p.ink > 0) for (const s of blasts) {
          const k = outQuint(span(t, BURST_MS + s.delay, BURST_MS + s.delay + 230));
          brush(ctx, s.path, { w: m * s.width, p: k, color: INK, seed: s.seed, dry: 0.6, attack: 0.02, tailMin: 0.08, alpha: p.ink });
          if (e > 200) {
            const q = s.path.pts[s.path.n];
            ctx.globalAlpha = p.ink;
            splatter(ctx, q[0], q[1], s.angle, 0.9, m * 0.1, 6, m * 0.005, s.seed + 10, INK, span(t, BURST_MS + 200, BURST_MS + 330));
            ctx.globalAlpha = 1;
          }
        }
        // JW and the point's last ink flash as the blast starts, then are carried away
        if (p.jw > 0) {
          ctx.globalAlpha = p.jw;
          ctx.fillStyle = INK;
          blob(ctx, cx, cy, m * 0.1 * (1 + 2 * (1 - p.jw)), 5, 0.14);
          ctx.fill();
          jwDraw(ctx, WHITE, 300);
          ctx.globalAlpha = 1;
        }
        // shockwave ring and a short white flash
        if (p.ring > 0 && p.ring < 1) {
          ctx.globalAlpha = 1 - p.ring;
          ctx.strokeStyle = VIOLET;
          ctx.lineWidth = m * 0.012 * (1 - p.ring) + 1;
          ctx.beginPath();
          ctx.arc(cx, cy, p.ring * reach * 1.1, 0, TAU);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
        if (p.flash > 0) {
          ctx.fillStyle = WHITE;
          ctx.globalAlpha = p.flash * 0.55;
          ctx.fillRect(0, 0, w, h);
          ctx.globalAlpha = 1;
        }
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
