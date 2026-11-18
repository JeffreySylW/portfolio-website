// The opening "Big Bang", on every page load, kept minimal: a white screen, one small black drop falls slowly
// down the middle; on impact a couple of hard black/white frames and a small "JW" in the purple glitch; then
// it explodes violently, stars shooting out fast, and the site opens straight after. Smooth (every display
// frame) except the deliberately hard impact frames. Never under reduced motion.
//
// No-JS and LCP safety: the veil is hidden by CSS unless the inline script arms it; the page (and the hero
// Earth image) always renders underneath; a CSS failsafe hides the veil even if the main bundle never runs.

/** When the drop lands (a slow fall). */
export const IMPACT_MS = 1300;
/** Length of the intro in ms: the explosion and opening take 1.1 s after the impact. */
export const INTRO_MS = IMPACT_MS + 1100;
/** The CSS failsafe hides the veil at this point whatever happens to the scripts. */
export const FAILSAFE_MS = 4500;
/** "JW" cap height as a share of the screen's short side. */
export const JW_SCALE = 0.09;

/** Star colours: the site's light indigo steps. */
export const BANG_COLORS = ["#5b54d6", "#a9a4ff", "#f2f0ff"] as const;

/**
 * Inline script placed right after the veil: runs while the HTML is parsed, before first paint, and arms the
 * veil on every load unless the visitor prefers reduced motion.
 */
export const introScript =
  `(function(){try{var v=document.getElementById("bang");` +
  `if(!v||window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;` +
  `v.dataset.t0=String(performance.now());v.dataset.play="1"}catch(e){}})()`;

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const span = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
const smooth = (k: number) => k * k * (3 - 2 * k);
const outCubic = (k: number) => 1 - (1 - k) ** 3;
const outQuint = (k: number) => 1 - (1 - k) ** 5;

export type IntroPhase = {
  /** How far the drop has fallen, 0 (above the screen) .. 1 (landed in the middle). */
  drop: number;
  /** Impact frame shown black-for-white. */
  invert: boolean;
  /** Glitch slices and purple ghosts, 0..1. */
  glitch: number;
  /** The "JW" flash, 0..1. */
  jw: number;
  /** The shockwave ring, 0..1 of the screen. */
  shock: number;
  /** How far the stars have flown, 0..1. */
  stars: number;
  starAlpha: number;
  /** The site opening from the centre, 0..1. */
  open: number;
  /** Share of the screen still covered (1 - open). */
  veil: number;
};

/** Where the intro is at t ms after it started. */
export function introPhase(t: number): IntroPhase {
  const T = INTRO_MS;
  const d = t - IMPACT_MS;
  // gravity: slow to start, quicker as it nears the middle
  const drop = span(t, 0, IMPACT_MS) ** 2;
  const invert = (d >= 0 && d < 60) || (d >= 140 && d < 220);
  const glitch = d >= 140 && d < 260 ? 1 - (d - 140) / 120 : 0;
  const jw = d < 0 || d >= 260 ? 0 : d < 60 ? 1 : d < 140 ? 0.55 : d < 220 ? 1 : (260 - d) / 40;
  // the explosion: violent and fast
  const shock = outQuint(span(t, IMPACT_MS + 120, IMPACT_MS + 470));
  const stars = outQuint(span(t, IMPACT_MS + 120, IMPACT_MS + 900));
  const starAlpha = span(t, IMPACT_MS + 120, IMPACT_MS + 140) * (1 - smooth(span(t, IMPACT_MS + 500, T)));
  const open = t >= T ? 1 : outCubic(span(t, IMPACT_MS + 220, IMPACT_MS + 950));
  return { drop, invert, glitch, jw, shock, stars, starAlpha, open, veil: 1 - open };
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
