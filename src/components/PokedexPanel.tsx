import { useMemo, useState } from "react";
import { getHeldItemsForPokemon } from "../data/heldItemsData";
import { formatAbilityName } from "../features/pokemon/formatPokemon";
import { buildPokedexGroups, filterAndSortPokedexGroups } from "../features/pokemon/pokedexSearch";
import type { EncounterFilters, EvYieldStat, PokemonEncounterGroup, PokemonJsonRecord, PokemonMoveReference } from "../types/pokemon";
import { EmptyState } from "./EmptyState";
import { FiltersToolbar } from "./FiltersToolbar";
import { PokemonEncounterCard } from "./PokemonEncounterCard";

interface PokedexPanelProps {
  pokemonRecords: PokemonJsonRecord[];
  filters: EncounterFilters;
  onFiltersChange: (filters: EncounterFilters) => void;
  onFiltersReset: () => void;
}

interface FilterOption {
  value: string;
  label: string;
}

function sortEvYieldStats(stats: EvYieldStat[]): EvYieldStat[] {
  const order: EvYieldStat[] = ["hp", "attack", "defense", "special-attack", "special-defense", "speed"];
  const statSet = new Set(stats);

  return order.filter((stat) => statSet.has(stat));
}

function uniqueOptions(options: FilterOption[]): FilterOption[] {
  const optionByValue = new Map<string, FilterOption>();

  for (const option of options) {
    if (!optionByValue.has(option.value)) {
      optionByValue.set(option.value, option);
    }
  }

  return Array.from(optionByValue.values()).sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));
}

function getAbilityOptions(groups: PokemonEncounterGroup[]): FilterOption[] {
  return uniqueOptions(
    groups.flatMap((group) =>
      [...group.pokemon.abilities, ...group.pokemon.hiddenAbilities].map((ability) => ({
        value: ability,
        label: formatAbilityName(ability)
      }))
    )
  );
}

function getHeldItemOptions(groups: PokemonEncounterGroup[]): FilterOption[] {
  return uniqueOptions(
    groups.flatMap((group) =>
      getHeldItemsForPokemon(group.pokemon.pokemonId).map((heldItem) => ({
        value: `${heldItem.id}`,
        label: heldItem.name
      }))
    )
  );
}

function getMoveOptions(groups: PokemonEncounterGroup[]): FilterOption[] {
  return uniqueOptions(
    groups.flatMap((group) =>
      (group.pokemon.rawPokemon.moves ?? [])
        .filter((move): move is PokemonMoveReference & { id: number } => typeof move.id === "number")
        .map((move) => ({
          value: `${move.id}`,
          label: formatAbilityName(move.name ?? `Move ${move.id}`)
        }))
    )
  );
}

export function PokedexPanel({ pokemonRecords, filters, onFiltersChange, onFiltersReset }: PokedexPanelProps) {
  const [areFiltersOpen, setAreFiltersOpen] = useState(true);
  const allGroups = useMemo(() => buildPokedexGroups(pokemonRecords), [pokemonRecords]);
  const filteredGroups = useMemo(() => filterAndSortPokedexGroups(allGroups, filters), [allGroups, filters]);
  const evYieldStats = useMemo(
    () =>
      sortEvYieldStats(
        allGroups.flatMap((group) => group.pokemon.evYields.map((evYield) => evYield.stat))
      ),
    [allGroups]
  );
  const abilityOptions = useMemo(() => getAbilityOptions(allGroups), [allGroups]);
  const heldItemOptions = useMemo(() => getHeldItemOptions(allGroups), [allGroups]);
  const moveOptions = useMemo(() => getMoveOptions(allGroups), [allGroups]);

  return (
    <div className="route-details pokedex-panel">
      <header className="route-details__header">
        <div>
          <p className="eyebrow">Pokedex</p>
          <h2>All Pokemon</h2>
          <p className="route-subtitle">Search every Pokemon in the JSON, including non-wild entries.</p>
        </div>
        <span>{filteredGroups.length} Pokemon</span>
      </header>

      <section className="search-parameters">
        <button
          className="search-parameters__toggle"
          type="button"
          aria-expanded={areFiltersOpen}
          onClick={() => setAreFiltersOpen((currentValue) => !currentValue)}
        >
          <span>Search parameters</span>
          <span>{areFiltersOpen ? "Collapse" : "Expand"}</span>
        </button>

        {areFiltersOpen ? (
          <div className="search-parameters__body">
            <FiltersToolbar
              filters={filters}
              encounterTypes={[]}
              rarities={[]}
              evYieldStats={evYieldStats}
              abilityOptions={abilityOptions}
              heldItemOptions={heldItemOptions}
              moveOptions={moveOptions}
              regionOptions={[]}
              showEncounterFilters={false}
              showRegionFilter={false}
              onChange={onFiltersChange}
              onReset={onFiltersReset}
            />
          </div>
        ) : null}
      </section>

      {filteredGroups.length ? (
        <div className="encounter-list">
          {filteredGroups.map((group) => (
            <PokemonEncounterCard key={group.groupKey} encounterGroup={group} showRoutes={Boolean(group.routeRegions.length)} />
          ))}
        </div>
      ) : (
        <EmptyState title="No Pokemon found" message="Adjust the Pokedex filters." />
      )}
    </div>
  );
}
