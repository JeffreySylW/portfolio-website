import { PLACES } from "../content/work.ts";
import { subsolarPoint, sunHeight } from "./sun.ts";

export function formatLatLon(lat: number, lon: number): string {
  const f = (v: number) => (Math.round(Math.abs(v) * 10) / 10).toFixed(1);
  return `${f(lat)}°${lat < 0 ? "S" : "N"} ${f(lon)}°${lon < 0 ? "W" : "E"}`;
}

/** The small live line under the hero: where the sun is overhead, and day or night in Richmond. */
export function sunReadout(date: Date): { overhead: string; richmond: "day" | "night" } {
  const sun = subsolarPoint(date);
  const r = PLACES.richmond;
  return {
    overhead: formatLatLon(sun.lat, sun.lon),
    richmond: sunHeight(r.lat, r.lon, sun) > 0 ? "day" : "night",
  };
}
