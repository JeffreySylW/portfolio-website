// The opening Big Bang, on every page load: an ink-brush sequence in the spirit of an ink-on-paper hand animation.
// On pale paper a black ink drop falls down the middle, trailing a dry-brush streak; ink brush strokes sweep in from
// every side and pull into one point in the middle; the point holds for a beat; two hard impact frames (inverted,
// then normal) flash the "JW" mark; then the explosion itself tears the paper away, so the site is revealed by the
// blast (no separate pan or wipe). Never under reduced motion.
//
// No-JS and LCP safety: the veil is hidden by CSS unless the inline script arms it; the page (and the hero Earth
// image) always renders underneath; a CSS failsafe hides the veil even if the main bundle never runs.

/** The drop lands in the middle (a slow, gravity-eased fall). */
export const LAND_MS = 650;
/** The condensed point is as small as it gets. */
export const POINT_MS = 1260;
/** First hard impact frame (inverted). */
export const IMPACT1_MS = 1320;
/** Second hard impact frame (normal). */
export const IMPACT2_MS = 1390;
/** The explosion: the paper is torn away and the site shows underneath. */
export const BURST_MS = 1450;
/** Length of the intro in ms. */
export const INTRO_MS = 2300;
/** The CSS failsafe hides the veil at this point whatever happens to the scripts. */
export const FAILSAFE_MS = 4500;
/** "JW" cap height as a share of the screen's short side. */
export const JW_SCALE = 0.11;

/**
 * Inline script placed right after the veil: runs while the HTML is parsed, before first paint, and arms the
 * veil on every load unless the visitor prefers reduced motion.
 */
export const introScript =
  `(function(){try{var v=document.getElementById("bang");` +
  `if(!v||window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;` +
  `v.dataset.t0=String(performance.now());v.dataset.play="1"}catch(e){}})()`;

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
/** 0..1 progress of t between a and b. */
export const span = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
export const outCubic = (k: number) => 1 - (1 - k) ** 3;
export const outQuint = (k: number) => 1 - (1 - k) ** 5;

/** Where the ink has gathered into a mass (grows from the landing) and when it starts to shrink to the point. */
const MASS_FULL_MS = 1000;

export type IntroPhase = {
  /** How far the drop has fallen, 0 (above the screen) .. 1 (landed in the middle). */
  drop: number;
  /** Progress of the strokes sweeping in from every side, 0..1 (eased: fast, then settling). */
  sweep: number;
  /** Linear 0..1 progress of the whole condensing, landing -> point. */
  converge: number;
  /** Size of the ink mass in the middle: 1 = full, shrinking to a tiny point (> 0) at POINT_MS. */
  mass: number;
  /** Which hard impact frame is showing: 0 none, 1 inverted, 2 normal. */
  impact: 0 | 1 | 2;
  /** The "JW" mark, 0..1 (full in the impact frames, carried off by the blast). */
  jw: number;
  /** How much of the page the blast has uncovered, 0..1. */
  open: number;
  /** Share of the screen still covered (1 - open). */
  veil: number;
  /** Ink slashes shooting out, 0..1. */
  slashes: number;
  /** The shockwave ring, 0..1 of the screen. */
  ring: number;
  /** The short white flash as the blast starts, 0..1. */
  flash: number;
  /** Opacity of the ink slashes flying over the page: 1, then fading to 0. */
  ink: number;
};

/** Where the intro is at t ms after it started. */
export function introPhase(t: number): IntroPhase {
  const e = t - BURST_MS;
  const impact = t >= IMPACT1_MS && t < IMPACT2_MS ? 1 : t >= IMPACT2_MS && t < BURST_MS ? 2 : 0;
  const shrink = outQuint(span(t, MASS_FULL_MS, POINT_MS));
  const grow = outCubic(span(t, LAND_MS, MASS_FULL_MS));
  const mass = t < MASS_FULL_MS ? grow : 1 - shrink * 0.97;
  const open = e <= 0 ? 0 : outQuint(span(t, BURST_MS, BURST_MS + 600));
  return {
    // gravity: slow to start, quicker as it nears the middle
    drop: span(t, 0, LAND_MS) ** 2,
    sweep: outQuint(span(t, LAND_MS, LAND_MS + 380 + 8 * 28)),
    converge: span(t, LAND_MS, POINT_MS),
    mass,
    impact,
    jw: t < IMPACT1_MS ? 0 : t < BURST_MS ? 1 : 1 - span(t, BURST_MS, BURST_MS + 200),
    open,
    veil: 1 - open,
    slashes: outQuint(span(t, BURST_MS, BURST_MS + 260)),
    ring: outQuint(span(t, BURST_MS, BURST_MS + 420)),
    flash: e < 0 ? 0 : span(t, BURST_MS, BURST_MS + 30) * (1 - span(t, BURST_MS + 30, BURST_MS + 130)),
    ink: 1 - span(t, BURST_MS + 120, BURST_MS + 520),
  };
}
