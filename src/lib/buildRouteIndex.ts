import type {
  EncounterFilters,
  LocationAreaEncounter,
  PokemonEncounter,
  PokemonJsonRecord,
  RegionRouteGroup,
  RouteEncounterGroup,
  RouteIndex,
  Season,
  TimeOfDay
} from "../types/pokemon";
import { getHeldItemsForPokemon } from "../data/heldItemsData";
import { getHordeSizeForEncounter } from "../data/hordeData";
import { getNonTimeLocationTags, getSeasonTags, getTimeOfDayTags, sortSeasons, sortTimesOfDay } from "./locationMetadata";
import {
  getBaseLocation,
  makeRegionKey,
  makeRouteKey,
  normalizeDisplayLocation,
  normalizeLocationKey
} from "./normalizeLocation";
import {
  getCaptureRate,
  getHiddenPokemonAbilities,
  getPokemonAbilities,
  getPokemonEvYields,
  getPokemonSprite,
  getPokemonTypes
} from "./pokemonFields";

const DEFAULT_REGION = "Unknown Region";
const DEFAULT_ENCOUNTER_TYPE = "Unknown";
const DEFAULT_RARITY = "Unknown";

function numericRarityValue(rarity: string): number {
  const rarityOrder: Record<string, number> = {
    common: 1,
    uncommon: 2,
    rare: 3,
    "very rare": 4,
    "ultra rare": 5,
    special: 6,
    unknown: 99
  };

  const normalized = rarity.toLowerCase();
  const parsed = Number.parseFloat(normalized);

  return rarityOrder[normalized] ?? (Number.isFinite(parsed) ? parsed : 50);
}

function byDisplayName(a: { displayName: string }, b: { displayName: string }): number {
  return a.displayName.localeCompare(b.displayName, undefined, { numeric: true });
}

function buildEncounter(pokemon: PokemonJsonRecord, encounter: LocationAreaEncounter): PokemonEncounter {
  const regionName = normalizeDisplayLocation(encounter.region_name ?? DEFAULT_REGION);
  const location = normalizeDisplayLocation(getBaseLocation(encounter.location));

  return {
    pokemonId: pokemon.id,
    name: pokemon.name,
    spriteUrl: getPokemonSprite(pokemon),
    captureRate: getCaptureRate(pokemon),
    types: getPokemonTypes(pokemon),
    abilities: getPokemonAbilities(pokemon),
    hiddenAbilities: getHiddenPokemonAbilities(pokemon),
    evYields: getPokemonEvYields(pokemon),
    shinyTier: pokemon.shiny_tier,
    shinyPoints: pokemon.shiny_points,
    pvp: pokemon.pvp,
    regionName,
    regionId: encounter.region_id,
    location,
    rawLocation: encounter.location,
    normalizedLocation: normalizeLocationKey(getBaseLocation(encounter.location)),
    encounterType: `${encounter.type ?? DEFAULT_ENCOUNTER_TYPE}`,
    minLevel: encounter.min_level,
    maxLevel: encounter.max_level,
    rarity: `${encounter.rarity ?? DEFAULT_RARITY}`,
    hordeSize: getHordeSizeForEncounter(pokemon.name, encounter),
    timeOfDay: getTimeOfDayTags(encounter.location),
    seasons: getSeasonTags(encounter.location),
    locationTags: getNonTimeLocationTags(encounter.location),
    rawPokemon: pokemon,
    rawEncounter: encounter
  };
}

export function buildRouteIndex(pokemonRecords: PokemonJsonRecord[]): RouteIndex {
  const regionByKey: Record<string, RegionRouteGroup> = {};
  const routeByKey: Record<string, RouteEncounterGroup> = {};

  for (const pokemon of pokemonRecords) {
    for (const rawEncounter of pokemon.location_area_encounters ?? []) {
      if (!rawEncounter.location) {
        continue;
      }

      const encounter = buildEncounter(pokemon, rawEncounter);
      const regionKey = makeRegionKey(encounter.regionName, encounter.regionId);
      const routeKey = makeRouteKey(encounter.regionName, encounter.location);

      if (!regionByKey[regionKey]) {
        regionByKey[regionKey] = {
          regionKey,
          displayName: encounter.regionName,
          regionId: encounter.regionId,
          routes: []
        };
      }

      if (!routeByKey[routeKey]) {
        routeByKey[routeKey] = {
          routeKey,
          displayName: encounter.location,
          regionName: encounter.regionName,
          regionId: encounter.regionId,
          encounters: [],
          encounterTypes: [],
          rarities: [],
          timeOfDayOptions: [],
          seasonOptions: []
        };
        regionByKey[regionKey].routes.push(routeByKey[routeKey]);
      }

      routeByKey[routeKey].encounters.push(encounter);
    }
  }

  for (const region of Object.values(regionByKey)) {
    region.routes.sort(byDisplayName);

    for (const route of region.routes) {
      route.encounters.sort((a, b) => a.name.localeCompare(b.name));
      route.encounterTypes = Array.from(new Set(route.encounters.map((encounter) => encounter.encounterType))).sort();
      route.rarities = Array.from(new Set(route.encounters.map((encounter) => encounter.rarity))).sort(
        (a, b) => numericRarityValue(a) - numericRarityValue(b)
      );
      route.timeOfDayOptions = sortTimesOfDay(route.encounters.flatMap((encounter) => encounter.timeOfDay));
      route.seasonOptions = sortSeasons(route.encounters.flatMap((encounter) => encounter.seasons));

      const levels = route.encounters.flatMap((encounter) => [encounter.minLevel, encounter.maxLevel]).filter(
        (level): level is number => typeof level === "number"
      );

      route.minLevel = levels.length ? Math.min(...levels) : undefined;
      route.maxLevel = levels.length ? Math.max(...levels) : undefined;
    }
  }

  return {
    regions: Object.values(regionByKey).sort(byDisplayName),
    regionByKey,
    routeByKey
  };
}

export function filterAndSortEncounters(
  encounters: PokemonEncounter[],
  filters: EncounterFilters,
  options: { includeUntimedEncounters?: boolean; includeRegionFilter?: boolean } = {}
): PokemonEncounter[] {
  const search = filters.search.trim().toLowerCase();
  const includeUntimedEncounters = options.includeUntimedEncounters ?? true;
  const includeRegionFilter = options.includeRegionFilter ?? false;

  return encounters
    .filter((encounter) => {
      const matchesSearch = !search || encounter.name.toLowerCase().includes(search);
      const matchesRegion =
        !includeRegionFilter || filters.regionNames.length === 0 || filters.regionNames.includes(encounter.regionName);
      const matchesType = !filters.encounterType || encounter.encounterType === filters.encounterType;
      const matchesRarity = !filters.rarity || encounter.rarity === filters.rarity;
      const matchesHordeSize = !filters.hordeSize || `${encounter.hordeSize ?? ""}` === filters.hordeSize;
      const matchesEvYield =
        !filters.evYieldStat || encounter.evYields.some((evYield) => evYield.stat === filters.evYieldStat);
      const matchesAbility =
        !filters.abilityName ||
        [...encounter.abilities, ...encounter.hiddenAbilities].some((ability) => ability === filters.abilityName);
      const matchesHeldItem =
        !filters.heldItemId ||
        getHeldItemsForPokemon(encounter.pokemonId).some((heldItem) => `${heldItem.id}` === filters.heldItemId);
      const matchesMove =
        !filters.moveId || encounter.rawPokemon.moves?.some((move) => `${move.id}` === filters.moveId);
      const matchesTime =
        !filters.timeOfDay ||
        (includeUntimedEncounters && encounter.timeOfDay.length === 0) ||
        encounter.timeOfDay.includes(filters.timeOfDay as TimeOfDay);
      const matchesSeason =
        !filters.season ||
        (includeUntimedEncounters && encounter.seasons.length === 0) ||
        encounter.seasons.includes(filters.season as Season);

      return (
        matchesSearch &&
        matchesRegion &&
        matchesType &&
        matchesRarity &&
        matchesHordeSize &&
        matchesEvYield &&
        matchesAbility &&
        matchesHeldItem &&
        matchesMove &&
        matchesTime &&
        matchesSeason
      );
    })
    .sort((a, b) => {
      const direction = filters.sortDirection === "asc" ? 1 : -1;

      if (filters.sortKey === "captureRate") {
        return ((a.captureRate ?? Number.MAX_SAFE_INTEGER) - (b.captureRate ?? Number.MAX_SAFE_INTEGER)) * direction;
      }

      if (filters.sortKey === "level") {
        return ((a.minLevel ?? Number.MAX_SAFE_INTEGER) - (b.minLevel ?? Number.MAX_SAFE_INTEGER)) * direction;
      }

      if (filters.sortKey === "rarity") {
        return (numericRarityValue(a.rarity) - numericRarityValue(b.rarity)) * direction;
      }

      if (filters.sortKey === "pokedexNumber") {
        const numberDifference =
          ((a.pokemonId ?? Number.MAX_SAFE_INTEGER) - (b.pokemonId ?? Number.MAX_SAFE_INTEGER)) * direction;

        return numberDifference || a.name.localeCompare(b.name);
      }

      return a.name.localeCompare(b.name) * direction;
    });
}
