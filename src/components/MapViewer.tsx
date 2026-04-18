import { useEffect, useState } from "react";
import type { RegionRouteGroup, RouteEncounterGroup } from "../types/pokemon";
import type { RegionMapConfig } from "../data/routeHotspots";
import { routeMapsByRouteKey } from "../data/routeMaps";
import { RouteMapCard } from "./RouteMapCard";

interface MapViewerProps {
  region: RegionRouteGroup | undefined;
  selectedRoute: RouteEncounterGroup | undefined;
  mapConfig: RegionMapConfig | undefined;
  onRouteSelect: (route: RouteEncounterGroup) => void;
}

export function MapViewer({ region, selectedRoute, mapConfig, onRouteSelect }: MapViewerProps) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [mapConfig?.imageUrl]);

  if (!region) {
    return (
      <div className="map-stage map-stage--empty">
        <h1>PokeMMO Encounters</h1>
        <p>Add your encounter JSON to start browsing by region and route.</p>
      </div>
    );
  }

  const configuredHotspots = mapConfig?.hotspots
    .map((hotspot) => ({
      hotspot,
      route: region.routes.find((route) => route.routeKey === hotspot.routeKey)
    }))
    .filter((item): item is { hotspot: NonNullable<typeof item.hotspot>; route: RouteEncounterGroup } =>
      Boolean(item.route)
    );

  const hasMap = Boolean(mapConfig?.imageUrl && configuredHotspots?.length && !imageFailed);

  return (
    <div className="map-stage">
      <div className="map-header">
        <div>
          <p className="eyebrow">Region map</p>
          <h1>{region.displayName}</h1>
        </div>
        <span>{region.routes.length} routes</span>
      </div>

      {selectedRoute ? (
        <RouteMapCard
          region={region}
          route={selectedRoute}
          routeMap={routeMapsByRouteKey[selectedRoute.mapRouteKey ?? selectedRoute.routeKey]}
          onRouteSelect={onRouteSelect}
        />
      ) : null}

      {hasMap ? (
        <div className="map-image-wrap">
          <img
            className="region-map-image"
            src={mapConfig?.imageUrl}
            alt={mapConfig?.imageAlt ?? region.displayName}
            onError={() => setImageFailed(true)}
          />
          {configuredHotspots?.map(({ hotspot, route }) => (
            <button
              key={hotspot.routeKey}
              className={`route-hotspot ${selectedRoute?.routeKey === route.routeKey ? "is-selected" : ""}`}
              style={{
                left: `${hotspot.x}%`,
                top: `${hotspot.y}%`,
                width: `${hotspot.width}%`,
                height: `${hotspot.height}%`
              }}
              type="button"
              onClick={() => onRouteSelect(route)}
              title={hotspot.label}
            >
              {hotspot.label}
            </button>
          ))}
        </div>
      ) : (
        <div className="route-fallback">
          <h2>Routes</h2>
          <p>No map hotspots are configured for this region yet. Use the route list below.</p>
          <div className="route-chip-grid">
            {region.routes.map((route) => (
              <button
                key={route.routeKey}
                className={`${selectedRoute?.routeKey === route.routeKey ? "is-selected" : ""} ${
                  route.isNavigationOnly ? "is-navigation-only" : ""
                }`}
                type="button"
                onClick={() => onRouteSelect(route)}
              >
                {route.displayName}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
