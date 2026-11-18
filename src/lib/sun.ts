// Where the sun is overhead right now (the subsolar point), from the standard low-precision
// solar position formulas (Astronomical Almanac / NOAA). Good to about 0.01°, plenty for a picture.

const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;
const mod = (a: number, n: number) => ((a % n) + n) % n;

export interface LatLon {
  lat: number;
  lon: number;
}

export function subsolarPoint(date: Date): LatLon {
  const n = date.getTime() / 86400000 + 2440587.5 - 2451545.0; // days since J2000.0
  const L = mod(280.46 + 0.9856474 * n, 360); // mean longitude
  const g = mod(357.528 + 0.9856003 * n, 360) * D2R; // mean anomaly
  const lambda = (L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * D2R; // ecliptic longitude
  const eps = (23.439 - 0.0000004 * n) * D2R; // obliquity
  const decl = Math.asin(Math.sin(eps) * Math.sin(lambda));
  const ra = Math.atan2(Math.cos(eps) * Math.sin(lambda), Math.cos(lambda)) * R2D;
  const gmst = mod(280.46061837 + 360.98564736629 * n, 360);
  return { lat: decl * R2D, lon: mod(ra - gmst + 180, 360) - 180 };
}

/** Unit vector for a point on the globe (x towards 0°E on the equator, z north). */
export function toVector(lat: number, lon: number): [number, number, number] {
  const la = lat * D2R;
  const lo = lon * D2R;
  return [Math.cos(la) * Math.cos(lo), Math.cos(la) * Math.sin(lo), Math.sin(la)];
}

/** Cosine of the sun's zenith angle at a place: above 0 means the sun is up. */
export function sunHeight(lat: number, lon: number, sun: LatLon): number {
  const a = toVector(lat, lon);
  const b = toVector(sun.lat, sun.lon);
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

export function isDaylight(lat: number, lon: number, date: Date): boolean {
  return sunHeight(lat, lon, subsolarPoint(date)) > 0;
}
