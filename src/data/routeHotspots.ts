import { makeRouteKey } from "../lib/normalizeLocation";
import { assetPath } from "../lib/assetPath";

export interface RouteHotspot {
  routeKey: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RegionMapConfig {
  regionName: string;
  imageUrl?: string;
  imageAlt: string;
  hotspots: RouteHotspot[];
}

function hotspot(regionName: string, label: string, x: number, y: number, width: number, height: number): RouteHotspot {
  return {
    routeKey: makeRouteKey(regionName, label),
    label,
    x,
    y,
    width,
    height
  };
}

export const routeHotspotsByRegion: Record<string, RegionMapConfig> = {
  kanto: {
    regionName: "Kanto",
    imageUrl: assetPath("maps/kanto.png"),
    imageAlt: "Kanto region map",
    hotspots: [
      hotspot("Kanto", "Route 1", 38, 66, 7, 10),
      hotspot("Kanto", "Route 2", 37, 47, 8, 13),
      hotspot("Kanto", "Route 3", 50, 38, 11, 7),
      hotspot("Kanto", "Route 4", 62, 37, 12, 7),
      hotspot("Kanto", "Route 5", 59, 55, 7, 8),
      hotspot("Kanto", "Route 6", 59, 68, 7, 8)
    ]
  },
  hoenn: {
    regionName: "Hoenn",
    imageUrl: assetPath("maps/hoenn.png"),
    imageAlt: "Hoenn region map",
    hotspots: [
      hotspot("Hoenn", "Route 101", 21, 65, 8, 8),
      hotspot("Hoenn", "Route 102", 17, 55, 14, 7),
      hotspot("Hoenn", "Route 103", 25, 45, 16, 8),
      hotspot("Hoenn", "Route 104", 28, 31, 8, 17)
    ]
  },
  sinnoh: {
    regionName: "Sinnoh",
    imageUrl: assetPath("maps/sinnoh.png"),
    imageAlt: "Sinnoh region map",
    hotspots: [
      hotspot("Sinnoh", "Route 201", 39, 77, 13, 7),
      hotspot("Sinnoh", "Route 202", 49, 67, 7, 11),
      hotspot("Sinnoh", "Route 203", 57, 59, 13, 8),
      hotspot("Sinnoh", "Route 204", 47, 44, 8, 16)
    ]
  },
  unova: {
    regionName: "Unova",
    imageUrl: assetPath("maps/unova.png"),
    imageAlt: "Unova region map",
    hotspots: [
      hotspot("Unova", "Route 1", 51, 80, 8, 9),
      hotspot("Unova", "Route 2", 48, 68, 8, 11),
      hotspot("Unova", "Route 3", 40, 56, 17, 8),
      hotspot("Unova", "Route 4", 35, 39, 9, 17)
    ]
  }
};
