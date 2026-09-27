export function seededRandom(seed: number) {
  let t = (seed + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export type PlanetPalette = { light: string; mid: string; dark: string };

export type Star = {
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  min: number;
};

export function generateStars(count: number, width: number, height: number, seedOffset = 0): Star[] {
  return Array.from({ length: count }, (_, i) => {
    const s = i + seedOffset;
    return {
      x: seededRandom(s * 2 + 1) * width,
      y: seededRandom(s * 2 + 2) * height,
      size: seededRandom(s * 3 + 7) > 0.85 ? 2 : 1,
      delay: seededRandom(s * 5 + 3) * 4,
      duration: 2.5 + seededRandom(s * 7 + 11) * 3,
      min: 0.1 + seededRandom(s * 11 + 13) * 0.2,
    };
  });
}

export function planetPixels(grid: number, palette: PlanetPalette) {
  const r = grid / 2;
  const cells: { x: number; y: number; fill: string }[] = [];
  for (let y = 0; y < grid; y++) {
    for (let x = 0; x < grid; x++) {
      const dx = x - r + 0.5;
      const dy = y - r + 0.5;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > r) continue;
      const lit = -dx - dy;
      const fill =
        lit > r * 0.6 ? palette.light : dist > r - 1.4 ? palette.dark : palette.mid;
      cells.push({ x, y, fill });
    }
  }
  return cells;
}
