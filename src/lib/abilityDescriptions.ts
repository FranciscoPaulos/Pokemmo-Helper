interface AbilityEffectEntry {
  effect?: string;
  short_effect?: string;
  language: {
    name: string;
  };
}

interface AbilityApiResponse {
  effect_entries?: AbilityEffectEntry[];
}

const descriptionCache = new Map<string, string>();

function toAbilitySlug(name: string): string {
  return name.trim().toLowerCase().replace(/[_\s]+/g, "-");
}

function getEnglishDescription(data: AbilityApiResponse): string | undefined {
  const englishEntry = data.effect_entries?.find((entry) => entry.language.name === "en");

  return englishEntry?.short_effect ?? englishEntry?.effect;
}

export async function getAbilityDescription(abilityName: string): Promise<string> {
  const slug = toAbilitySlug(abilityName);
  const cachedDescription = descriptionCache.get(slug);

  if (cachedDescription) {
    return cachedDescription;
  }

  const response = await fetch(`https://pokeapi.co/api/v2/ability/${slug}`);

  if (!response.ok) {
    throw new Error(`Unable to load ${abilityName}.`);
  }

  const data = (await response.json()) as AbilityApiResponse;
  const description = getEnglishDescription(data) ?? "No description available.";

  descriptionCache.set(slug, description);
  return description;
}
