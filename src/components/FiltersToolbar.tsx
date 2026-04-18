import type { EncounterFilters, EncounterSortKey, EvYieldStat, SortDirection } from "../types/pokemon";
import { formatStatName } from "../features/pokemon/formatPokemon";

interface FiltersToolbarProps {
  filters: EncounterFilters;
  encounterTypes: string[];
  rarities: string[];
  evYieldStats: EvYieldStat[];
  regionOptions: string[];
  showRegionFilter: boolean;
  onChange: (filters: EncounterFilters) => void;
  onReset: () => void;
}

const sortOptions: Array<{ value: EncounterSortKey; label: string }> = [
  { value: "pokedexNumber", label: "Pokedex number" },
  { value: "name", label: "Name" },
  { value: "captureRate", label: "Catch rate" },
  { value: "level", label: "Level" },
  { value: "rarity", label: "Rarity" }
];

export function FiltersToolbar({
  filters,
  encounterTypes,
  rarities,
  evYieldStats,
  regionOptions,
  showRegionFilter,
  onChange,
  onReset
}: FiltersToolbarProps) {
  function updateFilter<Key extends keyof EncounterFilters>(key: Key, value: EncounterFilters[Key]) {
    onChange({ ...filters, [key]: value });
  }

  function toggleRegion(regionName: string) {
    const regionNames = filters.regionNames.includes(regionName)
      ? filters.regionNames.filter((selectedRegionName) => selectedRegionName !== regionName)
      : [...filters.regionNames, regionName];

    updateFilter("regionNames", regionNames);
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

      <label>
        Encounter
        <select value={filters.encounterType} onChange={(event) => updateFilter("encounterType", event.target.value)}>
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
