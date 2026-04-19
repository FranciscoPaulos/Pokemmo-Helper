import { getHeldItemsForPokemon } from "../../data/heldItemsData";
import type {
  EncounterFilters,
  PokemonEncounter,
  PokemonEncounterGroup,
  PokemonJsonRecord
} from "../../types/pokemon";
import {
  getCaptureRate,
  getHiddenPokemonAbilities,
  getPokemonAbilities,
  getPokemonEvYields,
  getPokemonSprite,
  getPokemonTypes
} from "../../lib/pokemonFields";

function buildPokedexEncounter(pokemon: PokemonJsonRecord): PokemonEncounter {
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
    regionName: "Pokedex",
    regionId: "pokedex",
    location: "Not listed",
    rawLocation: "Not listed",
    normalizedLocation: "not-listed",
    encounterType: pokemon.location_area_encounters?.length ? "Wild" : "Unavailable",
    rarity: pokemon.location_area_encounters?.length ? "Known" : "Unavailable",
    timeOfDay: [],
    locationTags: [],
    rawPokemon: pokemon,
    rawEncounter: {
      region_name: "Pokedex",
      region_id: "pokedex",
      location: "Not listed",
      type: pokemon.location_area_encounters?.length ? "Wild" : "Unavailable",
      rarity: pokemon.location_area_encounters?.length ? "Known" : "Unavailable"
    }
  };
}

function raritySortValue(rarity: string): number {
  const rarityOrder: Record<string, number> = {
    common: 1,
    uncommon: 2,
    rare: 3,
    "very rare": 4,
    "ultra rare": 5,
    special: 6,
    known: 20,
    unavailable: 99,
    unknown: 100
  };
  const normalized = rarity.toLowerCase();
  const parsed = Number.parseFloat(normalized);

  return rarityOrder[normalized] ?? (Number.isFinite(parsed) ? parsed : 50);
}

function getPokedexGroup(pokemon: PokemonJsonRecord): PokemonEncounterGroup {
  const encounter = buildPokedexEncounter(pokemon);
  const levels = (pokemon.location_area_encounters ?? [])
    .flatMap((rawEncounter) => [rawEncounter.min_level, rawEncounter.max_level])
    .filter((level): level is number => typeof level === "number");
  const encounterTypes = Array.from(
    new Set((pokemon.location_area_encounters ?? []).map((rawEncounter) => `${rawEncounter.type ?? "Unknown"}`))
  ).sort();
  const rarities = Array.from(
    new Set((pokemon.location_area_encounters ?? []).map((rawEncounter) => `${rawEncounter.rarity ?? "Unknown"}`))
  ).sort((a, b) => raritySortValue(a) - raritySortValue(b));
  const routeRegionsByName = new Map<string, Set<string>>();

  for (const rawEncounter of pokemon.location_area_encounters ?? []) {
    const regionName = `${rawEncounter.region_name ?? "Unknown"}`;
    const routeNames = routeRegionsByName.get(regionName) ?? new Set<string>();

    routeNames.add(rawEncounter.location);
    routeRegionsByName.set(regionName, routeNames);
  }

  const routeRegions = Array.from(routeRegionsByName.entries()).map(([regionName, routeNames]) => ({
    regionName,
    routeNames: Array.from(routeNames).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  }));

  return {
    groupKey: pokemon.id ? `${pokemon.id}` : pokemon.name.toLowerCase(),
    pokemon: encounter,
    encounters: [encounter],
    encounterTypes: encounterTypes.length ? encounterTypes : [encounter.encounterType],
    rarities: rarities.length ? rarities : [encounter.rarity],
    routeNames: routeRegions.flatMap((routeRegion) =>
      routeRegion.routeNames.map((routeName) => `${routeRegion.regionName}: ${routeName}`)
    ),
    routeRegions,
    timeOfDay: [],
    minLevel: levels.length ? Math.min(...levels) : undefined,
    maxLevel: levels.length ? Math.max(...levels) : undefined
  };
}

export function buildPokedexGroups(pokemonRecords: PokemonJsonRecord[]): PokemonEncounterGroup[] {
  return pokemonRecords.map(getPokedexGroup);
}

export function filterAndSortPokedexGroups(
  groups: PokemonEncounterGroup[],
  filters: EncounterFilters
): PokemonEncounterGroup[] {
  const search = filters.search.trim().toLowerCase();

  return groups
    .filter((group) => {
      const pokemon = group.pokemon;
      const matchesSearch = !search || pokemon.name.toLowerCase().includes(search);
      const matchesEvYield =
        !filters.evYieldStat || pokemon.evYields.some((evYield) => evYield.stat === filters.evYieldStat);
      const matchesAbility =
        !filters.abilityName ||
        [...pokemon.abilities, ...pokemon.hiddenAbilities].some((ability) => ability === filters.abilityName);
      const matchesHeldItem =
        !filters.heldItemId ||
        getHeldItemsForPokemon(pokemon.pokemonId).some((heldItem) => `${heldItem.id}` === filters.heldItemId);
      const matchesMove = !filters.moveId || pokemon.rawPokemon.moves?.some((move) => `${move.id}` === filters.moveId);

      return matchesSearch && matchesEvYield && matchesAbility && matchesHeldItem && matchesMove;
    })
    .sort((a, b) => {
      const direction = filters.sortDirection === "asc" ? 1 : -1;

      if (filters.sortKey === "captureRate") {
        return (
          ((a.pokemon.captureRate ?? Number.MAX_SAFE_INTEGER) -
            (b.pokemon.captureRate ?? Number.MAX_SAFE_INTEGER)) *
          direction
        );
      }

      if (filters.sortKey === "level") {
        return ((a.minLevel ?? Number.MAX_SAFE_INTEGER) - (b.minLevel ?? Number.MAX_SAFE_INTEGER)) * direction;
      }

      if (filters.sortKey === "rarity") {
        return (raritySortValue(a.rarities[0] ?? "Unknown") - raritySortValue(b.rarities[0] ?? "Unknown")) * direction;
      }

      if (filters.sortKey === "pokedexNumber") {
        const numberDifference =
          ((a.pokemon.pokemonId ?? Number.MAX_SAFE_INTEGER) -
            (b.pokemon.pokemonId ?? Number.MAX_SAFE_INTEGER)) *
          direction;

        return numberDifference || a.pokemon.name.localeCompare(b.pokemon.name);
      }

      return a.pokemon.name.localeCompare(b.pokemon.name) * direction;
    });
}
