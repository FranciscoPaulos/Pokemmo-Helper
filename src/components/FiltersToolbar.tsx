import { useEffect, useState } from "react";
import type { EncounterFilters, EncounterSortKey, EvYieldStat, SortDirection } from "../types/pokemon";
import { formatStatName } from "../features/pokemon/formatPokemon";

interface FiltersToolbarProps {
  filters: EncounterFilters;
  encounterTypes: string[];
  rarities: string[];
  hordeSizeOptions: Array<3 | 5>;
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
  hordeSizeOptions,
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
    setMoveSearch("");
  }, [filters.moveIds]);

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
    filterKey: "abilityName" | "heldItemId",
    setTypedValue: (value: string) => void
  ) {
    const selectedOption = findOptionByTypedLabel(options, typedValue);

    setTypedValue(typedValue);
    updateFilter(filterKey, selectedOption?.value ?? "");
  }

  const selectedMoveOptions = filters.moveIds
    .map((moveId) => moveOptions.find((option) => option.value === moveId))
    .filter((option): option is FilterOption => Boolean(option));

  const moveSuggestions = moveOptions
    .filter((option) => !filters.moveIds.includes(option.value))
    .filter((option) => {
      const normalizedSearch = moveSearch.trim().toLowerCase();

      return !normalizedSearch || option.label.toLowerCase().includes(normalizedSearch);
    })
    .slice(0, 8);

  function addMoveFilter(option: FilterOption) {
    if (filters.moveIds.includes(option.value)) {
      setMoveSearch("");
      return;
    }

    updateFilter("moveIds", [...filters.moveIds, option.value]);
    setMoveSearch("");
  }

  function removeMoveFilter(moveId: string) {
    updateFilter(
      "moveIds",
      filters.moveIds.filter((selectedMoveId) => selectedMoveId !== moveId)
    );
  }

  function commitTypedMove() {
    const selectedOption = findOptionByTypedLabel(moveOptions, moveSearch);

    if (!selectedOption) {
      return false;
    }

    addMoveFilter(selectedOption);
    return true;
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

      {hordeSizeOptions.length ? (
        <label>
          Horde Size
          <select
            value={filters.hordeSize}
            onChange={(event) => updateFilter("hordeSize", event.target.value as EncounterFilters["hordeSize"])}
          >
            <option value="">All hordes</option>
            {hordeSizeOptions.map((hordeSize) => (
              <option key={hordeSize} value={`${hordeSize}`}>
                x{hordeSize}
              </option>
            ))}
          </select>
        </label>
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
        <div className="multi-select-filter">
          {selectedMoveOptions.length ? (
            <div className="multi-select-filter__chips">
              {selectedMoveOptions.map((move) => (
                <button
                  key={move.value}
                  className="multi-select-filter__chip"
                  type="button"
                  onClick={() => removeMoveFilter(move.value)}
                >
                  <span>{move.label}</span>
                  <strong>×</strong>
                </button>
              ))}
            </div>
          ) : null}

          <div className="multi-select-filter__input-wrap">
            <input
              value={moveSearch}
              onBlur={() => {
                commitTypedMove();
              }}
              onChange={(event) => setMoveSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === ",") {
                  if (commitTypedMove()) {
                    event.preventDefault();
                  }
                }

                if (event.key === "Backspace" && !moveSearch && filters.moveIds.length) {
                  removeMoveFilter(filters.moveIds[filters.moveIds.length - 1]);
                }
              }}
              placeholder={selectedMoveOptions.length ? "Add another move" : "Type a move"}
            />

            {moveSuggestions.length && moveSearch.trim() ? (
              <div className="multi-select-filter__suggestions" role="listbox" aria-label="Move suggestions">
                {moveSuggestions.map((move) => (
                  <button key={move.value} type="button" onMouseDown={() => addMoveFilter(move)}>
                    {move.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
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
