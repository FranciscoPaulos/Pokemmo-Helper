import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const SOURCE_URL = "https://forums.pokemmo.com/index.php?/topic/108705-2025-all-horde-locations-ev-and-shiny/";
const OUTPUT_FILE = path.resolve("src/data/hordeData.json");
const POKEMON_DATA_FILE = path.resolve("src/data/pokemmoDexData.json");
const REGIONS = ["Kanto", "Hoenn", "Unova", "Sinnoh", "Johto"];
const REGION_SET = new Set(REGIONS);
const LOCATION_LINE_PATTERN = /^(.+?)\s+(?:x|×)(3|5)(?:\s+(.*))?$/i;
const INLINE_HORDE_SIZE_PATTERN = /\b(?:x|×)(3|5)\b/i;
const EV_TEXT_PATTERN = /\b(?:5|10)\s*(?:HP|ATK|DEF|SATK|SDEF|SPEED)\b/gi;
const NON_POKEMON_LINE_PATTERN =
  /^(?:source:|ctrl \+ f|specifications:|water|cave|dark grass|underlined|winter hordes|shiny hunting|ev locations|useful links|note\b|added\b|updated\b|for deciding|keep track|never miss|hit me up|ign:|basculins|tentacrools|peligulls)/i;

function decodeHtmlEntities(value) {
  return value
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, code) => String.fromCharCode(Number.parseInt(code, 16)))
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&gt;/gi, ">")
    .replace(/&lt;/gi, "<")
    .replace(/&quot;/gi, '"')
    .replace(/&#039;/gi, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/\u00a0/g, " ");
}

function cleanText(value) {
  return decodeHtmlEntities(value)
    .replace(/\r/g, "\n")
    .replace(/\t/g, "\n")
    .replace(/[ ]{2,}/g, " ")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function extractJsonLdObjects(html) {
  const scriptPattern = /<script[^>]+type=['"]application\/ld\+json['"][^>]*>([\s\S]*?)<\/script>/gi;
  const objects = [];

  for (const match of html.matchAll(scriptPattern)) {
    try {
      objects.push(JSON.parse(match[1]));
    } catch {
      // Ignore unrelated structured-data snippets that are not strict JSON.
    }
  }

  return objects;
}

function collectTextBlocks(value, blocks = []) {
  if (!value || typeof value !== "object") {
    return blocks;
  }

  if (typeof value.text === "string") {
    blocks.push(value.text);
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectTextBlocks(item, blocks);
    }

    return blocks;
  }

  for (const child of Object.values(value)) {
    collectTextBlocks(child, blocks);
  }

  return blocks;
}

function getGuideLines(jsonLdObjects) {
  const textBlocks = jsonLdObjects
    .flatMap((object) => collectTextBlocks(object))
    .filter((text) => /(?:\bx3\b|\bx5\b|Horde Locations|Route \d+)/i.test(text));

  return textBlocks.flatMap(cleanText);
}

function splitPokemonNames(rawName) {
  const withoutNotes = rawName.replace(/\([^)]*\)/g, " ").replace(/\b(?:F|B|R)\d+\b/gi, " ");

  return withoutNotes
    .split(/\s*\/\s*/)
    .map((name) =>
      name
        .replace(/\b(?:x|×)[35]\b/gi, "")
        .replace(EV_TEXT_PATTERN, "")
        .replace(/\b(?:DAMP|Flash|Waterfall|Strength|Cut|Defog|Rock Smash|Rock Climb|Mach-Bike)\b/gi, "")
        .replace(/[^a-zA-Z0-9♀♂.' -]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
    )
    .filter(Boolean);
}

function normalizePokemonKey(value) {
  return value
    .toLowerCase()
    .replace(/[♀]/g, "f")
    .replace(/[♂]/g, "m")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, "-");
}

async function loadPokemonNameSet() {
  try {
    const pokemonData = JSON.parse(await readFile(POKEMON_DATA_FILE, "utf8"));
    const names = new Set();

    for (const [fallbackName, record] of Object.entries(pokemonData)) {
      names.add(normalizePokemonKey(fallbackName));

      if (record && typeof record === "object" && typeof record.name === "string") {
        names.add(normalizePokemonKey(record.name));
      }
    }

    return names;
  } catch {
    return new Set();
  }
}

function isKnownPokemonLine(line, pokemonNames) {
  if (pokemonNames.size === 0) {
    return false;
  }

  const candidateNames = splitPokemonNames(line);

  return candidateNames.length > 0 && candidateNames.every((name) => pokemonNames.has(normalizePokemonKey(name)));
}

function parsePokemonLine(line, inheritedHordeSize) {
  if (!inheritedHordeSize || NON_POKEMON_LINE_PATTERN.test(line)) {
    return undefined;
  }

  const hordeSizeMatch = line.match(INLINE_HORDE_SIZE_PATTERN);
  const hordeSize = hordeSizeMatch ? Number(hordeSizeMatch[1]) : inheritedHordeSize;
  const evYieldText = line.match(EV_TEXT_PATTERN)?.map((entry) => entry.replace(/\s+/g, "")) ?? [];
  const pokemonText = line
    .replace(INLINE_HORDE_SIZE_PATTERN, "")
    .replace(EV_TEXT_PATTERN, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!pokemonText || LOCATION_LINE_PATTERN.test(pokemonText) || REGION_SET.has(pokemonText)) {
    return undefined;
  }

  const pokemonNames = splitPokemonNames(line);

  return {
    pokemon_text: pokemonText,
    pokemon_names: pokemonNames,
    horde_size: hordeSize,
    ev_yield_text: evYieldText,
    notes: line
  };
}

function normalizeLocationName(value) {
  return value.replace(/\s+/g, " ").trim();
}

function parseGuideLines(lines, pokemonNames) {
  const regions = Object.fromEntries(REGIONS.map((region) => [region, []]));
  let currentRegion;
  let currentLocation;

  for (const line of lines) {
    if (REGION_SET.has(line)) {
      currentRegion = line;
      currentLocation = undefined;
      continue;
    }

    if (!currentRegion) {
      continue;
    }

    const locationMatch = line.match(LOCATION_LINE_PATTERN);

    if (locationMatch) {
      if (currentLocation && isKnownPokemonLine(line, pokemonNames)) {
        const parsedPokemon = parsePokemonLine(line, currentLocation.default_horde_size);

        if (parsedPokemon) {
          currentLocation.encounters.push(parsedPokemon);
        }

        continue;
      }

      currentLocation = {
        location: normalizeLocationName(locationMatch[1]),
        default_horde_size: Number(locationMatch[2]),
        notes: locationMatch[3]?.trim() || "",
        encounters: []
      };
      regions[currentRegion].push(currentLocation);
      continue;
    }

    const parsedPokemon = parsePokemonLine(line, currentLocation?.default_horde_size);

    if (parsedPokemon && currentLocation) {
      currentLocation.encounters.push(parsedPokemon);
    }
  }

  return regions;
}

async function fetchForumPage() {
  const response = await fetch(SOURCE_URL, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36"
    }
  });

  if (!response.ok) {
    throw new Error(`Unable to fetch forum guide: HTTP ${response.status}`);
  }

  return response.text();
}

async function main() {
  const html = await fetchForumPage();
  const jsonLdObjects = extractJsonLdObjects(html);
  const guideLines = getGuideLines(jsonLdObjects);
  const pokemonNames = await loadPokemonNameSet();
  const regions = parseGuideLines(guideLines, pokemonNames);
  const locationCount = Object.values(regions).reduce((total, entries) => total + entries.length, 0);
  const encounterCount = Object.values(regions).reduce(
    (total, entries) => total + entries.reduce((regionTotal, entry) => regionTotal + entry.encounters.length, 0),
    0
  );
  const output = {
    generated_at: new Date().toISOString(),
    source: SOURCE_URL,
    parser_notes: [
      "Generated from the public PokeMMO forum guide text.",
      "Location headers define a default horde size.",
      "Pokemon rows with explicit x3/x5 override the location default."
    ],
    location_count: locationCount,
    encounter_count: encounterCount,
    regions
  };

  await mkdir(path.dirname(OUTPUT_FILE), { recursive: true });
  await writeFile(OUTPUT_FILE, `${JSON.stringify(output, null, 2)}\n`, "utf8");

  console.log(`Wrote ${OUTPUT_FILE}`);
  console.log(`Parsed ${locationCount} locations and ${encounterCount} horde rows.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
