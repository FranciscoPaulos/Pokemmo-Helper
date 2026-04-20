import { useMemo, useState } from "react";
import type {
  EncounterFilters,
  EvYieldStat,
  PokemonEncounter,
  PokemonMoveReference,
  RegionRouteGroup,
  RouteEncounterGroup,
  Season
} from "../types/pokemon";
import { getHeldItemsForPokemon } from "../data/heldItemsData";
import { formatAbilityName } from "../features/pokemon/formatPokemon";
import { filterAndSortEncounters } from "../lib/buildRouteIndex";
import { groupPokemonEncounters } from "../lib/groupPokemonEncounters";
import { sortSeasons, sortTimesOfDay } from "../lib/locationMetadata";
import { EmptyState } from "./EmptyState";
import { FiltersToolbar } from "./FiltersToolbar";
import { OptionToggle } from "./OptionToggle";
import { PokemonEncounterCard } from "./PokemonEncounterCard";
import { TimeOfDayToggle } from "./TimeOfDayToggle";

interface RouteDetailsProps {
  regions: RegionRouteGroup[];
  region: RegionRouteGroup | undefined;
  route: RouteEncounterGroup | undefined;
  filters: EncounterFilters;
  onClearRoute: () => void;
  onFiltersChange: (filters: EncounterFilters) => void;
  onFiltersReset: () => void;
}

interface FilterOption {
  value: string;
  label: string;
}

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

function getLevels(encounters: PokemonEncounter[]): Array<number> {
  return encounters
    .flatMap((encounter) => [encounter.minLevel, encounter.maxLevel])
    .filter((level): level is number => typeof level === "number");
}

function sortEvYieldStats(stats: EvYieldStat[]): EvYieldStat[] {
  const order: EvYieldStat[] = ["hp", "attack", "defense", "special-attack", "special-defense", "speed"];
  const statSet = new Set(stats);

  return order.filter((stat) => statSet.has(stat));
}

function uniqueOptions(options: FilterOption[]): FilterOption[] {
  const optionByValue = new Map<string, FilterOption>();

  for (const option of options) {
    if (!optionByValue.has(option.value)) {
      optionByValue.set(option.value, option);
    }
  }

  return Array.from(optionByValue.values()).sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));
}

function getMoveOptions(encounters: PokemonEncounter[]): FilterOption[] {
  return uniqueOptions(
    encounters.flatMap((encounter) =>
      (encounter.rawPokemon.moves ?? [])
        .filter((move): move is PokemonMoveReference & { id: number } => typeof move.id === "number")
        .map((move) => ({
          value: `${move.id}`,
          label: formatAbilityName(move.name ?? `Move ${move.id}`)
        }))
    )
  );
}

function getHeldItemOptions(encounters: PokemonEncounter[]): FilterOption[] {
  return uniqueOptions(
    encounters.flatMap((encounter) =>
      getHeldItemsForPokemon(encounter.pokemonId).map((heldItem) => ({
        value: `${heldItem.id}`,
        label: heldItem.name
      }))
    )
  );
}

function getAbilityOptions(encounters: PokemonEncounter[]): FilterOption[] {
  return uniqueOptions(
    encounters.flatMap((encounter) =>
      [...encounter.abilities, ...encounter.hiddenAbilities].map((ability) => ({
        value: ability,
        label: formatAbilityName(ability)
      }))
    )
  );
}

export function RouteDetails({
  regions,
  region,
  route,
  filters,
  onClearRoute,
  onFiltersChange,
  onFiltersReset
}: RouteDetailsProps) {
  const [areFiltersOpen, setAreFiltersOpen] = useState(true);
  const isGlobalSearch = !route;
  const sourceEncounters = useMemo(
    () =>
      route?.encounters ??
      regions.flatMap((searchRegion) => searchRegion.routes.flatMap((regionRoute) => regionRoute.encounters)),
    [regions, route]
  );
  const encounters = useMemo(
    () =>
      filterAndSortEncounters(sourceEncounters, filters, {
        includeUntimedEncounters: Boolean(route),
        includeRegionFilter: isGlobalSearch
      }),
    [filters, isGlobalSearch, route, sourceEncounters]
  );
  const encounterGroups = useMemo(() => groupPokemonEncounters(encounters), [encounters]);
  const levels = useMemo(() => getLevels(sourceEncounters), [sourceEncounters]);
  const encounterTypes = useMemo(
    () => uniqueSorted(sourceEncounters.map((encounter) => encounter.encounterType)),
    [sourceEncounters]
  );
  const rarities = useMemo(() => uniqueSorted(sourceEncounters.map((encounter) => encounter.rarity)), [sourceEncounters]);
  const hordeSizeOptions = useMemo(
    () =>
      Array.from(
        new Set(sourceEncounters.map((encounter) => encounter.hordeSize).filter((size): size is 3 | 5 => Boolean(size)))
      ).sort((a, b) => a - b),
    [sourceEncounters]
  );
  const evYieldStats = useMemo(
    () => sortEvYieldStats(sourceEncounters.flatMap((encounter) => encounter.evYields.map((evYield) => evYield.stat))),
    [sourceEncounters]
  );
  const abilityOptions = useMemo(() => getAbilityOptions(sourceEncounters), [sourceEncounters]);
  const heldItemOptions = useMemo(() => getHeldItemOptions(sourceEncounters), [sourceEncounters]);
  const moveOptions = useMemo(() => getMoveOptions(sourceEncounters), [sourceEncounters]);
  const timeOfDayOptions = useMemo(
    () => sortTimesOfDay(sourceEncounters.flatMap((encounter) => encounter.timeOfDay)),
    [sourceEncounters]
  );
  const seasonOptions = useMemo(
    () => sortSeasons(sourceEncounters.flatMap((encounter) => encounter.seasons)),
    [sourceEncounters]
  );
  const minLevel = route?.minLevel ?? (levels.length ? Math.min(...levels) : undefined);
  const maxLevel = route?.maxLevel ?? (levels.length ? Math.max(...levels) : undefined);
  const regionOptions = useMemo(() => regions.map((searchRegion) => searchRegion.displayName), [regions]);
  const panelTitle = route?.displayName ?? "All routes";
  const eyebrow = route ? "Selected route" : "Global search";

  if (!region && !regions.length) {
    return <EmptyState title="Choose a region" message="Pick a region to search its available Pokemon." />;
  }

  if (route?.isNavigationOnly) {
    return (
      <EmptyState
        title={route.displayName}
        message="This location is available for map navigation, but it has no encounter data in the current JSON."
      />
    );
  }

  return (
    <div className="route-details">
      <header className="route-details__header">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{panelTitle}</h2>
          {timeOfDayOptions.length || seasonOptions.length ? (
            <p className="route-subtitle">Time or season-specific encounters available</p>
          ) : null}
        </div>
        <div className="route-details__actions">
          {route ? (
            <button className="route-mode-button" type="button" onClick={onClearRoute}>
              All routes
            </button>
          ) : null}
          <span>
            Lv. {minLevel ?? "?"}-{maxLevel ?? "?"}
          </span>
        </div>
      </header>

      <section className="search-parameters">
        <button
          className="search-parameters__toggle"
          type="button"
          aria-expanded={areFiltersOpen}
          onClick={() => setAreFiltersOpen((currentValue) => !currentValue)}
        >
          <span>Search parameters</span>
          <span>{areFiltersOpen ? "Collapse" : "Expand"}</span>
        </button>

        {areFiltersOpen ? (
          <div className="search-parameters__body">
            <TimeOfDayToggle
              options={timeOfDayOptions}
              selectedTime={filters.timeOfDay}
              onChange={(timeOfDay) => onFiltersChange({ ...filters, timeOfDay })}
            />

            <OptionToggle<Season>
              label="Season"
              options={seasonOptions}
              selectedValue={filters.season}
              onChange={(season) => onFiltersChange({ ...filters, season })}
            />

            <FiltersToolbar
              filters={filters}
              encounterTypes={encounterTypes}
              rarities={rarities}
              hordeSizeOptions={hordeSizeOptions}
              evYieldStats={evYieldStats}
              abilityOptions={abilityOptions}
              heldItemOptions={heldItemOptions}
              moveOptions={moveOptions}
              regionOptions={regionOptions}
              showRegionFilter={isGlobalSearch}
              onChange={onFiltersChange}
              onReset={onFiltersReset}
            />
          </div>
        ) : null}
      </section>

      <div className="encounter-count">
        {encounterGroups.length} Pokemon
      </div>

      {encounterGroups.length ? (
        <div className="encounter-list">
          {encounterGroups.map((encounterGroup) => (
            <PokemonEncounterCard
              key={encounterGroup.groupKey}
              encounterGroup={encounterGroup}
              showRoutes={!route}
            />
          ))}
        </div>
      ) : (
        <EmptyState title="No encounters found" message="Adjust search, encounter type, or rarity filters." />
      )}
    </div>
  );
}
