import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_SCORING, calculateResults } from "../scoring";
import type {
  Match,
  MatchResult,
  Player,
  ScheduleEntry,
  ScoringConfig,
} from "../types";
import type { DataStore } from "./types";

type PlayerRow = {
  id: string;
  name: string;
  joined_at: string;
  active: boolean;
  avatar_data_url: string | null;
};

type MatchRow = {
  id: string;
  played_at: string;
  created_at: string;
  note: string | null;
};

type MatchResultRow = {
  match_id: string;
  player_id: string;
  raw_score: number;
  rank: number;
  final_points: number;
};

type ScheduleRow = {
  id: string;
  scheduled_at: string;
  label: string;
  notes: string | null;
};

let cachedClient: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (cachedClient) return cachedClient;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set to use the Supabase store.",
    );
  }
  cachedClient = createClient(url, key, { auth: { persistSession: false } });
  return cachedClient;
}

function rowToPlayer(row: PlayerRow): Player {
  return {
    id: row.id,
    name: row.name,
    joinedAt: row.joined_at,
    active: row.active,
    avatarDataUrl: row.avatar_data_url ?? undefined,
  };
}

function rowToSchedule(row: ScheduleRow): ScheduleEntry {
  return {
    id: row.id,
    scheduledAt: row.scheduled_at,
    label: row.label,
    notes: row.notes ?? undefined,
  };
}

function rowToResult(row: MatchResultRow): MatchResult {
  return {
    playerId: row.player_id,
    rawScore: row.raw_score,
    rank: row.rank,
    finalPoints: Number(row.final_points),
  };
}

export const supabaseStore: DataStore = {
  async getPlayers() {
    const { data, error } = await getClient()
      .from("players")
      .select("*")
      .order("joined_at", { ascending: true });
    if (error) throw error;
    return (data as PlayerRow[]).map(rowToPlayer);
  },

  async addPlayer(name) {
    const { data, error } = await getClient()
      .from("players")
      .insert({ name })
      .select("*")
      .single();
    if (error) throw error;
    return rowToPlayer(data as PlayerRow);
  },

  async deletePlayer(id) {
    const client = getClient();
    const { count, error: cErr } = await client
      .from("match_results")
      .select("*", { count: "exact", head: true })
      .eq("player_id", id);
    if (cErr) throw cErr;
    if ((count ?? 0) > 0) {
      throw new Error(
        "この選手は試合結果に含まれているため削除できません。代わりに「参加中」のチェックを外して休止状態にしてください。",
      );
    }
    const { error } = await client.from("players").delete().eq("id", id);
    if (error) throw error;
  },
  async countPlayerMatches(id) {
    const { count, error } = await getClient()
      .from("match_results")
      .select("*", { count: "exact", head: true })
      .eq("player_id", id);
    if (error) throw error;
    return count ?? 0;
  },
  async getMatch(id) {
    const client = getClient();
    const { data: matchRow, error } = await client
      .from("matches")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!matchRow) return null;
    const { data: resultRows, error: rErr } = await client
      .from("match_results")
      .select("*")
      .eq("match_id", id);
    if (rErr) throw rErr;
    return {
      id: matchRow.id,
      playedAt: matchRow.played_at,
      createdAt: matchRow.created_at,
      note: matchRow.note ?? undefined,
      results: (resultRows as MatchResultRow[]).map(rowToResult),
    };
  },
  async updateMatch(id, input) {
    const client = getClient();
    const { error: uErr } = await client
      .from("matches")
      .update({ played_at: input.playedAt, note: input.note ?? null })
      .eq("id", id);
    if (uErr) throw uErr;
    const { error: dErr } = await client
      .from("match_results")
      .delete()
      .eq("match_id", id);
    if (dErr) throw dErr;
    const inserts = input.results.map((r) => ({
      match_id: id,
      player_id: r.playerId,
      raw_score: r.rawScore,
      rank: r.rank,
      final_points: r.finalPoints,
    }));
    const { error: iErr } = await client.from("match_results").insert(inserts);
    if (iErr) throw iErr;
    const updated = await this.getMatch(id);
    if (!updated) throw new Error("match disappeared after update");
    return updated;
  },
  async updatePlayer(id, patch) {
    const update: Partial<PlayerRow> = {};
    if (patch.name !== undefined) update.name = patch.name;
    if (patch.active !== undefined) update.active = patch.active;
    if ("avatarDataUrl" in patch) {
      update.avatar_data_url = patch.avatarDataUrl ?? null;
    }
    const { data, error } = await getClient()
      .from("players")
      .update(update)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return rowToPlayer(data as PlayerRow);
  },

  async getMatches() {
    const client = getClient();
    const { data: matchRows, error } = await client
      .from("matches")
      .select("*")
      .order("played_at", { ascending: false });
    if (error) throw error;
    const ids = (matchRows as MatchRow[]).map((m) => m.id);
    const resultsByMatch = new Map<string, MatchResult[]>();
    if (ids.length > 0) {
      const { data: resultRows, error: rErr } = await client
        .from("match_results")
        .select("*")
        .in("match_id", ids);
      if (rErr) throw rErr;
      for (const row of resultRows as MatchResultRow[]) {
        const arr = resultsByMatch.get(row.match_id) ?? [];
        arr.push(rowToResult(row));
        resultsByMatch.set(row.match_id, arr);
      }
    }
    return (matchRows as MatchRow[]).map((m) => ({
      id: m.id,
      playedAt: m.played_at,
      createdAt: m.created_at,
      note: m.note ?? undefined,
      results: resultsByMatch.get(m.id) ?? [],
    }));
  },

  async addMatch(input) {
    const client = getClient();
    const { data: matchRow, error } = await client
      .from("matches")
      .insert({ played_at: input.playedAt, note: input.note ?? null })
      .select("*")
      .single();
    if (error) throw error;
    const inserts = input.results.map((r) => ({
      match_id: matchRow.id,
      player_id: r.playerId,
      raw_score: r.rawScore,
      rank: r.rank,
      final_points: r.finalPoints,
    }));
    const { error: rErr } = await client.from("match_results").insert(inserts);
    if (rErr) throw rErr;
    return {
      id: matchRow.id,
      playedAt: matchRow.played_at,
      createdAt: matchRow.created_at,
      note: matchRow.note ?? undefined,
      results: input.results,
    } as Match;
  },

  async deleteMatch(id) {
    const { error } = await getClient().from("matches").delete().eq("id", id);
    if (error) throw error;
  },

  async getSchedule() {
    const { data, error } = await getClient()
      .from("schedule")
      .select("*")
      .order("scheduled_at", { ascending: true });
    if (error) throw error;
    return (data as ScheduleRow[]).map(rowToSchedule);
  },

  async addScheduleEntry(input) {
    const { data, error } = await getClient()
      .from("schedule")
      .insert({
        scheduled_at: input.scheduledAt,
        label: input.label,
        notes: input.notes ?? null,
      })
      .select("*")
      .single();
    if (error) throw error;
    return rowToSchedule(data as ScheduleRow);
  },

  async updateScheduleEntry(id, patch) {
    const update: Partial<ScheduleRow> = {};
    if (patch.scheduledAt !== undefined) update.scheduled_at = patch.scheduledAt;
    if (patch.label !== undefined) update.label = patch.label;
    if (patch.notes !== undefined) update.notes = patch.notes ?? null;
    const { data, error } = await getClient()
      .from("schedule")
      .update(update)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return rowToSchedule(data as ScheduleRow);
  },

  async deleteScheduleEntry(id) {
    const { error } = await getClient().from("schedule").delete().eq("id", id);
    if (error) throw error;
  },

  async getConfig() {
    const { data, error } = await getClient()
      .from("settings")
      .select("value")
      .eq("key", "scoring")
      .maybeSingle();
    if (error) throw error;
    if (!data) return DEFAULT_SCORING;
    return data.value as ScoringConfig;
  },

  async saveConfig(config) {
    const { error } = await getClient()
      .from("settings")
      .upsert({ key: "scoring", value: config }, { onConflict: "key" });
    if (error) throw error;
  },

  async recalculateAllFinalPoints(config) {
    const client = getClient();
    const matches = await this.getMatches();
    let updated = 0;
    for (const m of matches) {
      const seats = m.results.map((r) => ({
        playerId: r.playerId,
        rawScore: r.rawScore,
      }));
      const newResults = calculateResults(seats, config);
      const rows = newResults.map((r) => ({
        match_id: m.id,
        player_id: r.playerId,
        raw_score: r.rawScore,
        rank: r.rank,
        final_points: r.finalPoints,
      }));
      const { error } = await client
        .from("match_results")
        .upsert(rows, { onConflict: "match_id,player_id" });
      if (error) throw error;
      updated += 1;
    }
    return updated;
  },
};
