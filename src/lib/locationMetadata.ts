import type { Season, TimeOfDay } from "../types/pokemon";
import { getLocationTags } from "./normalizeLocation";

const timeOrder: TimeOfDay[] = ["Morning", "Day", "Night"];
const seasonOrder: Season[] = ["Spring", "Summer", "Autumn", "Winter"];

function normalizeTimeTag(tag: string): TimeOfDay | undefined {
  const normalized = tag.trim().toLowerCase();

  if (normalized === "morning") {
    return "Morning";
  }

  if (normalized === "day") {
    return "Day";
  }

  if (normalized === "night") {
    return "Night";
  }

  return undefined;
}

function normalizeSeasonTag(tag: string): Season | undefined {
  const normalized = tag.trim().toLowerCase().replace(/\s+/g, "");
  const seasonByTag: Record<string, Season> = {
    season0: "Spring",
    spring: "Spring",
    season1: "Summer",
    summer: "Summer",
    season2: "Autumn",
    autumn: "Autumn",
    fall: "Autumn",
    season3: "Winter",
    winter: "Winter"
  };

  return seasonByTag[normalized];
}

export function getTimeOfDayTags(location: string): TimeOfDay[] {
  const times = new Set<TimeOfDay>();

  for (const tag of getLocationTags(location)) {
    const time = normalizeTimeTag(tag);

    if (time) {
      times.add(time);
    }
  }

  return timeOrder.filter((time) => times.has(time));
}

export function getSeasonTags(location: string): Season[] {
  const seasons = new Set<Season>();

  for (const tag of getLocationTags(location)) {
    const season = normalizeSeasonTag(tag);

    if (season) {
      seasons.add(season);
    }
  }

  return seasonOrder.filter((season) => seasons.has(season));
}

export function getNonTimeLocationTags(location: string): string[] {
  return getLocationTags(location).filter((tag) => !normalizeTimeTag(tag) && !normalizeSeasonTag(tag));
}

export function sortTimesOfDay(times: Iterable<TimeOfDay>): TimeOfDay[] {
  const timeSet = new Set(times);

  return timeOrder.filter((time) => timeSet.has(time));
}

export function sortSeasons(seasons: Iterable<Season>): Season[] {
  const seasonSet = new Set(seasons);

  return seasonOrder.filter((season) => seasonSet.has(season));
}
