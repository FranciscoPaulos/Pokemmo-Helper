import rawPokemonData from "../../pokedex json.json";
import type { PokemonJsonDictionary, PokemonJsonRecord } from "../types/pokemon";

function isPokemonDictionary(value: unknown): value is PokemonJsonDictionary {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function withFallbackName(name: string, record: Partial<PokemonJsonRecord>): PokemonJsonRecord {
  return {
    ...record,
    name: record.name ?? name
  } as PokemonJsonRecord;
}

export function getPokemonRecords(): PokemonJsonRecord[] {
  if (Array.isArray(rawPokemonData)) {
    return rawPokemonData as PokemonJsonRecord[];
  }

  if (isPokemonDictionary(rawPokemonData)) {
    return Object.entries(rawPokemonData).map(([name, record]) => withFallbackName(name, record));
  }

  return [];
}
