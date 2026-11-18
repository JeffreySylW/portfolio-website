// The opening "Big Bang": a white screen, a single black drop falls and lands where the hero Earth is, ink
// floods outward, the stars burst out of it and the page opens from the centre. Smooth (drawn every display
// frame at full resolution), once per browser tab, never under reduced motion.
//
// No-JS and LCP safety: the veil is hidden by CSS unless the inline script arms it; the page (and the hero
// Earth image) always renders underneath; a CSS failsafe hides the veil even if the main bundle never runs.

/** Length of the intro in ms. */
export const INTRO_MS = 2800;
/** The CSS failsafe hides the veil at this point whatever happens to the scripts. */
export const FAILSAFE_MS = 4500;
export const SEEN_KEY = "jw-bang-seen";

/** Star colours: the site's light indigo steps. */
export const BANG_COLORS = ["#5b54d6", "#a9a4ff", "#f2f0ff"] as const;

/**
 * Inline script placed right after the veil: runs while the HTML is parsed, before first paint. Arms the
 * veil on the first visit in this tab unless the visitor prefers reduced motion. Any storage error means
 * no intro (it could not be remembered, so it would replay on every page).
 */
export const introScript =
  `(function(){try{var v=document.getElementById("bang");` +
  `if(!v||window.matchMedia("(prefers-reduced-motion: reduce)").matches||sessionStorage.getItem("${SEEN_KEY}"))return;` +
  `sessionStorage.setItem("${SEEN_KEY}","1");v.dataset.t0=String(performance.now());v.dataset.play="1"}catch(e){}})()`;

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const span = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
const smooth = (k: number) => k * k * (3 - 2 * k);
const outCubic = (k: number) => 1 - (1 - k) ** 3;

export type IntroPhase = {
  /** How far the drop has fallen, 0 (top of the screen) .. 1 (landed). */
  drop: number;
  /** Ink spread from the landing point, 0..1 of the way to the farthest corner. */
  ink: number;
  /** The flash when the drop lands, 0..1. */
  flash: number;
  /** How far the stars have flown, 0..1. */
  stars: number;
  starAlpha: number;
  /** The page opening from the centre, 0..1. */
  open: number;
  /** Share of the screen still covered (1 - open). */
  veil: number;
};

/** Where the intro is at t ms after it started. */
export function introPhase(t: number): IntroPhase {
  const T = INTRO_MS;
  const impact = T * 0.25;
  const drop = span(t, 0, impact) ** 2;
  const ink = t < impact ? 0 : outCubic(span(t, impact, T * 0.48));
  const flash = span(t, impact, T * 0.28) * (1 - smooth(span(t, T * 0.28, T * 0.45)));
  const stars = outCubic(span(t, T * 0.28, T * 0.88));
  const starAlpha = span(t, T * 0.28, T * 0.31) * (1 - smooth(span(t, T * 0.62, T)));
  const open = t >= T ? 1 : smooth(span(t, T * 0.42, T * 0.86));
  return { drop, ink, flash, stars, starAlpha, open, veil: 1 - open };
}

/** Radius of the ink's edge at angle theta: a circle with a soft liquid wobble (0 = round). */
export function inkRadius(r: number, theta: number, wobble: number, t = 0): number {
  const w = Math.sin(3 * theta + 1.3 + t * 1.7) * 0.5 + Math.sin(5 * theta + 0.4 - t * 2.3) * 0.3 + Math.sin(9 * theta + 2.1 + t * 3.1) * 0.2;
  return r * (1 + wobble * 0.12 * w);
}

// small seeded PRNG (mulberry32), so the burst looks the same on every visit
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Star = { angle: number; dist: number; size: number; color: (typeof BANG_COLORS)[number] };

/** The stars thrown out by the burst; `dist` is a fraction of the distance to the farthest corner. */
export function makeStars(seed = 12656, count = 380): Star[] {
  const r = rng(seed);
  const out: Star[] = [];
  for (let i = 0; i < count; i++) {
    const c = r();
    out.push({
      angle: ((i + r()) / count) * Math.PI * 2,
      dist: 0.12 + 1.08 * Math.sqrt(r()),
      size: 0.6 + 1.6 * r() ** 2,
      color: c < 0.6 ? BANG_COLORS[2] : c < 0.9 ? BANG_COLORS[1] : BANG_COLORS[0],
    });
  }
  return out;
}
