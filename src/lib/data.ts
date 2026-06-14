import { getStore } from "./store";
import { computeStandings, computeTitles } from "./scoring";
import type {
  LeagueTitles,
  Match,
  Player,
  ScheduleEntry,
  StandingRow,
} from "./types";

export { formatDate, formatPoints } from "./format";

export function partitionSchedule(
  schedule: ScheduleEntry[],
  reference: Date = new Date(),
): { upcoming: ScheduleEntry[]; past: ScheduleEntry[] } {
  const cutoff = reference.getTime();
  const upcoming = schedule.filter(
    (s) => new Date(s.scheduledAt).getTime() >= cutoff,
  );
  const past = schedule
    .filter((s) => new Date(s.scheduledAt).getTime() < cutoff)
    .reverse();
  return { upcoming, past };
}

export async function loadLeagueSnapshot(): Promise<{
  players: Player[];
  activePlayers: Player[];
  matches: Match[];
  schedule: ScheduleEntry[];
  standings: StandingRow[];
  titles: LeagueTitles;
}> {
  const store = getStore();
  const [players, matches, schedule] = await Promise.all([
    store.getPlayers(),
    store.getMatches(),
    store.getSchedule(),
  ]);
  const activePlayers = players.filter((p) => p.active);
  const standings = computeStandings(activePlayers, matches);
  const titles = computeTitles(activePlayers, matches, standings);
  return { players, activePlayers, matches, schedule, standings, titles };
}
