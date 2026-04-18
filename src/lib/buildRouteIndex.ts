import type {
  EncounterFilters,
  LocationAreaEncounter,
  EvYield,
  EvYieldStat,
  PokemonAbilitySlot,
  PokemonEncounter,
  PokemonJsonRecord,
  RegionRouteGroup,
  RouteEncounterGroup,
  RouteIndex,
  TimeOfDay
} from "../types/pokemon";
import { getNonTimeLocationTags, getTimeOfDayTags, sortTimesOfDay } from "./locationMetadata";
import {
  getBaseLocation,
  makeRegionKey,
  makeRouteKey,
  normalizeDisplayLocation,
  normalizeLocationKey
} from "./normalizeLocation";

const DEFAULT_REGION = "Unknown Region";
const DEFAULT_ENCOUNTER_TYPE = "Unknown";
const DEFAULT_RARITY = "Unknown";

function getPokemonSprite(pokemon: PokemonJsonRecord): string | undefined {
  if (!pokemon.sprites) {
    return undefined;
  }

  return (
    pokemon.sprites.front_default ??
    pokemon.sprites.official_artwork ??
    pokemon.sprites.front_shiny ??
    undefined
  );
}

function getCaptureRate(pokemon: PokemonJsonRecord): number | undefined {
  return pokemon.capture_rate ?? pokemon.catch_rate;
}

function getPokemonTypes(pokemon: PokemonJsonRecord): string[] {
  return (pokemon.types ?? [])
    .map((entry) => {
      if (typeof entry === "string") {
        return entry;
      }

      return entry.type?.name ?? entry.name;
    })
    .filter((type): type is string => Boolean(type));
}

function getPokemonAbilities(pokemon: PokemonJsonRecord): string[] {
  return (pokemon.abilities ?? [])
    .filter((entry) => typeof entry === "string" || !entry.is_hidden)
    .map((entry) => {
      if (typeof entry === "string") {
        return entry;
      }

      return entry.ability?.name ?? entry.ability_name ?? entry.name;
    })
    .filter((ability): ability is string => Boolean(ability));
}

function getHiddenPokemonAbilities(pokemon: PokemonJsonRecord): string[] {
  return (pokemon.abilities ?? [])
    .filter((entry): entry is PokemonAbilitySlot => typeof entry !== "string" && Boolean(entry.is_hidden))
    .map((entry) => entry.ability?.name ?? entry.ability_name ?? entry.name)
    .filter((ability): ability is string => Boolean(ability));
}

function isEvYieldStat(statName: string): statName is EvYieldStat {
  return ["hp", "attack", "defense", "special-attack", "special-defense", "speed"].includes(statName);
}

function getPokemonEvYields(pokemon: PokemonJsonRecord): EvYield[] {
  return (pokemon.stats ?? [])
    .filter((stat) => typeof stat.effort === "number" && stat.effort > 0)
    .flatMap((stat) => {
      const statName = stat.stat_name ?? stat.stat?.name ?? "unknown";
      return isEvYieldStat(statName) ? [{ stat: statName, amount: stat.effort as number }] : [];
    });
}

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
    timeOfDay: getTimeOfDayTags(encounter.location),
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
          timeOfDayOptions: []
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
      const matchesEvYield =
        !filters.evYieldStat || encounter.evYields.some((evYield) => evYield.stat === filters.evYieldStat);
      const matchesTime =
        !filters.timeOfDay ||
        (includeUntimedEncounters && encounter.timeOfDay.length === 0) ||
        encounter.timeOfDay.includes(filters.timeOfDay as TimeOfDay);

      return matchesSearch && matchesRegion && matchesType && matchesRarity && matchesEvYield && matchesTime;
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
