// One place for how the hero globe is framed, shared by the build script and the browser.
export const EARTH_VIEW = {
  /** Centre of the disc: the western Atlantic, so the Americas and Virginia face the viewer. */
  lon0: -62,
  lat0: 22,
  /** Halo margin on each side, as a fraction of the whole image. */
  padRatio: 0.0536,
  /** Sun for the pre-built image (no JavaScript): a November afternoon, Virginia near the terminator. */
  defaultSun: { lat: -19, lon: -147 },
  /** Night-side pixel size in CSS pixels. */
  blockCss: 7,
  /** Live redraws never exceed this many device pixels across. */
  maxDevicePx: 1800,
} as const;

/** Pixels per night block for an image `size` px wide shown `cssWidth` CSS px wide. */
export function blockFor(size: number, cssWidth: number): number {
  return Math.max(2, Math.round((EARTH_VIEW.blockCss * size) / cssWidth));
}
