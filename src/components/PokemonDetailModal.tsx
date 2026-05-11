import { useEffect, useMemo, useState } from "react";
import { getHeldItemsForPokemon } from "../data/heldItemsData";
import { getHordeSizeForEncounter } from "../data/hordeData";
import { getMoveById } from "../data/moveData";
import {
  formatAbilityName,
  formatEvYieldList,
  formatPokemonName,
  formatStatName,
  formatValue
} from "../features/pokemon/formatPokemon";
import { getDefensiveTypeEffectiveness } from "../lib/typeEffectiveness";
import { getSeasonTags, sortSeasons } from "../lib/locationMetadata";
import { getBaseLocation, normalizeDisplayLocation } from "../lib/normalizeLocation";
import type {
  LocationAreaEncounter,
  MoveDataRecord,
  PokemonEncounterGroup,
  PokemonJsonRecord,
  PokemonMoveReference,
  Season,
  PokemonStatSlot
} from "../types/pokemon";
import { AbilityTooltip } from "./AbilityTooltip";

interface PokemonDetailModalProps {
  encounterGroup: PokemonEncounterGroup;
  onClose: () => void;
}

interface EvolutionSpecies {
  name?: string;
  id?: number;
}

interface EvolutionDetail {
  min_level?: number | null;
  min_happiness?: number | null;
  item?: { name?: string } | null;
  trigger?: { name?: string } | null;
  time_of_day?: string | null;
}

interface EvolutionNode {
  species?: EvolutionSpecies;
  evolves_to?: EvolutionNode[];
  evolution_details?: EvolutionDetail[];
}

interface EvolutionStep {
  species: EvolutionSpecies;
  detail: string;
}

const statOrder = ["hp", "attack", "defense", "special-attack", "special-defense", "speed"];
const regionOrder = ["Kanto", "Johto", "Hoenn", "Sinnoh", "Unova"];
const moveMethodOrder: Record<string, number> = {
  level: 1,
  move_tutor: 2,
  egg_moves: 3,
  move_learner_tools: 4,
  on_evolution: 5,
  prevo_moves: 6,
  special_moves: 7,
  sketch: 8
};

type MoveSortKey = "learn" | "move" | "type" | "class" | "power" | "accuracy" | "pp" | "priority" | "target";
type SortDirection = "asc" | "desc";

interface MoveRow {
  reference: PokemonMoveReference;
  details?: MoveDataRecord;
}

const adjacentFoeMoveNames = new Set([
  "acid",
  "air-cutter",
  "blizzard",
  "bubble",
  "eruption",
  "growl",
  "heat-wave",
  "hyper-voice",
  "icy-wind",
  "incinerate",
  "muddy-water",
  "powder-snow",
  "razor-leaf",
  "rock-slide",
  "string-shot",
  "snarl",
  "struggle-bug",
  "swift",
  "tail-whip",
  "twister",
  "water-spout"
]);

const allAdjacentMoveNames = new Set([
  "bulldoze",
  "discharge",
  "earthquake",
  "explosion",
  "lava-plume",
  "magnitude",
  "self-destruct",
  "sludge-wave",
  "surf",
  "teeter-dance"
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getArrayField<T>(pokemon: PokemonJsonRecord, key: string): T[] {
  const value = pokemon[key];

  return Array.isArray(value) ? (value as T[]) : [];
}

function getBooleanLabel(value: unknown): string {
  if (typeof value !== "boolean") {
    return formatValue(value);
  }

  return value ? "Yes" : "No";
}

function getEnglishName(pokemon: PokemonJsonRecord): string | undefined {
  const translations = pokemon.name_translations;

  if (!isRecord(translations)) {
    return undefined;
  }

  const englishTranslation = translations.en;

  return isRecord(englishTranslation) && typeof englishTranslation.name === "string"
    ? englishTranslation.name
    : undefined;
}

function getPvpTiers(pokemon: PokemonJsonRecord): string {
  const tiers = getArrayField<Record<string, unknown>>(pokemon, "pvp")
    .map((entry) => entry.tier)
    .filter((tier): tier is string => typeof tier === "string");

  return tiers.length ? tiers.join(", ") : "Unknown";
}

function getGenderRatio(genderRate: unknown): string {
  if (typeof genderRate !== "number") {
    return formatValue(genderRate);
  }

  if (genderRate < 0) {
    return "Genderless";
  }

  const femalePercent = (genderRate / 8) * 100;

  return `${100 - femalePercent}% Male / ${femalePercent}% Female`;
}

function sortStats(stats: PokemonStatSlot[]): PokemonStatSlot[] {
  return [...stats].sort((a, b) => {
    const firstName = a.stat_name ?? a.stat?.name ?? "";
    const secondName = b.stat_name ?? b.stat?.name ?? "";

    return statOrder.indexOf(firstName) - statOrder.indexOf(secondName);
  });
}

function formatPhysicalSize(value: unknown, unit: "kg" | "m"): string {
  if (typeof value !== "number") {
    return formatValue(value);
  }

  return `${value / 10} ${unit}`;
}

function getRegionSortValue(regionName: string): number {
  const index = regionOrder.findIndex((region) => region.toLowerCase() === regionName.toLowerCase());

  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

function getPokemonSpriteById(id: number | undefined): string | undefined {
  return id ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png` : undefined;
}

function describeEvolution(details: EvolutionDetail[] | undefined): string {
  const detail = details?.[0];

  if (!detail) {
    return "Base";
  }

  if (typeof detail.min_level === "number") {
    return `Level ${detail.min_level}`;
  }

  if (typeof detail.min_happiness === "number") {
    return `High happiness (${detail.min_happiness})`;
  }

  if (detail.item?.name) {
    return formatPokemonName(detail.item.name);
  }

  if (detail.trigger?.name) {
    return formatPokemonName(detail.trigger.name);
  }

  return "Special";
}

function flattenEvolutionLine(node: EvolutionNode | undefined, detail = "Base"): EvolutionStep[] {
  if (!node?.species) {
    return [];
  }

  return [
    { species: node.species, detail },
    ...(node.evolves_to ?? []).flatMap((childNode) =>
      flattenEvolutionLine(childNode, describeEvolution(childNode.evolution_details))
    )
  ];
}

function getEvolutionLine(pokemon: PokemonJsonRecord): EvolutionStep[] {
  const evolutionChain = pokemon.evolution_chain;

  if (!isRecord(evolutionChain) || !isRecord(evolutionChain.chain)) {
    return [];
  }

  return flattenEvolutionLine(evolutionChain.chain as EvolutionNode);
}

function getMoveMethodLabel(move: PokemonMoveReference): string {
  if (move.type === "level") {
    return `Level ${formatValue(move.level, "?")}`;
  }

  const labels: Record<string, string> = {
    move_tutor: "Tutor",
    egg_moves: "Egg",
    move_learner_tools: "TM"
  };

  return labels[`${move.type}`] ?? formatPokemonName(formatValue(move.type));
}

function getMoveSortValue(move: PokemonMoveReference): number {
  const methodOrder = moveMethodOrder[`${move.type}`] ?? 99;
  const level = move.type === "level" ? move.level ?? 999 : 0;

  return methodOrder * 1000 + level;
}

function getMoveRows(pokemon: PokemonJsonRecord): MoveRow[] {
  return [...(pokemon.moves ?? [])]
    .sort((a, b) => getMoveSortValue(a) - getMoveSortValue(b) || `${a.name}`.localeCompare(`${b.name}`))
    .map((reference) => ({
      reference,
      details: getMoveById(reference.id)
    }));
}

function getMergedEncounterSeasons(encounter: LocationAreaEncounter): Season[] {
  const seasons = encounter.seasons;

  return Array.isArray(seasons) && seasons.every((season) => typeof season === "string")
    ? (seasons as Season[])
    : getSeasonTags(encounter.location);
}

function getEncounterRows(pokemon: PokemonJsonRecord): LocationAreaEncounter[] {
  const encounterByDisplayKey = new Map<string, LocationAreaEncounter & { seasons?: Season[] }>();

  for (const encounter of pokemon.location_area_encounters ?? []) {
    const baseLocation = getBaseLocation(encounter.location);
    const displayKey = [
      normalizeDisplayLocation(encounter.region_name ?? "Unknown"),
      normalizeDisplayLocation(baseLocation),
      encounter.type ?? "",
      encounter.min_level ?? "",
      encounter.max_level ?? "",
      encounter.rarity ?? ""
    ].join("|");
    const existingEncounter = encounterByDisplayKey.get(displayKey);

    if (existingEncounter) {
      existingEncounter.seasons = sortSeasons([
        ...getMergedEncounterSeasons(existingEncounter),
        ...getSeasonTags(encounter.location)
      ]);
    } else {
      encounterByDisplayKey.set(displayKey, {
        ...encounter,
        location: baseLocation,
        seasons: getSeasonTags(encounter.location)
      });
    }
  }

  return Array.from(encounterByDisplayKey.values()).sort((a, b) => {
    const firstRegion = normalizeDisplayLocation(a.region_name ?? "Unknown");
    const secondRegion = normalizeDisplayLocation(b.region_name ?? "Unknown");
    const regionDifference = getRegionSortValue(firstRegion) - getRegionSortValue(secondRegion);

    return (
      regionDifference ||
      normalizeDisplayLocation(a.location).localeCompare(normalizeDisplayLocation(b.location), undefined, {
        numeric: true
      }) ||
      `${a.type}`.localeCompare(`${b.type}`)
    );
  });
}

function renderAbilityList(abilities: string[], fallback: string) {
  if (!abilities.length) {
    return fallback;
  }

  return (
    <span className="ability-list">
      {abilities.map((ability) => (
        <AbilityTooltip key={ability} abilityName={ability} />
      ))}
    </span>
  );
}

function renderMoveNumber(value: number | null | undefined): string {
  return value === null || value === undefined ? "-" : `${value}`;
}

function renderMovePower(details: MoveDataRecord | undefined): string {
  if (!details || details.damage_class === "status" || details.power === 0 || details.power === null) {
    return "-";
  }

  return `${details.power}`;
}

function getMoveTargetName(details: MoveDataRecord | undefined): string | undefined {
  if (!details?.target) {
    return undefined;
  }

  return typeof details.target === "string" ? details.target : details.target.name;
}

function formatMoveTargetName(targetName: string | undefined): string | undefined {
  const labels: Record<string, string> = {
    "selected-pokemon": "One target",
    "all-opponents": "Adjacent foes",
    "all-other-pokemon": "All adjacent",
    "all-pokemon": "All Pokemon",
    user: "Self",
    "user-or-ally": "Self or ally",
    "user-and-allies": "Team",
    ally: "Ally",
    "users-field": "Your field",
    "opponents-field": "Foe field",
    "entire-field": "Field",
    "random-opponent": "Random foe"
  };

  return targetName ? labels[targetName] ?? formatPokemonName(targetName) : undefined;
}

function getMoveTargetLabel(row: MoveRow): string {
  const explicitTarget = formatMoveTargetName(getMoveTargetName(row.details));

  if (explicitTarget) {
    return explicitTarget;
  }

  const moveName = `${row.details?.name ?? row.reference.name ?? ""}`.toLowerCase();

  if (allAdjacentMoveNames.has(moveName)) {
    return "All adjacent";
  }

  if (adjacentFoeMoveNames.has(moveName)) {
    return "Adjacent foes";
  }

  if (row.details?.damage_class === "status") {
    return "Status/field";
  }

  return !row.details || row.details.power === null || row.details.power === 0 ? "-" : "One target";
}

function getMoveDisplayName(row: MoveRow): string {
  return formatAbilityName(row.details?.name ?? row.reference.name ?? "Unknown");
}

function getMoveSortComparable(row: MoveRow, sortKey: MoveSortKey): string | number {
  if (sortKey === "learn") {
    return getMoveSortValue(row.reference);
  }

  if (sortKey === "move") {
    return getMoveDisplayName(row);
  }

  if (sortKey === "type") {
    return row.details?.type ?? "";
  }

  if (sortKey === "class") {
    return row.details?.damage_class ?? "";
  }

  if (sortKey === "power") {
    return row.details?.damage_class === "status" ? -1 : row.details?.power ?? -1;
  }

  if (sortKey === "accuracy") {
    return row.details?.accuracy ?? -1;
  }

  if (sortKey === "pp") {
    return row.details?.pp ?? -1;
  }

  if (sortKey === "priority") {
    return row.details?.priority ?? 0;
  }

  return getMoveTargetLabel(row);
}

function compareMoveRows(firstRow: MoveRow, secondRow: MoveRow, sortKey: MoveSortKey, direction: SortDirection): number {
  const firstValue = getMoveSortComparable(firstRow, sortKey);
  const secondValue = getMoveSortComparable(secondRow, sortKey);
  const directionValue = direction === "asc" ? 1 : -1;

  if (typeof firstValue === "number" && typeof secondValue === "number" && firstValue !== secondValue) {
    return (firstValue - secondValue) * directionValue;
  }

  const labelDifference = `${firstValue}`.localeCompare(`${secondValue}`, undefined, { numeric: true });

  return (labelDifference || getMoveDisplayName(firstRow).localeCompare(getMoveDisplayName(secondRow))) * directionValue;
}

function renderTypeBadge(typeName: string | undefined) {
  return <span className={`pokemon-type-badge pokemon-type-badge--${typeName ?? "unknown"}`}>{formatValue(typeName)}</span>;
}

function formatHordeSize(size: 3 | 5 | undefined): string {
  return size ? `x${size}` : "-";
}

export function PokemonDetailModal({ encounterGroup, onClose }: PokemonDetailModalProps) {
  const [moveSort, setMoveSort] = useState<{ key: MoveSortKey; direction: SortDirection }>({
    key: "learn",
    direction: "asc"
  });
  const encounter = encounterGroup.pokemon;
  const pokemon = encounter.rawPokemon;
  const englishName = getEnglishName(pokemon);
  const eggGroups = getArrayField<string>(pokemon, "egg_groups");
  const stats = sortStats(pokemon.stats ?? []);
  const totalStats = stats.reduce((total, stat) => total + (stat.base_stat ?? 0), 0);
  const evolutionLine = getEvolutionLine(pokemon);
  const typeEffectiveness = getDefensiveTypeEffectiveness(encounter.types);
  const encounterRows = getEncounterRows(pokemon);
  const moveRows = useMemo(() => getMoveRows(pokemon), [pokemon]);
  const sortedMoveRows = useMemo(
    () => [...moveRows].sort((a, b) => compareMoveRows(a, b, moveSort.key, moveSort.direction)),
    [moveRows, moveSort]
  );
  const heldItems = getHeldItemsForPokemon(encounter.pokemonId);

  function changeMoveSort(key: MoveSortKey) {
    setMoveSort((currentSort) => ({
      key,
      direction: currentSort.key === key && currentSort.direction === "asc" ? "desc" : "asc"
    }));
  }

  function renderMoveSortButton(label: string, key: MoveSortKey) {
    const isActive = moveSort.key === key;

    return (
      <button className={isActive ? "is-active" : ""} type="button" onClick={() => changeMoveSort(key)}>
        <span>{label}</span>
        <small>{isActive ? (moveSort.direction === "asc" ? "Asc" : "Desc") : "Sort"}</small>
      </button>
    );
  }

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", closeOnEscape);

    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div className="pokemon-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="pokemon-modal pokemon-dex-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`pokemon-modal-title-${encounterGroup.groupKey}`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="pokemon-dex-header">
          <button className="pokemon-dex-back" type="button" onClick={onClose}>
            Back
          </button>
          <h2 id={`pokemon-modal-title-${encounterGroup.groupKey}`}>{formatPokemonName(encounter.name)}</h2>
          <button className="pokemon-modal__close" type="button" onClick={onClose}>
            Close
          </button>
        </header>

        <div className="pokemon-dex-content pokemon-dex-content--readable">
          <section className="pokemon-dex-hero">
            <div className="pokemon-dex-visual pokemon-summary-card">
              <div className="pokemon-dex-sprite">
                {encounter.spriteUrl ? (
                  <img src={encounter.spriteUrl} alt={formatPokemonName(encounter.name)} />
                ) : (
                  <span>No sprite</span>
                )}
              </div>
              <div className="type-row">
                {encounter.types.length ? (
                  encounter.types.map((type) => <span key={type}>{type}</span>)
                ) : (
                  <span>Unknown</span>
                )}
              </div>
              <dl className="pokemon-summary-facts">
                <div>
                  <dt>No.</dt>
                  <dd>{formatValue(encounter.pokemonId)}</dd>
                </div>
                <div>
                  <dt>Catch</dt>
                  <dd>{formatValue(encounter.captureRate)}</dd>
                </div>
                <div>
                  <dt>EV Yield</dt>
                  <dd>{formatEvYieldList(encounter.evYields)}</dd>
                </div>
              </dl>
            </div>

            <div className="pokemon-dex-stats pokemon-info-card">
              <h3>Base Stats</h3>
              {stats.map((stat) => {
                const statName = stat.stat_name ?? stat.stat?.name ?? "unknown";
                const value = stat.base_stat ?? 0;

                return (
                  <div key={statName} className="dex-stat-row">
                    <span>{formatStatName(statName)}</span>
                    <div>
                      <span style={{ width: `${Math.min(value, 160) / 1.6}%` }} />
                    </div>
                    <strong>{value}</strong>
                  </div>
                );
              })}
              <div className="dex-stat-row dex-stat-row--total">
                <span>Total</span>
                <div />
                <strong>{totalStats}</strong>
              </div>
            </div>
          </section>

          <section className="pokemon-dex-info-grid">
            <section className="pokemon-info-card">
              <h3>Basic Info</h3>
              <dl>
                <div>
                  <dt>Pokedex No.</dt>
                  <dd>{formatValue(encounter.pokemonId)}</dd>
                </div>
                <div>
                  <dt>Name</dt>
                  <dd>{englishName ?? formatPokemonName(encounter.name)}</dd>
                </div>
                <div>
                  <dt>Weight</dt>
                  <dd>{formatPhysicalSize(pokemon.weight, "kg")}</dd>
                </div>
                <div>
                  <dt>Height</dt>
                  <dd>{formatPhysicalSize(pokemon.height, "m")}</dd>
                </div>
                <div>
                  <dt>Obtainable</dt>
                  <dd>{getBooleanLabel(pokemon.obtainable)}</dd>
                </div>
                <div>
                  <dt>Alpha Available</dt>
                  <dd>{formatValue(pokemon.alpha)}</dd>
                </div>
                <div>
                  <dt>Held Items</dt>
                  <dd>{heldItems.length ? heldItems.map((item) => item.name).join(", ") : "None"}</dd>
                </div>
              </dl>
            </section>

            <section className="pokemon-info-card">
              <h3>Training</h3>
              <dl>
                <div>
                  <dt>PVP Tier</dt>
                  <dd>{getPvpTiers(pokemon)}</dd>
                </div>
                <div>
                  <dt>Capture Rate</dt>
                  <dd>{formatValue(encounter.captureRate)}</dd>
                </div>
                <div>
                  <dt>Base Exp</dt>
                  <dd>{formatValue(pokemon.base_experience)}</dd>
                </div>
                <div>
                  <dt>Growth Rate</dt>
                  <dd>{formatPokemonName(formatValue(pokemon.growth_rate))}</dd>
                </div>
                <div>
                  <dt>EV Yield</dt>
                  <dd>{formatEvYieldList(encounter.evYields)}</dd>
                </div>
              </dl>
            </section>

            <section className="pokemon-info-card">
              <h3>Breeding</h3>
              <dl>
                <div>
                  <dt>Egg Groups</dt>
                  <dd>{eggGroups.length ? eggGroups.map(formatPokemonName).join(", ") : "Unknown"}</dd>
                </div>
                <div>
                  <dt>Gender Ratio</dt>
                  <dd>{getGenderRatio(pokemon.gender_rate)}</dd>
                </div>
                <div>
                  <dt>Hatch Counter</dt>
                  <dd>{formatValue(pokemon.hatch_counter)}</dd>
                </div>
                <div>
                  <dt>Base Happiness</dt>
                  <dd>{formatValue(pokemon.base_happiness)}</dd>
                </div>
              </dl>
            </section>
          </section>

          {evolutionLine.length ? (
            <section className="pokemon-dex-section pokemon-info-card">
              <h3>Evolution Line</h3>
              <div className="evolution-line">
                {evolutionLine.map((step) => (
                  <div key={`${step.species.id}-${step.species.name}`} className="evolution-step">
                    <div className="evolution-step__sprite">
                      {getPokemonSpriteById(step.species.id) ? (
                        <img src={getPokemonSpriteById(step.species.id)} alt={formatPokemonName(step.species.name ?? "")} />
                      ) : (
                        <span>?</span>
                      )}
                    </div>
                    <strong>{formatPokemonName(step.species.name ?? "Unknown")}</strong>
                    <span>{step.detail}</span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section className="pokemon-dex-section pokemon-info-card">
            <h3>Type Effectiveness</h3>
            <p>Effectiveness of each type on this Pokemon.</p>
            <div className="type-effectiveness-grid">
              {typeEffectiveness.map((entry) => (
                <div
                  key={entry.type}
                  className={`type-effectiveness-cell type-effectiveness-cell--${entry.multiplier}`}
                >
                  {renderTypeBadge(entry.type)}
                  <strong>{entry.multiplier}x</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="pokemon-dex-section pokemon-info-card">
            <h3>Abilities</h3>
            <dl className="pokemon-dex-ability-list">
              <div>
                <dt>Standard</dt>
                <dd>{renderAbilityList(encounter.abilities, "Unknown")}</dd>
              </div>
              <div>
                <dt>Hidden</dt>
                <dd>{renderAbilityList(encounter.hiddenAbilities, "None")}</dd>
              </div>
            </dl>
          </section>

          <section className="pokemon-dex-section pokemon-info-card">
            <h3>Encounter Locations</h3>
            <div className="dex-table-wrap">
              <table className="dex-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Region</th>
                    <th>Location</th>
                    <th>Levels</th>
                    <th>Rarity</th>
                    <th>Horde</th>
                    <th>Season</th>
                  </tr>
                </thead>
                <tbody>
                  {encounterRows.map((row, index) => {
                    const hordeSize = getHordeSizeForEncounter(pokemon.name, row);

                    return (
                      <tr key={`${row.region_name}-${row.location}-${row.type}-${row.rarity}-${index}`}>
                        <td>{formatValue(row.type)}</td>
                        <td>{normalizeDisplayLocation(row.region_name ?? "Unknown")}</td>
                        <td>{normalizeDisplayLocation(row.location)}</td>
                        <td>
                          {formatValue(row.min_level)}-{formatValue(row.max_level)}
                        </td>
                        <td>{formatValue(row.rarity)}</td>
                        <td>{formatHordeSize(hordeSize)}</td>
                        <td>{getMergedEncounterSeasons(row).join(", ") || "Any"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className="pokemon-dex-section pokemon-info-card">
            <div className="section-title-row">
              <div>
                <h3>Moves</h3>
                <p>{sortedMoveRows.length} learnable moves. Click a column header to sort.</p>
              </div>
              <span>Sorted by {moveSort.key}</span>
            </div>
            <div className="dex-table-wrap">
              <table className="dex-table dex-table--moves">
                <thead>
                  <tr>
                    <th>{renderMoveSortButton("Learn", "learn")}</th>
                    <th>{renderMoveSortButton("Move", "move")}</th>
                    <th>{renderMoveSortButton("Type", "type")}</th>
                    <th>{renderMoveSortButton("Class", "class")}</th>
                    <th>{renderMoveSortButton("Power", "power")}</th>
                    <th>{renderMoveSortButton("Accuracy", "accuracy")}</th>
                    <th>{renderMoveSortButton("PP", "pp")}</th>
                    <th>{renderMoveSortButton("Priority", "priority")}</th>
                    <th>{renderMoveSortButton("Target", "target")}</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedMoveRows.map(({ reference, details }) => (
                    <tr key={`${reference.type}-${reference.level}-${reference.id}-${reference.name}`}>
                      <td>{getMoveMethodLabel(reference)}</td>
                      <td title={details?.effect}>{formatAbilityName(details?.name ?? reference.name ?? "Unknown")}</td>
                      <td>{renderTypeBadge(details?.type)}</td>
                      <td>{formatPokemonName(formatValue(details?.damage_class))}</td>
                      <td>{renderMovePower(details)}</td>
                      <td>{renderMoveNumber(details?.accuracy)}</td>
                      <td>{renderMoveNumber(details?.pp)}</td>
                      <td>{details?.priority ? `+${details.priority}` : "-"}</td>
                      <td>{getMoveTargetLabel({ reference, details })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
