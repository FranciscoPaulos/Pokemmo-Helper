import { useEffect, useMemo, useState } from "react";
import { AppShell } from "./components/AppShell";
import { EmptyState } from "./components/EmptyState";
import { MapViewer } from "./components/MapViewer";
import { RegionSelector } from "./components/RegionSelector";
import { RouteDetails } from "./components/RouteDetails";
import { RouteList } from "./components/RouteList";
import { ThemeToggle } from "./components/ThemeToggle";
import { getPokemonRecords } from "./data/pokemonData";
import { routeHotspotsByRegion } from "./data/routeHotspots";
import { routeMapsByRouteKey } from "./data/routeMaps";
import { getInitialRegion, getInitialRoute, sortRegionsByGeneration } from "./features/routes/routeSelection";
import { buildRouteIndex } from "./lib/buildRouteIndex";
import { normalizeLocationKey } from "./lib/normalizeLocation";
import type { EncounterFilters, RegionRouteGroup, RouteEncounterGroup } from "./types/pokemon";

const defaultFilters: EncounterFilters = {
  search: "",
  regionNames: [],
  encounterType: "",
  rarity: "",
  evYieldStat: "",
  abilityName: "",
  heldItemId: "",
  moveId: "",
  timeOfDay: "",
  sortKey: "pokedexNumber",
  sortDirection: "asc"
};

const themeStorageKey = "pokemmo-theme";

function getStoredTheme(): "light" | "dark" {
  return window.localStorage.getItem(themeStorageKey) === "dark" ? "dark" : "light";
}

function App() {
  const [selectedRegion, setSelectedRegion] = useState<RegionRouteGroup | undefined>();
  const [selectedRoute, setSelectedRoute] = useState<RouteEncounterGroup | undefined>();
  const [filters, setFilters] = useState<EncounterFilters>(defaultFilters);
  const [theme, setTheme] = useState<"light" | "dark">(() => getStoredTheme());

  const dataState = useMemo(() => {
    try {
      const baseRouteIndex = buildRouteIndex(getPokemonRecords());

      for (const region of baseRouteIndex.regions) {
        for (const routeMap of Object.values(routeMapsByRouteKey)) {
          if (routeMap.regionName !== region.displayName || baseRouteIndex.routeByKey[routeMap.routeKey]) {
            continue;
          }

          const navigationRoute: RouteEncounterGroup = {
            routeKey: routeMap.routeKey,
            displayName: routeMap.routeName,
            regionName: region.displayName,
            regionId: region.regionId,
            isNavigationOnly: true,
            mapRouteKey: routeMap.routeKey,
            encounters: [],
            encounterTypes: [],
            rarities: [],
            timeOfDayOptions: []
          };

          region.routes.push(navigationRoute);
          baseRouteIndex.routeByKey[routeMap.routeKey] = navigationRoute;
        }

        region.routes.sort((a, b) => a.displayName.localeCompare(b.displayName, undefined, { numeric: true }));
      }

      baseRouteIndex.regions = sortRegionsByGeneration(baseRouteIndex.regions);

      return {
        routeIndex: baseRouteIndex,
        loadError: null
      };
    } catch (error) {
      return {
        routeIndex: buildRouteIndex([]),
        loadError: error instanceof Error ? error.message : "Unable to parse Pokemon encounter data."
      };
    }
  }, []);

  const { routeIndex, loadError } = dataState;

  useEffect(() => {
    const initialRegion = getInitialRegion(routeIndex.regions);
    setSelectedRegion(initialRegion);
    setSelectedRoute(getInitialRoute(initialRegion));
  }, [routeIndex]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(themeStorageKey, theme);
  }, [theme]);

  function handleRegionSelect(region: RegionRouteGroup) {
    setSelectedRegion(region);
    setSelectedRoute(getInitialRoute(region));
  }

  function handleRouteSelect(route: RouteEncounterGroup) {
    setSelectedRoute((currentRoute) => (currentRoute?.routeKey === route.routeKey ? undefined : route));
  }

  function handleRouteClear() {
    setSelectedRoute(undefined);
  }

  const mapConfig = selectedRegion
    ? routeHotspotsByRegion[normalizeLocationKey(selectedRegion.displayName)]
    : undefined;

  if (loadError) {
    return <EmptyState title="Data error" message={loadError} />;
  }

  return (
    <AppShell
      sidebar={
        <>
          <div className="brand-block">
            <span>PokeMMO</span>
            <h1>Encounter Companion</h1>
            <ThemeToggle
              isDarkMode={theme === "dark"}
              onToggle={() => setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"))}
            />
          </div>

          <RegionSelector
            regions={routeIndex.regions}
            selectedRegionKey={selectedRegion?.regionKey}
            onRegionSelect={handleRegionSelect}
          />

          <RouteList
            region={selectedRegion}
            selectedRouteKey={selectedRoute?.routeKey}
            onRouteClear={handleRouteClear}
            onRouteSelect={handleRouteSelect}
          />
        </>
      }
      map={
        <MapViewer
          region={selectedRegion}
          selectedRoute={selectedRoute}
          mapConfig={mapConfig}
          onRouteSelect={handleRouteSelect}
        />
      }
      details={
        <RouteDetails
          regions={routeIndex.regions}
          region={selectedRegion}
          route={selectedRoute}
          filters={filters}
          onClearRoute={handleRouteClear}
          onFiltersChange={setFilters}
          onFiltersReset={() => setFilters(defaultFilters)}
        />
      }
    />
  );
}

export default App;
