import {
  type RouteConnection,
  toLocalAnimatedRouteMapImagePath,
  toLocalRouteMapImagePath,
  type RouteMapInfo
} from "../data/routeMaps";
import { makeRouteKey } from "../lib/normalizeLocation";
import type { RegionRouteGroup, RouteEncounterGroup } from "../types/pokemon";

const routeMapAssetVersion = "static-png-1";

interface RouteMapCardProps {
  region: RegionRouteGroup;
  route: RouteEncounterGroup;
  routeMap: RouteMapInfo | undefined;
  onRouteSelect: (route: RouteEncounterGroup) => void;
}

interface ConnectionSlotProps {
  label: string;
  connection?: RouteConnection;
  route?: RouteEncounterGroup;
  onRouteSelect: (route: RouteEncounterGroup) => void;
}

function getConnectionLabel(connection: RouteConnection | undefined): string | undefined {
  return typeof connection === "string" ? connection : connection?.label;
}

function getConnectionTargetRouteName(connection: RouteConnection | undefined): string | undefined {
  return typeof connection === "string" ? connection : connection?.targetRouteName ?? connection?.label;
}

function ConnectionSlot({ label, connection, route, onRouteSelect }: ConnectionSlotProps) {
  const value = getConnectionLabel(connection);

  return (
    <div className={`connection-slot connection-slot--${label.toLowerCase()} ${value ? "" : "is-empty"}`}>
      <span>{label}</span>
      {route ? (
        <button className="connection-route-button" type="button" onClick={() => onRouteSelect(route)}>
          {value}
        </button>
      ) : (
        <strong>{value ?? "No direct link"}</strong>
      )}
    </div>
  );
}

function findConnectedRoute(region: RegionRouteGroup, connection: RouteConnection | undefined): RouteEncounterGroup | undefined {
  const connectionName = getConnectionTargetRouteName(connection);

  if (!connectionName) {
    return undefined;
  }

  return region.routes.find((candidateRoute) => candidateRoute.routeKey === makeRouteKey(region.displayName, connectionName));
}

export function RouteMapCard({ region, route, routeMap, onRouteSelect }: RouteMapCardProps) {
  const connections = routeMap?.connections;
  const displayedRouteName = routeMap?.routeName ?? route.displayName;
  const imageUrl =
    routeMap?.hasMapImage === false
      ? undefined
      : routeMap?.imageUrl ?? toLocalRouteMapImagePath(route.regionName, displayedRouteName);
  const animatedImageUrl =
    routeMap?.hasMapImage === false
      ? undefined
      : routeMap?.animatedImageUrl ?? toLocalAnimatedRouteMapImagePath(route.regionName, displayedRouteName);
  const primaryImageUrl = animatedImageUrl ?? imageUrl;
  const versionedImageUrl = primaryImageUrl ? `${primaryImageUrl}?v=${routeMapAssetVersion}` : undefined;
  const fallbackImageUrl = imageUrl ? `${imageUrl}?v=${routeMapAssetVersion}` : undefined;
  const imageAlt = routeMap?.imageAlt ?? `Location of ${route.displayName} in ${route.regionName}`;

  return (
    <section className="route-map-card">
      <div className="route-map-section">
        <h2>Connecting locations</h2>
        {connections ? (
          <div className="connection-diagram" aria-label={`Connecting locations for ${displayedRouteName}`}>
            <ConnectionSlot
              label="North"
              connection={connections.north}
              route={findConnectedRoute(region, connections.north)}
              onRouteSelect={onRouteSelect}
            />
            <ConnectionSlot
              label="West"
              connection={connections.west}
              route={findConnectedRoute(region, connections.west)}
              onRouteSelect={onRouteSelect}
            />
            <div className="connection-center">{displayedRouteName}</div>
            <ConnectionSlot
              label="East"
              connection={connections.east}
              route={findConnectedRoute(region, connections.east)}
              onRouteSelect={onRouteSelect}
            />
            <ConnectionSlot
              label="South"
              connection={connections.south}
              route={findConnectedRoute(region, connections.south)}
              onRouteSelect={onRouteSelect}
            />
          </div>
        ) : (
          <p className="route-map-empty">Connections are not configured for this route yet.</p>
        )}
      </div>

      <div className="route-map-section">
        <h2>Location</h2>
        {versionedImageUrl ? (
          <figure className="route-location-figure">
            <img
              src={versionedImageUrl}
              alt={imageAlt}
              onError={(event) => {
                const fallbackUrl = fallbackImageUrl ? new URL(fallbackImageUrl, window.location.href).href : undefined;

                if (fallbackUrl && fallbackImageUrl && event.currentTarget.src !== fallbackUrl) {
                  event.currentTarget.src = fallbackImageUrl;
                }
              }}
            />
          </figure>
        ) : (
          <div className="route-map-placeholder">
            <strong>{route.displayName}</strong>
            <span>Map image can be added in routeMaps.ts</span>
          </div>
        )}
        {routeMap?.sourceUrl ? (
          <a className="route-source-link" href={routeMap.sourceUrl} target="_blank" rel="noreferrer">
            Source
          </a>
        ) : null}
      </div>
    </section>
  );
}
