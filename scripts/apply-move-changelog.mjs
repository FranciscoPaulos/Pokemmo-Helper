import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const DEFAULT_TARGET_FILE = path.resolve("pokedex json.json");
const CHANGELOG_FILE = path.resolve("scripts/move-changelog-2026-04.txt");
const MOVE_DATA_FILE = path.resolve("src/data/moveData.json");

function stripBom(value) {
  return value.replace(/^\uFEFF/, "");
}

function normalizeKey(value) {
  return value
    .toLowerCase()
    .replace(/\[[^\]]*]/g, " ")
    .replace(/mr\.\s*mime/g, "mr mime")
    .replace(/mime jr\./g, "mime jr")
    .replace(/porygon-z/g, "porygon z")
    .replace(/rotom\s*\[[^\]]*]/g, "rotom")
    .replace(/[^a-z0-9]+/g, "")
    .trim()
    ;
}

function normalizeMoveMethod(method) {
  const normalized = method.toLowerCase();

  if (normalized === "tm") {
    return "move_learner_tools";
  }

  if (normalized === "move tutor") {
    return "move_tutor";
  }

  if (normalized === "evolution") {
    return "on_evolution";
  }

  return "level";
}

function parseChangelog(changelogText) {
  return changelogText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => line !== "=====")
    .map((line) => {
      const match = line.match(/^(.*?) now learns (.*?) (?:at Level (\d+)|via (TM|Move Tutor|Evolution))$/i);

      if (!match) {
        return undefined;
      }

      return {
        speciesLabel: match[1],
        speciesKey: normalizeKey(match[1]),
        moveLabel: match[2],
        moveKey: normalizeKey(match[2]),
        level: match[3] ? Number(match[3]) : undefined,
        method: match[4] ? normalizeMoveMethod(match[4]) : "level",
        raw: line
      };
    })
    .filter((entry) => entry !== undefined);
}

function buildSpeciesLookup(data) {
  const lookup = new Map();

  for (const [speciesKey, record] of Object.entries(data)) {
    lookup.set(normalizeKey(speciesKey), speciesKey);

    if (record && typeof record === "object" && typeof record.name === "string") {
      lookup.set(normalizeKey(record.name), speciesKey);
    }
  }

  return lookup;
}

function buildMoveLookup(moveData) {
  const lookup = new Map();

  for (const move of Object.values(moveData.moves ?? {})) {
    if (!move || typeof move !== "object") {
      continue;
    }

    if (typeof move.name === "string") {
      lookup.set(normalizeKey(move.name), move);
    }

    const englishName = move.name_translations?.en?.name;

    if (typeof englishName === "string") {
      lookup.set(normalizeKey(englishName), move);
    }
  }

  return lookup;
}

function hasMove(record, change, moveId) {
  const moves = Array.isArray(record.moves) ? record.moves : [];

  return moves.some((move) => {
    const sameIdOrName = move.id === moveId || normalizeKey(`${move.name ?? ""}`) === change.moveKey;
    const sameMethod = `${move.type ?? ""}` === change.method;

    if (!sameIdOrName || !sameMethod) {
      return false;
    }

    if (change.method === "level") {
      return Number(move.level) === change.level;
    }

    return true;
  });
}

function sortMoves(moves) {
  const methodOrder = {
    level: 1,
    move_tutor: 2,
    egg_moves: 3,
    move_learner_tools: 4,
    on_evolution: 5,
    prevo_moves: 6,
    special_moves: 7,
    sketch: 8
  };

  return [...moves].sort((firstMove, secondMove) => {
    const firstOrder = methodOrder[`${firstMove.type ?? ""}`] ?? 99;
    const secondOrder = methodOrder[`${secondMove.type ?? ""}`] ?? 99;

    if (firstOrder !== secondOrder) {
      return firstOrder - secondOrder;
    }

    if (`${firstMove.type ?? ""}` === "level" && `${secondMove.type ?? ""}` === "level") {
      const levelDifference = (firstMove.level ?? 999) - (secondMove.level ?? 999);

      if (levelDifference !== 0) {
        return levelDifference;
      }
    }

    return `${firstMove.name ?? ""}`.localeCompare(`${secondMove.name ?? ""}`);
  });
}

async function main() {
  const targetFile = process.argv[2]
    ? path.resolve(process.argv[2])
    : DEFAULT_TARGET_FILE;

  const [targetText, changelogText, moveDataText] = await Promise.all([
    readFile(targetFile, "utf8"),
    readFile(CHANGELOG_FILE, "utf8"),
    readFile(MOVE_DATA_FILE, "utf8")
  ]);

  const targetData = JSON.parse(stripBom(targetText));
  const moveData = JSON.parse(stripBom(moveDataText));
  const changes = parseChangelog(stripBom(changelogText));
  const speciesLookup = buildSpeciesLookup(targetData);
  const moveLookup = buildMoveLookup(moveData);

  const stats = {
    total: changes.length,
    added: 0,
    skippedExisting: 0,
    missingSpecies: [],
    missingMoves: [],
    failedParses: []
  };

  for (const change of changes) {
    const speciesKey = speciesLookup.get(change.speciesKey);

    if (!speciesKey) {
      stats.missingSpecies.push(change.raw);
      continue;
    }

    const move = moveLookup.get(change.moveKey);

    if (!move) {
      stats.missingMoves.push(change.raw);
      continue;
    }

    const record = targetData[speciesKey];
    record.moves = Array.isArray(record.moves) ? record.moves : [];

    if (hasMove(record, change, move.id)) {
      stats.skippedExisting += 1;
      continue;
    }

    const moveEntry = {
      id: move.id,
      name: move.name_translations?.en?.name ?? move.name,
      type: change.method
    };

    if (change.method === "level") {
      moveEntry.level = change.level;
    }

    record.moves.push(moveEntry);
    record.moves = sortMoves(record.moves);
    stats.added += 1;
  }

  await writeFile(targetFile, `${JSON.stringify(targetData, null, 2)}\n`, "utf8");

  console.log(
    JSON.stringify(
      {
        targetFile,
        ...stats
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
