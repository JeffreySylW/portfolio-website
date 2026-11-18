// Orthographic projection of the globe onto a disc: what a photo of Earth from far away shows.
// Screen y grows downward; north is up, east is right.

export interface GlobeView {
  /** Longitude and latitude at the centre of the disc, degrees. */
  lon0: number;
  lat0: number;
  /** Disc radius and centre in pixels. */
  radius: number;
  cx: number;
  cy: number;
}

const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;

export function project(lon: number, lat: number, v: GlobeView): { x: number; y: number; visible: boolean } {
  const la = lat * D2R;
  const dl = (lon - v.lon0) * D2R;
  const l0 = v.lat0 * D2R;
  const cosc = Math.sin(l0) * Math.sin(la) + Math.cos(l0) * Math.cos(la) * Math.cos(dl);
  const x = v.radius * Math.cos(la) * Math.sin(dl);
  const y = v.radius * (Math.cos(l0) * Math.sin(la) - Math.sin(l0) * Math.cos(la) * Math.cos(dl));
  return { x: v.cx + x, y: v.cy - y, visible: cosc >= 0 };
}

/** Screen point to lon/lat, or null when it falls outside the disc. */
export function unproject(sx: number, sy: number, v: GlobeView): { lon: number; lat: number } | null {
  const x = sx - v.cx;
  const y = v.cy - sy;
  const rho = Math.hypot(x, y);
  if (rho > v.radius) return null;
  const l0 = v.lat0 * D2R;
  if (rho === 0) return { lon: v.lon0, lat: v.lat0 };
  const c = Math.asin(rho / v.radius);
  const lat = Math.asin(Math.cos(c) * Math.sin(l0) + (y * Math.sin(c) * Math.cos(l0)) / rho) * R2D;
  const lon =
    v.lon0 + Math.atan2(x * Math.sin(c), rho * Math.cos(l0) * Math.cos(c) - y * Math.sin(l0) * Math.sin(c)) * R2D;
  return { lon: ((lon + 540) % 360) - 180, lat };
}
