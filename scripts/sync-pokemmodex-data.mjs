import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const SOURCE_FILE = path.resolve("pokedex json.json");
const OUTPUT_FILE = path.resolve("src/data/pokemmoDexData.json");
const API_BASE_URL = "https://pokemmo.info/api/pokemmodex";
const CONCURRENCY = 8;

const statKeys = [
  ["hp", "hp"],
  ["attack", "attack"],
  ["defense", "defense"],
  ["special-attack", "sp_attack"],
  ["special-defense", "sp_defense"],
  ["speed", "speed"]
];

const effortKeys = {
  hp: "ev_hp",
  attack: "ev_attack",
  defense: "ev_defense",
  "special-attack": "ev_sp_attack",
  "special-defense": "ev_sp_defense",
  speed: "ev_speed"
};

const moveTypeMap = {
  EGG: "egg_moves",
  TUTOR: "move_tutor",
  "TM??": "move_learner_tools",
  FORM: "form"
};

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function getPokemonEntries(rawData) {
  if (Array.isArray(rawData)) {
    return rawData.map((record, index) => [record.name ?? `${record.id ?? index}`, record]);
  }

  return Object.entries(rawData);
}

function normalizeMove(move) {
  return {
    ...move,
    type: moveTypeMap[move.type] ?? move.type
  };
}

function normalizeLocation(location) {
  return {
    type: location.type,
    region_id: location.region_id,
    region_name: location.region_name,
    location: location.location,
    min_level: location.min_level,
    max_level: location.max_level,
    rarity: location.rarity
  };
}

function buildStats(detail, fallbackStats = []) {
  if (!detail.stats || !detail.yields) {
    return fallbackStats;
  }

  return statKeys.map(([statName, detailKey]) => ({
    stat_name: statName,
    base_stat: detail.stats[detailKey],
    effort: detail.yields[effortKeys[statName]] ?? 0
  }));
}

function mergeDetail(baseRecord, detail) {
  const merged = {
    ...cloneJson(baseRecord),
    pokemmodex_id: detail.id,
    obtainable: detail.obtainable,
    height: detail.height ?? baseRecord.height,
    weight: detail.weight ?? baseRecord.weight,
    egg_groups: detail.egg_groups ?? baseRecord.egg_groups,
    yields: detail.yields ?? baseRecord.yields,
    tiers: detail.tiers ?? baseRecord.tiers,
    held_items: Array.isArray(detail.held_items)
      ? detail.held_items.map((item) => ({
          id: item.id,
          name: item.name,
          item_name: item.name
        }))
      : baseRecord.held_items
  };

  if (Array.isArray(detail.locations)) {
    merged.location_area_encounters = detail.locations.map(normalizeLocation);
  }

  if (Array.isArray(detail.moves)) {
    merged.moves = detail.moves.map(normalizeMove);
  }

  if (Array.isArray(detail.types)) {
    merged.types = detail.types.map((type) => `${type}`.toLowerCase());
  }

  if (Array.isArray(detail.tiers)) {
    merged.pvp = detail.tiers.map((tier) => ({ tier }));
  }

  merged.stats = buildStats(detail, baseRecord.stats);

  return merged;
}

async function fetchDetail(id) {
  const response = await fetch(`${API_BASE_URL}/${id}`);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json();
}

async function runQueue(entries, worker) {
  const results = new Map();
  let nextIndex = 0;

  async function runWorker() {
    while (nextIndex < entries.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;

      const [key, record] = entries[currentIndex];
      results.set(key, await worker(key, record, currentIndex));
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, runWorker));

  return results;
}

async function main() {
  const sourceText = await readFile(SOURCE_FILE, "utf8");
  const sourceData = JSON.parse(sourceText);
  const entries = getPokemonEntries(sourceData);
  const failed = [];

  console.log(`Fetching ${entries.length} PokeMMO Dex records...`);

  const synced = await runQueue(entries, async (key, record, index) => {
    if (!record?.id) {
      failed.push({ key, reason: "missing id" });
      return record;
    }

    try {
      const detail = await fetchDetail(record.id);

      if ((index + 1) % 25 === 0 || index === entries.length - 1) {
        console.log(`Fetched ${index + 1}/${entries.length}`);
      }

      return mergeDetail(record, detail);
    } catch (error) {
      failed.push({ key, id: record.id, reason: error instanceof Error ? error.message : "unknown error" });
      return record;
    }
  });

  const output = Object.fromEntries(entries.map(([key]) => [key, synced.get(key)]));

  await mkdir(path.dirname(OUTPUT_FILE), { recursive: true });
  await writeFile(OUTPUT_FILE, `${JSON.stringify(output, null, 2)}\n`, "utf8");

  console.log(`Wrote ${OUTPUT_FILE}`);

  if (failed.length) {
    console.warn(`Kept fallback data for ${failed.length} records:`);
    console.warn(JSON.stringify(failed, null, 2));
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
