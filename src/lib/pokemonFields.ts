import type { EvYield, EvYieldStat, PokemonAbilitySlot, PokemonJsonRecord } from "../types/pokemon";

export function getPokemonSprite(pokemon: PokemonJsonRecord): string | undefined {
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

export function getCaptureRate(pokemon: PokemonJsonRecord): number | undefined {
  return pokemon.capture_rate ?? pokemon.catch_rate;
}

export function getPokemonTypes(pokemon: PokemonJsonRecord): string[] {
  return (pokemon.types ?? [])
    .map((entry) => {
      if (typeof entry === "string") {
        return entry;
      }

      return entry.type?.name ?? entry.name;
    })
    .filter((type): type is string => Boolean(type));
}

export function getPokemonAbilities(pokemon: PokemonJsonRecord): string[] {
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

export function getHiddenPokemonAbilities(pokemon: PokemonJsonRecord): string[] {
  return (pokemon.abilities ?? [])
    .filter((entry): entry is PokemonAbilitySlot => typeof entry !== "string" && Boolean(entry.is_hidden))
    .map((entry) => entry.ability?.name ?? entry.ability_name ?? entry.name)
    .filter((ability): ability is string => Boolean(ability));
}

function isEvYieldStat(statName: string): statName is EvYieldStat {
  return ["hp", "attack", "defense", "special-attack", "special-defense", "speed"].includes(statName);
}

export function getPokemonEvYields(pokemon: PokemonJsonRecord): EvYield[] {
  return (pokemon.stats ?? [])
    .filter((stat) => typeof stat.effort === "number" && stat.effort > 0)
    .flatMap((stat) => {
      const statName = stat.stat_name ?? stat.stat?.name ?? "unknown";
      return isEvYieldStat(statName) ? [{ stat: statName, amount: stat.effort as number }] : [];
    });
}
