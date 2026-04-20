import type { Season, TimeOfDay } from "../types/pokemon";

export interface PokeMmoClockState {
  season: Season;
  seasonMonth: string;
  phase: TimeOfDay;
  gameTime: string;
  nextPhase: TimeOfDay;
  nextPhaseIn: string;
}

const seasonByMonth: Array<{ month: string; season: Season }> = [
  { month: "Jan", season: "Spring" },
  { month: "Feb", season: "Summer" },
  { month: "Mar", season: "Autumn" },
  { month: "Apr", season: "Winter" },
  { month: "May", season: "Spring" },
  { month: "Jun", season: "Summer" },
  { month: "Jul", season: "Autumn" },
  { month: "Aug", season: "Winter" },
  { month: "Sep", season: "Spring" },
  { month: "Oct", season: "Summer" },
  { month: "Nov", season: "Autumn" },
  { month: "Dec", season: "Winter" }
];

function padTimePart(value: number): string {
  return value.toString().padStart(2, "0");
}

function formatClockTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${padTimePart(hours)}:${padTimePart(minutes)}`;
}

function formatDuration(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes}m`;
  }

  return `${hours}h ${padTimePart(minutes)}m`;
}

function getPhase(gameMinutes: number): TimeOfDay {
  if (gameMinutes >= 240 && gameMinutes < 660) {
    return "Morning";
  }

  if (gameMinutes >= 660 && gameMinutes < 1260) {
    return "Day";
  }

  return "Night";
}

function getNextPhaseInfo(gameMinutes: number): { nextPhase: TimeOfDay; nextPhaseAt: number } {
  if (gameMinutes < 240) {
    return { nextPhase: "Morning", nextPhaseAt: 240 };
  }

  if (gameMinutes < 660) {
    return { nextPhase: "Day", nextPhaseAt: 660 };
  }

  if (gameMinutes < 1260) {
    return { nextPhase: "Night", nextPhaseAt: 1260 };
  }

  return { nextPhase: "Morning", nextPhaseAt: 1680 };
}

export function getCurrentSeason(date = new Date()): { month: string; season: Season } {
  return seasonByMonth[date.getMonth()];
}

export function getPokeMmoClockState(date = new Date()): PokeMmoClockState {
  const utcMinutes = date.getUTCHours() * 60 + date.getUTCMinutes();
  const gameMinutes = (utcMinutes % 360) * 4;
  const { month, season } = getCurrentSeason(date);
  const { nextPhase, nextPhaseAt } = getNextPhaseInfo(gameMinutes);
  const realMinutesUntilNextPhase = Math.ceil((nextPhaseAt - gameMinutes) / 4);

  return {
    season,
    seasonMonth: month,
    phase: getPhase(gameMinutes),
    gameTime: formatClockTime(gameMinutes),
    nextPhase,
    nextPhaseIn: formatDuration(realMinutesUntilNextPhase)
  };
}
