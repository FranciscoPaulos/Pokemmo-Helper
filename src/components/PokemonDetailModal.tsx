import { useEffect } from "react";
import { getMoveById } from "../data/moveData";
import {
  formatAbilityName,
  formatEvYieldList,
  formatPokemonName,
  formatStatName,
  formatValue
} from "../features/pokemon/formatPokemon";
import { getDefensiveTypeEffectiveness } from "../lib/typeEffectiveness";
import { normalizeDisplayLocation } from "../lib/normalizeLocation";
import type {
  LocationAreaEncounter,
  MoveDataRecord,
  PokemonEncounterGroup,
  PokemonJsonRecord,
  PokemonMoveReference,
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
  move_learner_tools: 4
};

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

function getMoveRows(pokemon: PokemonJsonRecord): Array<{ reference: PokemonMoveReference; details?: MoveDataRecord }> {
  return [...(pokemon.moves ?? [])]
    .sort((a, b) => getMoveSortValue(a) - getMoveSortValue(b) || `${a.name}`.localeCompare(`${b.name}`))
    .map((reference) => ({
      reference,
      details: getMoveById(reference.id)
    }));
}

function getEncounterRows(pokemon: PokemonJsonRecord): LocationAreaEncounter[] {
  const encounterByDisplayKey = new Map<string, LocationAreaEncounter>();

  for (const encounter of pokemon.location_area_encounters ?? []) {
    const displayKey = [
      normalizeDisplayLocation(encounter.region_name ?? "Unknown"),
      normalizeDisplayLocation(encounter.location),
      encounter.type ?? "",
      encounter.min_level ?? "",
      encounter.max_level ?? "",
      encounter.rarity ?? ""
    ].join("|");

    if (!encounterByDisplayKey.has(displayKey)) {
      encounterByDisplayKey.set(displayKey, encounter);
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

function renderTypeBadge(typeName: string | undefined) {
  return <span className={`pokemon-type-badge pokemon-type-badge--${typeName ?? "unknown"}`}>{formatValue(typeName)}</span>;
}

export function PokemonDetailModal({ encounterGroup, onClose }: PokemonDetailModalProps) {
  const encounter = encounterGroup.pokemon;
  const pokemon = encounter.rawPokemon;
  const englishName = getEnglishName(pokemon);
  const eggGroups = getArrayField<string>(pokemon, "egg_groups");
  const stats = sortStats(pokemon.stats ?? []);
  const totalStats = stats.reduce((total, stat) => total + (stat.base_stat ?? 0), 0);
  const evolutionLine = getEvolutionLine(pokemon);
  const typeDefenses = getDefensiveTypeEffectiveness(encounter.types).filter((entry) => entry.multiplier !== 1);
  const encounterRows = getEncounterRows(pokemon);
  const moveRows = getMoveRows(pokemon);

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

        <div className="pokemon-dex-content">
          <section className="pokemon-dex-hero">
            <div className="pokemon-dex-visual">
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
            </div>

            <div className="pokemon-dex-stats">
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

            <div className="pokemon-dex-info-grid">
              <section>
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
                </dl>
              </section>

              <section>
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

              <section>
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
            </div>
          </section>

          {evolutionLine.length ? (
            <section className="pokemon-dex-section">
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

          <section className="pokemon-dex-section">
            <h3>Type Defense</h3>
            <p>Effectiveness of each type on this Pokemon.</p>
            <div className="type-defense-grid">
              {typeDefenses.length ? (
                typeDefenses.map((entry) => (
                  <span key={entry.type} className={`type-defense-pill type-defense-pill--${entry.multiplier}`}>
                    {formatPokemonName(entry.type)} {entry.multiplier}x
                  </span>
                ))
              ) : (
                <span>Neutral to all listed types.</span>
              )}
            </div>
          </section>

          <section className="pokemon-dex-section">
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

          <section className="pokemon-dex-section">
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
                  </tr>
                </thead>
                <tbody>
                  {encounterRows.map((row, index) => (
                    <tr key={`${row.region_name}-${row.location}-${row.type}-${row.rarity}-${index}`}>
                      <td>{formatValue(row.type)}</td>
                      <td>{normalizeDisplayLocation(row.region_name ?? "Unknown")}</td>
                      <td>{normalizeDisplayLocation(row.location)}</td>
                      <td>
                        {formatValue(row.min_level)}-{formatValue(row.max_level)}
                      </td>
                      <td>{formatValue(row.rarity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="pokemon-dex-section">
            <h3>Moves</h3>
            <div className="dex-table-wrap">
              <table className="dex-table dex-table--moves">
                <thead>
                  <tr>
                    <th>Learn</th>
                    <th>Move</th>
                    <th>Type</th>
                    <th>Class</th>
                    <th>Power</th>
                    <th>Accuracy</th>
                    <th>PP</th>
                    <th>Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {moveRows.map(({ reference, details }) => (
                    <tr key={`${reference.type}-${reference.level}-${reference.id}-${reference.name}`}>
                      <td>{getMoveMethodLabel(reference)}</td>
                      <td title={details?.effect}>{formatAbilityName(details?.name ?? reference.name ?? "Unknown")}</td>
                      <td>{renderTypeBadge(details?.type)}</td>
                      <td>{formatPokemonName(formatValue(details?.damage_class))}</td>
                      <td>{renderMoveNumber(details?.power)}</td>
                      <td>{renderMoveNumber(details?.accuracy)}</td>
                      <td>{renderMoveNumber(details?.pp)}</td>
                      <td>{details?.priority ? `+${details.priority}` : "-"}</td>
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
