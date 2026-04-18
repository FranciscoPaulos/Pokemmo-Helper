import type { TimeOfDay } from "../types/pokemon";
import { getLocationTags } from "./normalizeLocation";

const timeOrder: TimeOfDay[] = ["Morning", "Day", "Night"];

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

export function getNonTimeLocationTags(location: string): string[] {
  return getLocationTags(location).filter((tag) => !normalizeTimeTag(tag));
}

export function sortTimesOfDay(times: Iterable<TimeOfDay>): TimeOfDay[] {
  const timeSet = new Set(times);

  return timeOrder.filter((time) => timeSet.has(time));
}
