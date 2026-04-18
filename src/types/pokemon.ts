export interface PokemonSpriteSet {
  front_default?: string | null;
  front_shiny?: string | null;
  back_default?: string | null;
  back_shiny?: string | null;
  official_artwork?: string | null;
  [key: string]: string | null | undefined;
}

export interface PokemonTypeSlot {
  slot?: number;
  type?: {
    name: string;
    url?: string;
  };
  name?: string;
}

export interface PokemonAbilitySlot {
  ability?: {
    name: string;
    url?: string;
  };
  name?: string;
  ability_name?: string;
  is_hidden?: boolean;
  slot?: number;
}

export interface PokemonStatSlot {
  stat_name?: string;
  base_stat?: number;
  effort?: number;
  stat?: {
    name: string;
    url?: string;
  };
}

export interface LocationAreaEncounter {
  region_name?: string;
  region_id?: number | string;
  location: string;
  type?: string;
  min_level?: number;
  max_level?: number;
  rarity?: string | number;
  [key: string]: unknown;
}

export interface PokemonMoveReference {
  id?: number;
  name?: string;
  type?: string;
  level?: number;
  [key: string]: unknown;
}

export interface PokemonJsonRecord {
  id?: number;
  name: string;
  capture_rate?: number;
  catch_rate?: number;
  sprites?: PokemonSpriteSet;
  types?: Array<PokemonTypeSlot | string>;
  abilities?: Array<PokemonAbilitySlot | string>;
  stats?: PokemonStatSlot[];
  shiny_tier?: string | number | null;
  shiny_points?: number | null;
  pvp?: unknown;
  moves?: PokemonMoveReference[];
  location_area_encounters?: LocationAreaEncounter[];
  [key: string]: unknown;
}

export type PokemonJsonDictionary = Record<string, Partial<PokemonJsonRecord>>;
export type TimeOfDay = "Morning" | "Day" | "Night";
export type EvYieldStat = "hp" | "attack" | "defense" | "special-attack" | "special-defense" | "speed";

export interface EvYield {
  stat: EvYieldStat;
  amount: number;
}

export interface PokemonEncounter {
  pokemonId?: number;
  name: string;
  spriteUrl?: string;
  captureRate?: number;
  types: string[];
  abilities: string[];
  hiddenAbilities: string[];
  evYields: EvYield[];
  shinyTier?: string | number | null;
  shinyPoints?: number | null;
  pvp?: unknown;
  regionName: string;
  regionId?: number | string;
  location: string;
  rawLocation: string;
  normalizedLocation: string;
  encounterType: string;
  minLevel?: number;
  maxLevel?: number;
  rarity: string;
  timeOfDay: TimeOfDay[];
  locationTags: string[];
  rawPokemon: PokemonJsonRecord;
  rawEncounter: LocationAreaEncounter;
}

export interface PokemonEncounterGroup {
  groupKey: string;
  pokemon: PokemonEncounter;
  encounters: PokemonEncounter[];
  encounterTypes: string[];
  rarities: string[];
  routeNames: string[];
  routeRegions: Array<{
    regionName: string;
    routeNames: string[];
  }>;
  timeOfDay: TimeOfDay[];
  minLevel?: number;
  maxLevel?: number;
}

export interface RouteEncounterGroup {
  routeKey: string;
  displayName: string;
  regionName: string;
  regionId?: number | string;
  isNavigationOnly?: boolean;
  mapRouteKey?: string;
  encounters: PokemonEncounter[];
  encounterTypes: string[];
  rarities: string[];
  timeOfDayOptions: TimeOfDay[];
  minLevel?: number;
  maxLevel?: number;
}

export interface RegionRouteGroup {
  regionKey: string;
  displayName: string;
  regionId?: number | string;
  routes: RouteEncounterGroup[];
}

export interface RouteIndex {
  regions: RegionRouteGroup[];
  regionByKey: Record<string, RegionRouteGroup>;
  routeByKey: Record<string, RouteEncounterGroup>;
}

export interface MoveTranslation {
  name?: string;
  effect?: string;
}

export interface MovePokemonReference {
  name: string;
  id: number;
}

export interface MoveDataRecord {
  id: number;
  name: string;
  accuracy: number | null;
  effect_chance: number | null;
  pp: number | null;
  priority: number;
  power: number | null;
  damage_class: string;
  type: string;
  effect: string;
  name_translations?: Record<string, MoveTranslation>;
  effect_translations?: Record<string, MoveTranslation>;
  learned_by_pokemon?: MovePokemonReference[];
  [key: string]: unknown;
}

export interface MoveDataFile {
  generated_at: string;
  source: string;
  move_count: number;
  failed_move_ids: number[];
  moves: Record<string, MoveDataRecord>;
}

export type EncounterSortKey = "pokedexNumber" | "name" | "captureRate" | "level" | "rarity";
export type SortDirection = "asc" | "desc";

export interface EncounterFilters {
  search: string;
  regionNames: string[];
  encounterType: string;
  rarity: string;
  evYieldStat: EvYieldStat | "";
  timeOfDay: TimeOfDay | "";
  sortKey: EncounterSortKey;
  sortDirection: SortDirection;
}
