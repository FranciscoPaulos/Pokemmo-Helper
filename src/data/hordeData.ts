import rawHordeData from "./hordeData.json";
import { getBaseLocation, normalizeDisplayLocation, normalizeLocationKey } from "../lib/normalizeLocation";
import type { LocationAreaEncounter } from "../types/pokemon";

export type HordeSize = 3 | 5;

interface HordePokemonEntry {
  pokemon_text: string;
  pokemon_names: string[];
  horde_size: HordeSize;
  ev_yield_text?: string[];
  notes?: string;
}

interface HordeLocationEntry {
  location: string;
  default_horde_size: HordeSize;
  notes?: string;
  encounters: HordePokemonEntry[];
}

interface HordeDataFile {
  generated_at: string;
  source: string;
  location_count: number;
  encounter_count: number;
  regions: Record<string, HordeLocationEntry[]>;
}

const hordeData = rawHordeData as HordeDataFile;

function normalizePokemonKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/[♀]/g, "f")
    .replace(/[♂]/g, "m")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, "-");
}

function isSameLocation(firstLocation: string, secondLocation: string): boolean {
  const firstKey = normalizeLocationKey(firstLocation);
  const secondKey = normalizeLocationKey(secondLocation);

  return firstKey === secondKey || firstKey.startsWith(`${secondKey}-`) || secondKey.startsWith(`${firstKey}-`);
}

function findLocationEntry(regionName: string, location: string): HordeLocationEntry | undefined {
  const displayRegion = normalizeDisplayLocation(regionName);
  const regionEntries = hordeData.regions[displayRegion] ?? [];
  const baseLocation = getBaseLocation(location);

  return regionEntries.find((entry) => isSameLocation(entry.location, baseLocation));
}

function findPokemonEntry(locationEntry: HordeLocationEntry, pokemonName: string): HordePokemonEntry | undefined {
  const pokemonKey = normalizePokemonKey(pokemonName);

  return locationEntry.encounters.find((entry) =>
    entry.pokemon_names.some((entryName) => normalizePokemonKey(entryName) === pokemonKey)
  );
}

export function getHordeSizeForEncounter(
  pokemonName: string,
  encounter: LocationAreaEncounter
): HordeSize | undefined {
  if (`${encounter.rarity ?? ""}`.toLowerCase() !== "horde") {
    return undefined;
  }

  const regionName = `${encounter.region_name ?? ""}`;
  const locationEntry = findLocationEntry(regionName, encounter.location);

  if (!locationEntry) {
    return undefined;
  }

  return findPokemonEntry(locationEntry, pokemonName)?.horde_size ?? locationEntry.default_horde_size;
}

export function getHordeDataSource(): string {
  return hordeData.source;
}
