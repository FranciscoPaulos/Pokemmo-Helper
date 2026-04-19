import rawHeldItemsData from "./heldItemsData.json";
import type { HeldItemReference, HeldItemsDataFile, PokemonHeldItemsRecord } from "../types/pokemon";

const heldItemsData = rawHeldItemsData as HeldItemsDataFile;

export function getHeldItemsDataFile(): HeldItemsDataFile {
  return heldItemsData;
}

export function getHeldItemsRecordByPokemonId(
  pokemonId: number | string | undefined
): PokemonHeldItemsRecord | undefined {
  if (pokemonId === undefined || pokemonId === "") {
    return undefined;
  }

  return heldItemsData.pokemon[`${pokemonId}`];
}

export function getHeldItemsForPokemon(pokemonId: number | string | undefined): HeldItemReference[] {
  return getHeldItemsRecordByPokemonId(pokemonId)?.held_items ?? [];
}
