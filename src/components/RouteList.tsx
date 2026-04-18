import type { RegionRouteGroup, RouteEncounterGroup } from "../types/pokemon";
import { groupPokemonEncounters } from "../lib/groupPokemonEncounters";

interface RouteListProps {
  region: RegionRouteGroup | undefined;
  selectedRouteKey: string | undefined;
  onRouteClear: () => void;
  onRouteSelect: (route: RouteEncounterGroup) => void;
}

export function RouteList({ region, selectedRouteKey, onRouteClear, onRouteSelect }: RouteListProps) {
  if (!region) {
    return null;
  }

  const totalUniquePokemon = groupPokemonEncounters(
    region.routes.flatMap((route) => route.encounters)
  ).length;

  return (
    <div className="route-list">
      <p className="eyebrow">Routes</p>
      <div className="route-list__items">
        <button className={!selectedRouteKey ? "is-selected" : ""} type="button" onClick={onRouteClear}>
          <span>All routes</span>
          <small>{totalUniquePokemon}</small>
        </button>
        {region.routes.map((route) => (
          <button
            key={route.routeKey}
            className={`${route.routeKey === selectedRouteKey ? "is-selected" : ""} ${
              route.isNavigationOnly ? "is-navigation-only" : ""
            }`}
            type="button"
            onClick={() => onRouteSelect(route)}
          >
            <span>{route.displayName}</span>
            <small>{route.isNavigationOnly ? "map" : groupPokemonEncounters(route.encounters).length}</small>
          </button>
        ))}
      </div>
    </div>
  );
}
