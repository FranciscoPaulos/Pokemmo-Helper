import { useState } from "react";
import { getHeldItemsForPokemon } from "../data/heldItemsData";
import type { PokemonEncounterGroup } from "../types/pokemon";
import { formatEvYieldList, formatPokemonName, formatValue } from "../features/pokemon/formatPokemon";
import { AbilityTooltip } from "./AbilityTooltip";
import { PokemonDetailModal } from "./PokemonDetailModal";

interface PokemonEncounterCardProps {
  encounterGroup: PokemonEncounterGroup;
  showRoutes?: boolean;
}

export function PokemonEncounterCard({ encounterGroup, showRoutes = false }: PokemonEncounterCardProps) {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const encounter = encounterGroup.pokemon;
  const heldItems = getHeldItemsForPokemon(encounter.pokemonId);

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

  function renderRouteRegions() {
    return (
      <div className="route-region-list">
        {encounterGroup.routeRegions.map((routeRegion) => (
          <div key={routeRegion.regionName} className="route-region-list__row">
            <strong>{routeRegion.regionName}</strong>
            <span>{routeRegion.routeNames.join(", ")}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <article className="encounter-card">
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
          <div className="encounter-card__title-row">
            <h3>
              <button className="pokemon-name-button" type="button" onClick={() => setIsDetailOpen(true)}>
                {formatPokemonName(encounter.name)}
              </button>
            </h3>
            <span className="rarity-pill">{encounterGroup.rarities.join(", ")}</span>
          </div>

          <div className="type-row">
            {encounter.types.length ? (
              encounter.types.map((type) => <span key={type}>{type}</span>)
            ) : (
              <span>Unknown</span>
            )}
          </div>

          <dl className="stat-grid">
            <div>
              <dt>Catch rate</dt>
              <dd>{formatValue(encounter.captureRate)}</dd>
            </div>
            <div>
              <dt>Encounter</dt>
              <dd>{encounterGroup.encounterTypes.join(", ")}</dd>
            </div>
            <div>
              <dt>Level</dt>
              <dd>
                {formatValue(encounterGroup.minLevel)}-{formatValue(encounterGroup.maxLevel)}
              </dd>
            </div>
            <div>
              <dt>Abilities</dt>
              <dd>{renderAbilities(encounter.abilities, "Unknown")}</dd>
            </div>
            <div>
              <dt>Time</dt>
              <dd>{encounterGroup.timeOfDay.length ? encounterGroup.timeOfDay.join(", ") : "Any"}</dd>
            </div>
            <div>
              <dt>Season</dt>
              <dd>{encounterGroup.seasons.length ? encounterGroup.seasons.join(", ") : "Any"}</dd>
            </div>
            <div>
              <dt>Hidden Ability</dt>
              <dd>{renderAbilities(encounter.hiddenAbilities, "None")}</dd>
            </div>
            <div>
              <dt>Held Items</dt>
              <dd>{heldItems.length ? heldItems.map((item) => item.name).join(", ") : "None"}</dd>
            </div>
            <div>
              <dt>EV Yield</dt>
              <dd>{formatEvYieldList(encounter.evYields)}</dd>
            </div>
            {showRoutes ? (
              <div className="stat-grid__wide">
                <dt>Routes</dt>
                <dd>{renderRouteRegions()}</dd>
              </div>
            ) : null}
          </dl>
        </div>
      </article>

      {isDetailOpen ? (
        <PokemonDetailModal encounterGroup={encounterGroup} onClose={() => setIsDetailOpen(false)} />
      ) : null}
    </>
  );
}
