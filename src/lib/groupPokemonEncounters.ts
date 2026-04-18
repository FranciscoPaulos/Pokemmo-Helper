import type { PokemonEncounter, PokemonEncounterGroup, TimeOfDay } from "../types/pokemon";
import { sortTimesOfDay } from "./locationMetadata";

const regionOrder = ["Kanto", "Johto", "Hoenn", "Sinnoh", "Unova"];

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

function getRegionSortValue(regionName: string): number {
  const index = regionOrder.findIndex((region) => region.toLowerCase() === regionName.toLowerCase());

  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

function getGroupKey(encounter: PokemonEncounter): string {
  return encounter.pokemonId ? `${encounter.pokemonId}` : encounter.name.toLowerCase();
}

function groupRoutesByRegion(encounters: PokemonEncounter[]): PokemonEncounterGroup["routeRegions"] {
  const routeNamesByRegion = new Map<string, string[]>();

  for (const encounter of encounters) {
    const routeNames = routeNamesByRegion.get(encounter.regionName) ?? [];

    routeNames.push(encounter.location);
    routeNamesByRegion.set(encounter.regionName, routeNames);
  }

  return Array.from(routeNamesByRegion.entries())
    .map(([regionName, routeNames]) => ({
      regionName,
      routeNames: uniqueSorted(routeNames)
    }))
    .sort((a, b) => {
      const orderDifference = getRegionSortValue(a.regionName) - getRegionSortValue(b.regionName);

      return orderDifference || a.regionName.localeCompare(b.regionName);
    });
}

export function groupPokemonEncounters(encounters: PokemonEncounter[]): PokemonEncounterGroup[] {
  const groupByPokemon = new Map<string, PokemonEncounter[]>();

  for (const encounter of encounters) {
    const groupKey = getGroupKey(encounter);
    const existing = groupByPokemon.get(groupKey) ?? [];

    existing.push(encounter);
    groupByPokemon.set(groupKey, existing);
  }

  return Array.from(groupByPokemon.entries()).map(([groupKey, groupedEncounters]) => {
    const levels = groupedEncounters
      .flatMap((encounter) => [encounter.minLevel, encounter.maxLevel])
      .filter((level): level is number => typeof level === "number");
    const timeOfDay = sortTimesOfDay(groupedEncounters.flatMap((encounter) => encounter.timeOfDay as TimeOfDay[]));

    return {
      groupKey,
      pokemon: groupedEncounters[0],
      encounters: groupedEncounters,
      encounterTypes: uniqueSorted(groupedEncounters.map((encounter) => encounter.encounterType)),
      rarities: uniqueSorted(groupedEncounters.map((encounter) => encounter.rarity)),
      routeNames: uniqueSorted(groupedEncounters.map((encounter) => `${encounter.regionName}: ${encounter.location}`)),
      routeRegions: groupRoutesByRegion(groupedEncounters),
      timeOfDay,
      minLevel: levels.length ? Math.min(...levels) : undefined,
      maxLevel: levels.length ? Math.max(...levels) : undefined
    };
  });
}
