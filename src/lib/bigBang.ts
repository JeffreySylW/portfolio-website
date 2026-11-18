// The opening "Big Bang", after NASA Goddard's Big Bang animation (SVS 12656): one bright point at the Earth
// flashes, glowing gas and small galaxies rush outward, and the dark veil dissolves into the page in an 8x8
// Bayer dither. Drawn in code (no video), once per browser tab, never under reduced motion.
//
// No-JS and LCP safety: the veil is hidden by CSS unless the inline script arms it; the page (and the hero
// Earth image) always renders underneath; a CSS failsafe hides the veil even if the main bundle never runs.

/** Length of the intro in ms. */
export const INTRO_MS = 2600;
/** The CSS failsafe hides the veil at this point whatever happens to the scripts. */
export const FAILSAFE_MS = 4500;
export const SEEN_KEY = "jw-bang-seen";

/** Gas and galaxy colours: the site's flat indigo steps above the void. */
export const BANG_COLORS = ["#2b2a7a", "#5b54d6", "#a9a4ff", "#f2f0ff"] as const;

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

export type IntroPhase = {
  /** White flash at the point, 0..1. */
  flash: number;
  /** How far the gas has spread, 0..1 of the screen. Never shrinks. */
  radius: number;
  /** Gas brightness, 0..1. */
  gas: number;
  /** Galaxy brightness, 0..1. */
  galaxies: number;
  /** Share of the screen still covered by the dark veil, 0..1. Never grows. */
  veil: number;
};

/** Where the intro is at t ms after it started. */
export function introPhase(t: number): IntroPhase {
  const T = INTRO_MS;
  const rise = span(t, 0, T * 0.13);
  const fall = span(t, T * 0.16, T * 0.45);
  const flash = rise * rise * (1 - smooth(fall));
  const k = span(t, T * 0.08, T * 0.9);
  const radius = 1 - (1 - k) ** 3;
  const gas = span(t, T * 0.08, T * 0.2) * (1 - smooth(span(t, T * 0.62, T)));
  const galaxies = span(t, T * 0.27, T * 0.5) * (1 - smooth(span(t, T * 0.75, T)));
  const veil = t >= T ? 0 : 1 - smooth(span(t, T * 0.5, T * 0.93));
  return { flash, radius, gas, galaxies, veil };
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

export type Puff = { angle: number; dist: number; size: number; alpha: number; color: (typeof BANG_COLORS)[number] };
export type Galaxy = Puff & { delay: number };

/** The glowing gas puffs and galaxy specks, as fractions of the burst's full reach. */
export function makeCloud(seed = 12656): { puffs: Puff[]; galaxies: Galaxy[] } {
  const r = rng(seed);
  const gasColors = [BANG_COLORS[0], BANG_COLORS[0], BANG_COLORS[1], BANG_COLORS[1], BANG_COLORS[2], BANG_COLORS[3]];
  const puffs: Puff[] = [];
  for (let i = 0; i < 56; i++) {
    // even spread round the circle with jitter, so no side of the burst is empty
    const angle = ((i + r() * 0.9) / 56) * Math.PI * 2;
    const dist = 0.12 + 0.88 * Math.sqrt(r());
    puffs.push({ angle, dist, size: 0.05 + 0.13 * r(), alpha: 0.35 + 0.5 * r(), color: gasColors[Math.floor(r() * gasColors.length)] });
  }
  const galaxies: Galaxy[] = [];
  for (let i = 0; i < 44; i++) {
    galaxies.push({
      angle: r() * Math.PI * 2,
      dist: 0.2 + 0.8 * r(),
      size: 0.006 + 0.012 * r(),
      alpha: 0.6 + 0.4 * r(),
      color: r() < 0.6 ? BANG_COLORS[2] : BANG_COLORS[3],
      delay: r() * 0.35,
    });
  }
  return { puffs, galaxies };
}

const BAYER8 = (() => {
  // recursive Bayer matrix, 8x8
  let m = [[0]];
  for (let n = 1; n < 8; n *= 2) {
    const next: number[][] = Array.from({ length: n * 2 }, () => new Array(n * 2).fill(0));
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) {
        const v = m[y][x] * 4;
        next[y][x] = v;
        next[y][x + n] = v + 2;
        next[y + n][x] = v + 3;
        next[y + n][x + n] = v + 1;
      }
    m = next;
  }
  return m;
})();

/** Ordered-dither threshold for cell (x, y), strictly between 0 and 1; tiles every 8 cells. */
export function bayer(x: number, y: number): number {
  return (BAYER8[y & 7][x & 7] + 0.5) / 64;
}
