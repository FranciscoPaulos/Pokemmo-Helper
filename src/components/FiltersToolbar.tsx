import { useEffect, useState } from "react";
import type { EncounterFilters, EncounterSortKey, EvYieldStat, Season, SortDirection, TimeOfDay } from "../types/pokemon";
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
  timeOfDayOptions?: TimeOfDay[];
  seasonOptions?: Season[];
  showEncounterFilters?: boolean;
  showAvailabilityFilter?: boolean;
  showSearchFilter?: boolean;
  showRegionFilter: boolean;
  onChange: (filters: EncounterFilters) => void;
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

function getDisplayLabel(options: FilterOption[], selectedValue: string, fallback = selectedValue): string {
  return getSelectedOptionLabel(options, selectedValue) || fallback;
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
  timeOfDayOptions = [],
  seasonOptions = [],
  showEncounterFilters = true,
  showAvailabilityFilter = false,
  showSearchFilter = true,
  showRegionFilter,
  onChange
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

  const activeFilterChips = [
    ...(showRegionFilter
      ? filters.regionNames.map((regionName) => ({
          key: `region-${regionName}`,
          label: regionName,
          onClear: () =>
            updateFilter(
              "regionNames",
              filters.regionNames.filter((selectedRegionName) => selectedRegionName !== regionName)
            )
        }))
      : []),
    filters.timeOfDay
      ? {
          key: "time",
          label: `Time: ${filters.timeOfDay}`,
          onClear: () => updateFilter("timeOfDay", "")
        }
      : undefined,
    filters.season
      ? {
          key: "season",
          label: `Season: ${filters.season}`,
          onClear: () => updateFilter("season", "")
        }
      : undefined,
    filters.encounterType
      ? {
          key: "encounter",
          label: `Encounter: ${filters.encounterType}`,
          onClear: () => updateFilter("encounterType", "")
        }
      : undefined,
    filters.rarity
      ? {
          key: "rarity",
          label: `Rarity: ${filters.rarity}`,
          onClear: () => updateFilter("rarity", "")
        }
      : undefined,
    filters.hordeSize
      ? {
          key: "horde",
          label: `Horde: x${filters.hordeSize}`,
          onClear: () => updateFilter("hordeSize", "")
        }
      : undefined,
    filters.evYieldStat
      ? {
          key: "ev",
          label: `EV: ${formatStatName(filters.evYieldStat)}`,
          onClear: () => updateFilter("evYieldStat", "")
        }
      : undefined,
    filters.abilityName
      ? {
          key: "ability",
          label: `Ability: ${getDisplayLabel(abilityOptions, filters.abilityName)}`,
          onClear: () => updateFilter("abilityName", "")
        }
      : undefined,
    filters.heldItemId
      ? {
          key: "item",
          label: `Item: ${getDisplayLabel(heldItemOptions, filters.heldItemId)}`,
          onClear: () => updateFilter("heldItemId", "")
        }
      : undefined,
    ...selectedMoveOptions.map((move) => ({
      key: `move-${move.value}`,
      label: `Move: ${move.label}`,
      onClear: () => removeMoveFilter(move.value)
    }))
  ].filter((chip): chip is { key: string; label: string; onClear: () => void } => Boolean(chip));

  return (
    <div className="filters-toolbar">
      {showSearchFilter ? (
        <section className="filter-section">
          <div className="filter-section__header">
            <h3>Search</h3>
          </div>
          <div className="filter-grid">
            <label>
              Pokemon
              <input
                value={filters.search}
                onChange={(event) => updateFilter("search", event.target.value)}
                placeholder="Pokemon name"
              />
            </label>
          </div>
        </section>
      ) : null}

      {showRegionFilter ? (
        <section className="filter-section filter-section--regions">
          <div className="filter-section__header">
            <h3>Regions</h3>
          </div>
          <fieldset className="region-filter">
            <legend>Regions</legend>
            <div className="region-filter__options">
              {regionOptions.map((regionName) => {
                const isSelected = filters.regionNames.includes(regionName);

                return (
                  <button
                    key={regionName}
                    type="button"
                    className={`region-filter__option${isSelected ? " is-selected" : ""}`}
                    aria-pressed={isSelected}
                    onClick={() => toggleRegion(regionName)}
                  >
                    {regionName}
                  </button>
                );
              })}
            </div>
          </fieldset>
        </section>
      ) : null}

      <section className="filter-section">
        <div className="filter-section__header">
          <h3>Encounter</h3>
        </div>
        <div className="filter-grid">
          {showEncounterFilters ? (
            <>
              <label>
                Encounter Type
                <select
                  value={filters.encounterType}
                  onChange={(event) => updateFilter("encounterType", event.target.value)}
                >
                  <option value="">All methods</option>
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

          {showAvailabilityFilter ? (
            <>
              <label>
                Time
                <select
                  value={filters.timeOfDay}
                  onChange={(event) => updateFilter("timeOfDay", event.target.value as TimeOfDay | "")}
                >
                  <option value="">Any time</option>
                  {timeOfDayOptions.map((timeOfDay) => (
                    <option key={timeOfDay} value={timeOfDay}>
                      {timeOfDay}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Season
                <select
                  value={filters.season}
                  onChange={(event) => updateFilter("season", event.target.value as Season | "")}
                >
                  <option value="">Any season</option>
                  {seasonOptions.map((season) => (
                    <option key={season} value={season}>
                      {season}
                    </option>
                  ))}
                </select>
              </label>
            </>
          ) : null}
        </div>
      </section>

      <section className="filter-section">
        <div className="filter-section__header">
          <h3>Pokemon traits</h3>
        </div>
        <div className="filter-grid">
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

          <label className="filter-grid__wide">
            Moves
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
                      <strong>x</strong>
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
        </div>
      </section>

      <section className="filter-section">
        <div className="filter-section__header">
          <h3>Results</h3>
        </div>
        <div className="filter-grid filter-grid--with-action">
          <label>
            Sort by
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
        </div>
      </section>

      <div className="filter-summary">
        <div>
          <p className="filter-summary__eyebrow">Active filters</p>
          {activeFilterChips.length ? (
            <div className="active-filter-chips" aria-label="Active filters">
              {activeFilterChips.map((chip) => (
                <button key={chip.key} className="active-filter-chip" type="button" onClick={chip.onClear}>
                  <span>{chip.label}</span>
                  <strong>x</strong>
                </button>
              ))}
            </div>
          ) : (
            <p className="active-filter-empty">No advanced filters applied.</p>
          )}
        </div>
      </div>
    </div>
  );
}
