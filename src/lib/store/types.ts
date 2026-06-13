import type {
  Match,
  MatchResult,
  Player,
  ScheduleEntry,
  ScoringConfig,
} from "../types";

export interface DataStore {
  getPlayers(): Promise<Player[]>;
  addPlayer(name: string): Promise<Player>;
  updatePlayer(
    id: string,
    patch: Partial<Pick<Player, "name" | "active" | "avatarDataUrl">>,
  ): Promise<Player>;
  deletePlayer(id: string): Promise<void>;
  countPlayerMatches(id: string): Promise<number>;

  getMatches(): Promise<Match[]>;
  getMatch(id: string): Promise<Match | null>;
  addMatch(input: {
    playedAt: string;
    note?: string;
    results: MatchResult[];
  }): Promise<Match>;
  updateMatch(
    id: string,
    input: { playedAt: string; note?: string; results: MatchResult[] },
  ): Promise<Match>;
  deleteMatch(id: string): Promise<void>;

  getSchedule(): Promise<ScheduleEntry[]>;
  addScheduleEntry(input: Omit<ScheduleEntry, "id">): Promise<ScheduleEntry>;
  updateScheduleEntry(
    id: string,
    patch: Partial<Omit<ScheduleEntry, "id">>,
  ): Promise<ScheduleEntry>;
  deleteScheduleEntry(id: string): Promise<void>;

  getConfig(): Promise<ScoringConfig>;
  saveConfig(config: ScoringConfig): Promise<void>;
  recalculateAllFinalPoints(config: ScoringConfig): Promise<number>;
}
