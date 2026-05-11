import { useState } from "react";
import { getHeldItemsForPokemon } from "../data/heldItemsData";
import type { PokemonEncounterGroup } from "../types/pokemon";
import { formatEvYieldList, formatPokemonName, formatValue } from "../features/pokemon/formatPokemon";
import { assetPath } from "../lib/assetPath";
import { AbilityTooltip } from "./AbilityTooltip";
import { PokemonDetailModal } from "./PokemonDetailModal";

interface PokemonEncounterCardProps {
  encounterGroup: PokemonEncounterGroup;
  showRoutes?: boolean;
}

const allTimesOfDay = ["Morning", "Day", "Night"];
const allSeasons = ["Spring", "Summer", "Autumn", "Winter"];

function uniqueValues(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function formatOptionSummary(values: string[], fallback: string, allValues?: string[]): string {
  const uniqueOptions = uniqueValues(values);

  if (!uniqueOptions.length || (allValues && allValues.every((value) => uniqueOptions.includes(value)))) {
    return fallback;
  }

  return uniqueOptions.join(", ");
}

function formatCompactList(values: string[], emptyLabel: string, visibleCount = 2): string {
  const uniqueOptions = uniqueValues(values);

  if (!uniqueOptions.length) {
    return emptyLabel;
  }

  const visibleOptions = uniqueOptions.slice(0, visibleCount);
  const remainingCount = uniqueOptions.length - visibleOptions.length;

  return remainingCount > 0 ? `${visibleOptions.join(", ")} +${remainingCount}` : visibleOptions.join(", ");
}

export function PokemonEncounterCard({ encounterGroup, showRoutes = false }: PokemonEncounterCardProps) {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const encounter = encounterGroup.pokemon;
  const heldItems = getHeldItemsForPokemon(encounter.pokemonId);
  const routeRegionNames = encounterGroup.routeRegions.map((routeRegion) => routeRegion.regionName);
  const routeLocationCount = encounterGroup.routeRegions.reduce(
    (total, routeRegion) => total + routeRegion.routeNames.length,
    0
  );
  const routeSummary = encounterGroup.routeNames.join(", ");
  const displayRouteSummary = showRoutes
    ? routeLocationCount
      ? `${formatCompactList(routeRegionNames, "Unknown region", 3)} - ${routeLocationCount} ${
          routeLocationCount === 1 ? "location" : "locations"
        }`
      : "No wild route listed"
    : routeSummary;
  const typeNames = uniqueValues(encounter.types);
  const displayTimeLabel = formatOptionSummary(encounterGroup.timeOfDay, "Any time", allTimesOfDay);
  const displaySeasonLabel = formatOptionSummary(encounterGroup.seasons, "Any season", allSeasons);
  const heldItemLabel = heldItems.length ? heldItems.map((item) => item.name).join(", ") : "None";
  const hordeLabel = encounterGroup.hordeSizes.length
    ? encounterGroup.hordeSizes.map((size) => `x${size}`).join(", ")
    : undefined;
  const rarityLabel = formatCompactList(encounterGroup.rarities, "Unknown", 1);
  const encounterTypeLabel = formatCompactList(encounterGroup.encounterTypes, "Unknown", 2);
  const featuredRarities = encounterGroup.rarities.filter((rarity) => rarity.toLowerCase() === "lure");
  const featuredMethods = hordeLabel ? uniqueValues([...featuredRarities, "Horde"]) : featuredRarities;

  function renderAbilities(abilities: string[], fallback: string) {
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

  return (
    <>
      <article className="encounter-card" onDoubleClick={() => setIsDetailOpen(true)}>
        {featuredMethods.length ? (
          <div className="encounter-card__badges" aria-label="Featured encounter methods">
            {featuredMethods.map((rarity) => (
              <span key={rarity} className={`encounter-method-badge encounter-method-badge--${rarity.toLowerCase()}`}>
                {rarity}
              </span>
            ))}
          </div>
        ) : null}

        <button
          className="pokemon-sprite-box pokemon-detail-trigger"
          type="button"
          onClick={() => setIsDetailOpen(true)}
          aria-label={`Open details for ${formatPokemonName(encounter.name)}`}
        >
          {encounter.spriteUrl ? (
            <img src={encounter.spriteUrl} alt={formatPokemonName(encounter.name)} />
          ) : (
            <span>No sprite</span>
          )}
        </button>

        <div className="encounter-card__body">
          <header className="encounter-card__header">
            <div className="encounter-card__identity">
              <span>No. {formatValue(encounter.pokemonId)}</span>
              <h3>
                <button className="pokemon-name-button" type="button" onClick={() => setIsDetailOpen(true)}>
                  {formatPokemonName(encounter.name)}
                </button>
              </h3>
              <div className="type-row">
                {typeNames.length ? (
                  typeNames.map((type) => (
                    <span key={type} className={`pokemon-type-badge pokemon-type-badge--${type}`}>
                      {type}
                    </span>
                  ))
                ) : (
                  <span className="pokemon-type-badge pokemon-type-badge--unknown">Unknown</span>
                )}
              </div>
            </div>
          </header>

          <dl className="encounter-highlight-grid">
            <div>
              <dt>Where</dt>
              <dd>{displayRouteSummary || "Current route"}</dd>
            </div>
            <div>
              <dt>How</dt>
              <dd>{encounterTypeLabel}</dd>
            </div>
            <div>
              <dt>Level</dt>
              <dd>
                {formatValue(encounterGroup.minLevel)}-{formatValue(encounterGroup.maxLevel)}
              </dd>
            </div>
          </dl>

          <dl className="encounter-meta-grid">
            <div>
              <dt>Time</dt>
              <dd>{displayTimeLabel}</dd>
            </div>
            <div>
              <dt>Season</dt>
              <dd>{displaySeasonLabel}</dd>
            </div>
            <div>
              <dt>EV</dt>
              <dd>{formatEvYieldList(encounter.evYields)}</dd>
            </div>
            <div>
              <dt>Item</dt>
              <dd>{heldItemLabel}</dd>
            </div>
            {hordeLabel ? (
              <div>
                <dt>Horde</dt>
                <dd>{hordeLabel}</dd>
              </div>
            ) : null}
          </dl>

          <div className="encounter-ability-row">
            <span>Abilities</span>
            <div>{renderAbilities(encounter.abilities, "Unknown")}</div>
            {encounter.hiddenAbilities.length ? (
              <div className="hidden-ability-row">
                <img src={assetPath("/assets/ha.png")} alt="Hidden ability" />
                {renderAbilities(encounter.hiddenAbilities, "None")}
              </div>
            ) : null}
          </div>

          <div className="encounter-card__footer">
            <span>Rarity {rarityLabel}</span>
            <button type="button" onClick={() => setIsDetailOpen(true)}>
              Details
            </button>
          </div>
        </div>
      </article>

      {isDetailOpen ? (
        <PokemonDetailModal encounterGroup={encounterGroup} onClose={() => setIsDetailOpen(false)} />
      ) : null}
    </>
  );
}
