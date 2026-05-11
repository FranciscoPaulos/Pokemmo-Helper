import type { RegionRouteGroup, RouteEncounterGroup } from "../../types/pokemon";
import { normalizeLocationKey } from "../../lib/normalizeLocation";

const regionOrder = ["Kanto", "Johto", "Hoenn", "Sinnoh", "Unova"];

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

export function getInitialRegion(regions: RegionRouteGroup[]): RegionRouteGroup | undefined {
  return regions[0];
}

export function getInitialRoute(_region: RegionRouteGroup | undefined): RouteEncounterGroup | undefined {
  return undefined;
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
