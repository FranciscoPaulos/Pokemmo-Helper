import type { EvYield, EvYieldStat } from "../../types/pokemon";

export function formatPokemonName(name: string): string {
  return name
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatAbilityName(name: string): string {
  return formatPokemonName(name);
}

export function formatAbilityList(abilities: string[], fallback = "Unknown"): string {
  if (!abilities.length) {
    return fallback;
  }

  return abilities.map(formatAbilityName).join(", ");
}

export function formatStatName(name: EvYieldStat | string): string {
  const statLabels: Record<string, string> = {
    hp: "HP",
    attack: "Attack",
    defense: "Defense",
    "special-attack": "Sp. Atk",
    "special-defense": "Sp. Def",
    speed: "Speed"
  };

  return statLabels[name] ?? formatPokemonName(name);
}

export function formatEvYieldList(evYields: EvYield[], fallback = "None"): string {
  if (!evYields.length) {
    return fallback;
  }

  return evYields
    .map((evYield) => `${evYield.amount} ${formatStatName(evYield.stat)}`)
    .join(", ");
}

export function formatValue(value: unknown, fallback = "Unknown"): string {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  return `${value}`;
}
