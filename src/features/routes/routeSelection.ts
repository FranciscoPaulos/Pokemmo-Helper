import type { RegionRouteGroup, RouteEncounterGroup } from "../../types/pokemon";
import { makeRouteKey, normalizeLocationKey } from "../../lib/normalizeLocation";

const regionOrder = ["Kanto", "Johto", "Hoenn", "Sinnoh", "Unova"];

const startingLocationByRegion: Record<string, string> = {
  kanto: "Pallet Town",
  johto: "New Bark Town",
  hoenn: "Littleroot Town",
  sinnoh: "Twinleaf Town",
  unova: "Nuvema Town"
};

export function getRegionSortValue(regionName: string): number {
  const index = regionOrder.findIndex((region) => normalizeLocationKey(region) === normalizeLocationKey(regionName));

  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

export function sortRegionsByGeneration(regions: RegionRouteGroup[]): RegionRouteGroup[] {
  return [...regions].sort((a, b) => {
    const orderDifference = getRegionSortValue(a.displayName) - getRegionSortValue(b.displayName);

    return orderDifference || a.displayName.localeCompare(b.displayName);
  });
}

export function getStartingLocationName(region: RegionRouteGroup | undefined): string | undefined {
  if (!region) {
    return undefined;
  }

  return startingLocationByRegion[normalizeLocationKey(region.displayName)];
}

export function getInitialRegion(regions: RegionRouteGroup[]): RegionRouteGroup | undefined {
  return regions[0];
}

export function getInitialRoute(region: RegionRouteGroup | undefined): RouteEncounterGroup | undefined {
  const startingLocation = getStartingLocationName(region);

  if (!region || !startingLocation) {
    return region?.routes[0];
  }

  return findRouteInRegion(region, makeRouteKey(region.displayName, startingLocation)) ?? region.routes[0];
}

export function findRouteInRegion(
  region: RegionRouteGroup | undefined,
  routeKey: string | undefined
): RouteEncounterGroup | undefined {
  if (!region || !routeKey) {
    return undefined;
  }

  return region.routes.find((route) => route.routeKey === routeKey);
}
