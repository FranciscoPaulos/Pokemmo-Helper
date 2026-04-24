import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "./components/AppShell";
import { EmptyState } from "./components/EmptyState";
import { MapViewer } from "./components/MapViewer";
import { PokedexPanel } from "./components/PokedexPanel";
import { RegionSelector } from "./components/RegionSelector";
import { RouteDetails } from "./components/RouteDetails";
import { RouteList } from "./components/RouteList";
import { ThemeToggle } from "./components/ThemeToggle";
import { WorldTracker } from "./components/WorldTracker";
import { getPokemonRecords } from "./data/pokemonData";
import { routeHotspotsByRegion } from "./data/routeHotspots";
import { routeMapsByRouteKey } from "./data/routeMaps";
import { getInitialRegion, getInitialRoute, sortRegionsByGeneration } from "./features/routes/routeSelection";
import { buildRouteIndex } from "./lib/buildRouteIndex";
import { trackPageView } from "./lib/analytics";
import { normalizeLocationKey } from "./lib/normalizeLocation";
import type { EncounterFilters, RegionRouteGroup, RouteEncounterGroup } from "./types/pokemon";

type AppMode = "routeMaster" | "pokedex";

const defaultFilters: EncounterFilters = {
  search: "",
  regionNames: [],
  encounterType: "",
  rarity: "",
  hordeSize: "",
  evYieldStat: "",
  abilityName: "",
  heldItemId: "",
  moveIds: [],
  timeOfDay: "",
  season: "",
  sortKey: "pokedexNumber",
  sortDirection: "asc"
};

const themeStorageKey = "pokemmo-theme";

function getStoredTheme(): "light" | "dark" {
  return window.localStorage.getItem(themeStorageKey) === "dark" ? "dark" : "light";
}

function buildAnalyticsPage(appMode: AppMode, region?: RegionRouteGroup, route?: RouteEncounterGroup) {
  if (appMode === "pokedex") {
    return {
      path: "/pokedex",
      title: "PokeMMO Helper - Pokedex"
    };
  }

  const regionSlug = normalizeLocationKey(region?.displayName ?? "all-regions");
  const routeSlug = route ? normalizeLocationKey(route.displayName) : "all-routes";

  return {
    path: `/route-master/${regionSlug}/${routeSlug}`,
    title: route
      ? `PokeMMO Helper - ${region?.displayName ?? "Region"} - ${route.displayName}`
      : `PokeMMO Helper - ${region?.displayName ?? "Region"} - All Routes`
  };
}

function App() {
  const [selectedRegion, setSelectedRegion] = useState<RegionRouteGroup | undefined>();
  const [selectedRoute, setSelectedRoute] = useState<RouteEncounterGroup | undefined>();
  const [filters, setFilters] = useState<EncounterFilters>(defaultFilters);
  const [pokedexFilters, setPokedexFilters] = useState<EncounterFilters>(defaultFilters);
  const [appMode, setAppMode] = useState<AppMode>("routeMaster");
  const [theme, setTheme] = useState<"light" | "dark">(() => getStoredTheme());
  const lastTrackedPageRef = useRef<string>("");

  const dataState = useMemo(() => {
    try {
      const pokemonRecords = getPokemonRecords();
      const baseRouteIndex = buildRouteIndex(pokemonRecords);

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
            timeOfDayOptions: [],
            seasonOptions: []
          };

          region.routes.push(navigationRoute);
          baseRouteIndex.routeByKey[routeMap.routeKey] = navigationRoute;
        }

        region.routes.sort((a, b) => a.displayName.localeCompare(b.displayName, undefined, { numeric: true }));
      }

      baseRouteIndex.regions = sortRegionsByGeneration(baseRouteIndex.regions);

      return {
        routeIndex: baseRouteIndex,
        pokemonRecords,
        loadError: null
      };
    } catch (error) {
      return {
        routeIndex: buildRouteIndex([]),
        pokemonRecords: [],
        loadError: error instanceof Error ? error.message : "Unable to parse Pokemon encounter data."
      };
    }
  }, []);

  const { routeIndex, pokemonRecords, loadError } = dataState;

  useEffect(() => {
    const initialRegion = getInitialRegion(routeIndex.regions);
    setSelectedRegion(initialRegion);
    setSelectedRoute(getInitialRoute(initialRegion));
  }, [routeIndex]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(themeStorageKey, theme);
  }, [theme]);

  useEffect(() => {
    const { path, title } = buildAnalyticsPage(appMode, selectedRegion, selectedRoute);

    if (lastTrackedPageRef.current === path) {
      return;
    }

    document.title = title;
    trackPageView(path, title);
    lastTrackedPageRef.current = path;
  }, [appMode, selectedRegion, selectedRoute]);

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
            <h1>Pokemmo Helper</h1>
            <ThemeToggle
              isDarkMode={theme === "dark"}
              onToggle={() => setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"))}
            />
            <WorldTracker />
          </div>

          <nav className="app-mode-tabs" aria-label="App sections">
            <button
              className={appMode === "routeMaster" ? "is-selected" : ""}
              type="button"
              onClick={() => setAppMode("routeMaster")}
            >
              Route Master
            </button>
            <button
              className={appMode === "pokedex" ? "is-selected" : ""}
              type="button"
              onClick={() => setAppMode("pokedex")}
            >
              Pokedex
            </button>
          </nav>

          {appMode === "routeMaster" ? (
            <>
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
          ) : (
            <div className="sidebar-note">
              <p className="eyebrow">Pokedex</p>
              <p>Search all Pokemon in the local data, including entries without wild encounters.</p>
            </div>
          )}
        </>
      }
      map={
        appMode === "routeMaster" ? (
          <MapViewer
            region={selectedRegion}
            selectedRoute={selectedRoute}
            mapConfig={mapConfig}
            onRouteSelect={handleRouteSelect}
          />
        ) : (
          <div className="map-stage map-stage--empty">
            <p className="eyebrow">Pokedex</p>
            <h1>All Pokemon</h1>
            <p>Use the center panel to search species, abilities, moves, held items, and EV yields.</p>
          </div>
        )
      }
      details={
        appMode === "routeMaster" ? (
          <RouteDetails
            regions={routeIndex.regions}
            region={selectedRegion}
            route={selectedRoute}
            filters={filters}
            onClearRoute={handleRouteClear}
            onFiltersChange={setFilters}
            onFiltersReset={() => setFilters(defaultFilters)}
          />
        ) : (
          <PokedexPanel
            pokemonRecords={pokemonRecords}
            filters={pokedexFilters}
            onFiltersChange={setPokedexFilters}
            onFiltersReset={() => setPokedexFilters(defaultFilters)}
          />
        )
      }
    />
  );
}

export default App;
