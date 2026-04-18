const LOCATION_WORD_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bpok[eé]mon\b/gi, "Pokemon"],
  [/\bmt\.?\s*/gi, "Mount "],
  [/\brt[.]?\b/gi, "Route"]
];

const LOCATION_TAG_PATTERN = /\(([^)]+)\)/g;

export function toTitleCase(value: string): string {
  return value
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function getBaseLocation(value: string): string {
  return value.replace(LOCATION_TAG_PATTERN, "").replace(/\s+/g, " ").trim();
}

export function getLocationTags(value: string): string[] {
  const tags: string[] = [];
  const matches = value.matchAll(LOCATION_TAG_PATTERN);

  for (const match of matches) {
    tags.push(
      ...match[1]
        .split("/")
        .map((tag) => tag.trim())
        .filter(Boolean)
    );
  }

  return tags;
}

export function normalizeLocationKey(value: string): string {
  const cleaned = LOCATION_WORD_REPLACEMENTS.reduce(
    (current, [pattern, replacement]) => current.replace(pattern, replacement),
    getBaseLocation(value)
  );

  return cleaned
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['']/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

export function normalizeDisplayLocation(value: string): string {
  const cleaned = LOCATION_WORD_REPLACEMENTS.reduce(
    (current, [pattern, replacement]) => current.replace(pattern, replacement),
    getBaseLocation(value).replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim()
  );

  return toTitleCase(cleaned);
}

export function makeRouteKey(regionName: string, location: string): string {
  return `${normalizeLocationKey(regionName)}:${normalizeLocationKey(location)}`;
}

export function makeRegionKey(regionName: string, regionId?: number | string): string {
  const idPart = regionId === undefined || regionId === null ? "" : `${regionId}`;
  return idPart ? `${normalizeLocationKey(regionName)}-${idPart}` : normalizeLocationKey(regionName);
}
