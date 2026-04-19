import { useEffect, useState } from "react";
import type { EncounterFilters, EncounterSortKey, EvYieldStat, SortDirection } from "../types/pokemon";
import { formatStatName } from "../features/pokemon/formatPokemon";

interface FiltersToolbarProps {
  filters: EncounterFilters;
  encounterTypes: string[];
  rarities: string[];
  evYieldStats: EvYieldStat[];
  abilityOptions: FilterOption[];
  heldItemOptions: FilterOption[];
  moveOptions: FilterOption[];
  regionOptions: string[];
  showEncounterFilters?: boolean;
  showRegionFilter: boolean;
  onChange: (filters: EncounterFilters) => void;
  onReset: () => void;
}

interface FilterOption {
  value: string;
  label: string;
}

const sortOptions: Array<{ value: EncounterSortKey; label: string }> = [
  { value: "pokedexNumber", label: "Pokedex number" },
  { value: "name", label: "Name" },
  { value: "captureRate", label: "Catch rate" },
  { value: "level", label: "Level" },
  { value: "rarity", label: "Rarity" }
];

function getSelectedOptionLabel(options: FilterOption[], selectedValue: string): string {
  return options.find((option) => option.value === selectedValue)?.label ?? "";
}

function findOptionByTypedLabel(options: FilterOption[], typedLabel: string): FilterOption | undefined {
  const normalizedLabel = typedLabel.trim().toLowerCase();

  if (!normalizedLabel) {
    return undefined;
  }

  return options.find((option) => option.label.toLowerCase() === normalizedLabel);
}

export function FiltersToolbar({
  filters,
  encounterTypes,
  rarities,
  evYieldStats,
  abilityOptions,
  heldItemOptions,
  moveOptions,
  regionOptions,
  showEncounterFilters = true,
  showRegionFilter,
  onChange,
  onReset
}: FiltersToolbarProps) {
  const [abilitySearch, setAbilitySearch] = useState("");
  const [heldItemSearch, setHeldItemSearch] = useState("");
  const [moveSearch, setMoveSearch] = useState("");

  useEffect(() => {
    setAbilitySearch(getSelectedOptionLabel(abilityOptions, filters.abilityName));
  }, [filters.abilityName, abilityOptions]);

  useEffect(() => {
    setHeldItemSearch(getSelectedOptionLabel(heldItemOptions, filters.heldItemId));
  }, [filters.heldItemId, heldItemOptions]);

  useEffect(() => {
    setMoveSearch(getSelectedOptionLabel(moveOptions, filters.moveId));
  }, [filters.moveId, moveOptions]);

  function updateFilter<Key extends keyof EncounterFilters>(key: Key, value: EncounterFilters[Key]) {
    onChange({ ...filters, [key]: value });
  }

  function toggleRegion(regionName: string) {
    const regionNames = filters.regionNames.includes(regionName)
      ? filters.regionNames.filter((selectedRegionName) => selectedRegionName !== regionName)
      : [...filters.regionNames, regionName];

    updateFilter("regionNames", regionNames);
  }

  function updateSearchableFilter(
    typedValue: string,
    options: FilterOption[],
    filterKey: "abilityName" | "heldItemId" | "moveId",
    setTypedValue: (value: string) => void
  ) {
    const selectedOption = findOptionByTypedLabel(options, typedValue);

    setTypedValue(typedValue);
    updateFilter(filterKey, selectedOption?.value ?? "");
  }

  return (
    <div className="filters-toolbar">
      <label>
        Search
        <input
          value={filters.search}
          onChange={(event) => updateFilter("search", event.target.value)}
          placeholder="Pokemon name"
        />
      </label>

      {showRegionFilter ? (
        <fieldset className="region-filter">
          <legend>Region</legend>
          <div className="region-filter__options">
            {regionOptions.map((regionName) => (
              <label key={regionName} className="region-filter__option">
                <input
                  type="checkbox"
                  checked={filters.regionNames.includes(regionName)}
                  onChange={() => toggleRegion(regionName)}
                />
                <span>{regionName}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      {showEncounterFilters ? (
        <>
          <label>
            Encounter
            <select
              value={filters.encounterType}
              onChange={(event) => updateFilter("encounterType", event.target.value)}
            >
              <option value="">All types</option>
              {encounterTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>

          <label>
            Rarity
            <select value={filters.rarity} onChange={(event) => updateFilter("rarity", event.target.value)}>
              <option value="">All rarities</option>
              {rarities.map((rarity) => (
                <option key={rarity} value={rarity}>
                  {rarity}
                </option>
              ))}
            </select>
          </label>
        </>
      ) : null}

      <label>
        EV Yield
        <select
          value={filters.evYieldStat}
          onChange={(event) => updateFilter("evYieldStat", event.target.value as EvYieldStat | "")}
        >
          <option value="">All EVs</option>
          {evYieldStats.map((stat) => (
            <option key={stat} value={stat}>
              {formatStatName(stat)}
            </option>
          ))}
        </select>
      </label>

      <label>
        Ability
        <input
          list="ability-options"
          value={abilitySearch}
          onChange={(event) =>
            updateSearchableFilter(event.target.value, abilityOptions, "abilityName", setAbilitySearch)
          }
          placeholder="Type an ability"
        />
        <datalist id="ability-options">
          {abilityOptions.map((ability) => (
            <option key={ability.value} value={ability.label} />
          ))}
        </datalist>
      </label>

      <label>
        Held Item
        <input
          list="held-item-options"
          value={heldItemSearch}
          onChange={(event) =>
            updateSearchableFilter(event.target.value, heldItemOptions, "heldItemId", setHeldItemSearch)
          }
          placeholder="Type an item"
        />
        <datalist id="held-item-options">
          {heldItemOptions.map((item) => (
            <option key={item.value} value={item.label} />
          ))}
        </datalist>
      </label>

      <label>
        Move
        <input
          list="move-options"
          value={moveSearch}
          onChange={(event) => updateSearchableFilter(event.target.value, moveOptions, "moveId", setMoveSearch)}
          placeholder="Type a move"
        />
        <datalist id="move-options">
          {moveOptions.map((move) => (
            <option key={move.value} value={move.label} />
          ))}
        </datalist>
      </label>

      <label>
        Sort
        <select
          value={filters.sortKey}
          onChange={(event) => updateFilter("sortKey", event.target.value as EncounterSortKey)}
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label>
        Direction
        <select
          value={filters.sortDirection}
          onChange={(event) => updateFilter("sortDirection", event.target.value as SortDirection)}
        >
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </label>

      <button className="filters-reset-button" type="button" onClick={onReset}>
        Reset
      </button>
    </div>
  );
}
