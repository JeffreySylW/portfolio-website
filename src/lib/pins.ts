import { PLACES, type PlaceId } from "../content/work.ts";
import { EARTH_VIEW } from "./earthView.ts";
import { project } from "./globe.ts";

/** Where a place sits on the hero globe image, as fractions (0..1) of its width and height. */
export function pinPosition(id: PlaceId): { x: number; y: number; visible: boolean } {
  const p = PLACES[id];
  return project(p.lon, p.lat, {
    lon0: EARTH_VIEW.lon0,
    lat0: EARTH_VIEW.lat0,
    radius: 0.5 - EARTH_VIEW.padRatio,
    cx: 0.5,
    cy: 0.5,
  });
}
