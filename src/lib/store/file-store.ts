import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { DEFAULT_SCORING, calculateResults } from "../scoring";
import type {
  Match,
  MatchResult,
  Player,
  ScheduleEntry,
  ScoringConfig,
} from "../types";
import type { DataStore } from "./types";

type FileShape = {
  players: Player[];
  matches: Match[];
  schedule: ScheduleEntry[];
  config: ScoringConfig;
};

const DATA_PATH = path.join(process.cwd(), "data", "league.json");

let writeQueue: Promise<unknown> = Promise.resolve();

async function readAll(): Promise<FileShape> {
  try {
    const raw = await fs.readFile(DATA_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<FileShape>;
    return {
      players: parsed.players ?? [],
      matches: parsed.matches ?? [],
      schedule: parsed.schedule ?? [],
      config: parsed.config ?? DEFAULT_SCORING,
    };
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return {
        players: [],
        matches: [],
        schedule: [],
        config: DEFAULT_SCORING,
      };
    }
    throw err;
  }
}

async function writeAll(data: FileShape): Promise<void> {
  await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
  const tmp = `${DATA_PATH}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
  await fs.rename(tmp, DATA_PATH);
}

function withWriteLock<T>(fn: (data: FileShape) => Promise<{ data: FileShape; result: T }>): Promise<T> {
  const next = writeQueue.then(async () => {
    const data = await readAll();
    const { data: nextData, result } = await fn(data);
    await writeAll(nextData);
    return result;
  });
  writeQueue = next.catch(() => {});
  return next;
}

export const fileStore: DataStore = {
  async getPlayers() {
    const data = await readAll();
    return data.players;
  },
  async addPlayer(name) {
    return withWriteLock(async (data) => {
      const player: Player = {
        id: randomUUID(),
        name,
        joinedAt: new Date().toISOString(),
        active: true,
      };
      return { data: { ...data, players: [...data.players, player] }, result: player };
    });
  },
  async updatePlayer(id, patch) {
    return withWriteLock(async (data) => {
      const idx = data.players.findIndex((p) => p.id === id);
      if (idx === -1) throw new Error(`player not found: ${id}`);
      const next: Player = { ...data.players[idx], ...patch };
      const players = [...data.players];
      players[idx] = next;
      return { data: { ...data, players }, result: next };
    });
  },
  async deletePlayer(id) {
    await withWriteLock(async (data) => {
      const used = data.matches.some((m) =>
        m.results.some((r) => r.playerId === id),
      );
      if (used) {
        throw new Error(
          "この選手は試合結果に含まれているため削除できません。代わりに「参加中」のチェックを外して休止状態にしてください。",
        );
      }
      return {
        data: { ...data, players: data.players.filter((p) => p.id !== id) },
        result: undefined,
      };
    });
  },
  async countPlayerMatches(id) {
    const data = await readAll();
    return data.matches.reduce(
      (acc, m) => acc + m.results.filter((r) => r.playerId === id).length,
      0,
    );
  },

  async getMatches() {
    const data = await readAll();
    return [...data.matches].sort((a, b) => b.playedAt.localeCompare(a.playedAt));
  },
  async getMatch(id) {
    const data = await readAll();
    return data.matches.find((m) => m.id === id) ?? null;
  },
  async addMatch(input) {
    return withWriteLock(async (data) => {
      const match: Match = {
        id: randomUUID(),
        playedAt: input.playedAt,
        createdAt: new Date().toISOString(),
        note: input.note,
        results: input.results as MatchResult[],
      };
      return {
        data: { ...data, matches: [...data.matches, match] },
        result: match,
      };
    });
  },
  async updateMatch(id, input) {
    return withWriteLock(async (data) => {
      const idx = data.matches.findIndex((m) => m.id === id);
      if (idx === -1) throw new Error(`match not found: ${id}`);
      const existing = data.matches[idx];
      const next: Match = {
        ...existing,
        playedAt: input.playedAt,
        note: input.note,
        results: input.results,
      };
      const matches = [...data.matches];
      matches[idx] = next;
      return { data: { ...data, matches }, result: next };
    });
  },
  async deleteMatch(id) {
    await withWriteLock(async (data) => ({
      data: { ...data, matches: data.matches.filter((m) => m.id !== id) },
      result: undefined,
    }));
  },

  async getSchedule() {
    const data = await readAll();
    return [...data.schedule].sort((a, b) =>
      a.scheduledAt.localeCompare(b.scheduledAt),
    );
  },
  async addScheduleEntry(input) {
    return withWriteLock(async (data) => {
      const entry: ScheduleEntry = { id: randomUUID(), ...input };
      return {
        data: { ...data, schedule: [...data.schedule, entry] },
        result: entry,
      };
    });
  },
  async updateScheduleEntry(id, patch) {
    return withWriteLock(async (data) => {
      const idx = data.schedule.findIndex((e) => e.id === id);
      if (idx === -1) throw new Error(`schedule not found: ${id}`);
      const next: ScheduleEntry = { ...data.schedule[idx], ...patch };
      const schedule = [...data.schedule];
      schedule[idx] = next;
      return { data: { ...data, schedule }, result: next };
    });
  },
  async deleteScheduleEntry(id) {
    await withWriteLock(async (data) => ({
      data: { ...data, schedule: data.schedule.filter((e) => e.id !== id) },
      result: undefined,
    }));
  },

  async getConfig() {
    const data = await readAll();
    return data.config;
  },
  async saveConfig(config) {
    await withWriteLock(async (data) => ({
      data: { ...data, config },
      result: undefined,
    }));
  },

  async recalculateAllFinalPoints(config) {
    return withWriteLock(async (data) => {
      const matches = data.matches.map((m) => {
        const seats = m.results.map((r) => ({
          playerId: r.playerId,
          rawScore: r.rawScore,
        }));
        return { ...m, results: calculateResults(seats, config) };
      });
      return { data: { ...data, matches }, result: matches.length };
    });
  },
};
