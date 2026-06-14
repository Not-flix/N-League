import type {
  MatchResult,
  ScoringConfig,
  Match,
  Player,
  StandingRow,
  TitleAward,
  LeagueTitles,
} from "./types";

export const DEFAULT_SCORING: ScoringConfig = {
  startingPoints: 25000,
  returnPoints: 25000,
  uma: [15, 5, -5, -15],
};

export type RawSeat = { playerId: string; rawScore: number };

export type ScoringError =
  | { kind: "duplicate-player" }
  | { kind: "wrong-sum"; expected: number; actual: number }
  | { kind: "wrong-count" };

export function validateSeats(
  seats: RawSeat[],
  config: ScoringConfig,
): ScoringError | null {
  if (seats.length !== 4) return { kind: "wrong-count" };
  const ids = new Set(seats.map((s) => s.playerId));
  if (ids.size !== 4) return { kind: "duplicate-player" };
  const expected = config.startingPoints * 4;
  const actual = seats.reduce((acc, s) => acc + s.rawScore, 0);
  if (actual !== expected) return { kind: "wrong-sum", expected, actual };
  return null;
}

export function calculateResults(
  seats: RawSeat[],
  config: ScoringConfig,
): MatchResult[] {
  const indexed = seats.map((seat, index) => ({ ...seat, index }));
  const sorted = [...indexed].sort((a, b) => {
    if (b.rawScore !== a.rawScore) return b.rawScore - a.rawScore;
    return a.index - b.index;
  });

  const groupStart: number[] = new Array(4);
  const groupEnd: number[] = new Array(4);
  let start = 0;
  while (start < 4) {
    let end = start;
    while (end + 1 < 4 && sorted[end + 1].rawScore === sorted[start].rawScore) {
      end += 1;
    }
    for (let i = start; i <= end; i += 1) {
      groupStart[i] = start;
      groupEnd[i] = end;
    }
    start = end + 1;
  }

  return sorted.map((seat, position) => {
    const gs = groupStart[position];
    const ge = groupEnd[position];
    const umaSum = config.uma.slice(gs, ge + 1).reduce((acc, v) => acc + v, 0);
    const sharedUma = umaSum / (ge - gs + 1);
    const finalPoints =
      (seat.rawScore - config.returnPoints) / 1000 + sharedUma;
    return {
      playerId: seat.playerId,
      rawScore: seat.rawScore,
      rank: gs + 1,
      finalPoints: Math.round(finalPoints * 10) / 10,
    };
  });
}

export function computeStandings(
  players: Player[],
  matches: Match[],
): StandingRow[] {
  const rows = new Map<string, StandingRow>();
  for (const p of players) {
    rows.set(p.id, {
      player: p,
      matches: 0,
      totalPoints: 0,
      averageRank: 0,
      rankCounts: [0, 0, 0, 0],
      topRate: 0,
      lastRate: 0,
    });
  }

  const rankSumByPlayer = new Map<string, number>();
  for (const match of matches) {
    for (const r of match.results) {
      const row = rows.get(r.playerId);
      if (!row) continue;
      row.matches += 1;
      row.totalPoints = Math.round((row.totalPoints + r.finalPoints) * 10) / 10;
      row.rankCounts[r.rank - 1] += 1;
      rankSumByPlayer.set(
        r.playerId,
        (rankSumByPlayer.get(r.playerId) ?? 0) + r.rank,
      );
    }
  }

  for (const row of rows.values()) {
    if (row.matches === 0) continue;
    const sum = rankSumByPlayer.get(row.player.id) ?? 0;
    row.averageRank = Math.round((sum / row.matches) * 100) / 100;
    row.topRate = Math.round((row.rankCounts[0] / row.matches) * 1000) / 10;
    row.lastRate = Math.round((row.rankCounts[3] / row.matches) * 1000) / 10;
  }

  return [...rows.values()].sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    return b.matches - a.matches;
  });
}

export const TITLE_MIN_MATCHES = 1;

function pickChampion<T extends { player: Player; matches: number }>(
  rows: T[],
  metric: (row: T) => number,
  formatValue: (row: T) => string,
): TitleAward[] {
  const candidates = rows.filter((r) => r.matches >= TITLE_MIN_MATCHES);
  if (candidates.length === 0) return [];
  const best = candidates.reduce(
    (acc, row) => Math.max(acc, metric(row)),
    metric(candidates[0]),
  );
  return candidates
    .filter((r) => metric(r) === best)
    .map((r) => ({
      player: r.player,
      value: metric(r),
      display: formatValue(r),
    }));
}

function pickAwardWithTiebreak<T extends { player: Player; matches: number }>(
  rows: T[],
  metric: (row: T) => number,
  direction: "max" | "min",
  formatValue: (row: T) => string,
  seasonPoints: (row: T) => number,
  championIds: Set<string>,
): TitleAward[] {
  const candidates = rows.filter((r) => r.matches >= TITLE_MIN_MATCHES);
  if (candidates.length === 0) return [];
  const best = candidates.reduce((acc, row) => {
    const v = metric(row);
    if (direction === "max") return v > acc ? v : acc;
    return v < acc ? v : acc;
  }, metric(candidates[0]));
  let top = candidates.filter((r) => metric(r) === best);

  const nonChampions = top.filter((r) => !championIds.has(r.player.id));
  if (nonChampions.length > 0) {
    top = nonChampions;
  }

  if (top.length > 1) {
    const maxSeason = top.reduce(
      (acc, r) => Math.max(acc, seasonPoints(r)),
      seasonPoints(top[0]),
    );
    top = top.filter((r) => seasonPoints(r) === maxSeason);
  }

  return top.map((r) => ({
    player: r.player,
    value: metric(r),
    display: formatValue(r),
  }));
}

export function computeTitles(
  players: Player[],
  matches: Match[],
  standings: StandingRow[],
): LeagueTitles {
  const champion = pickChampion(
    standings,
    (r) => r.totalPoints,
    (r) => `${r.totalPoints > 0 ? "+" : ""}${r.totalPoints.toFixed(1)} pt`,
  );
  const championIds = new Set(champion.map((a) => a.player.id));

  const seasonPointsByStanding = (r: StandingRow) => r.totalPoints;

  const mostTop = pickAwardWithTiebreak(
    standings,
    (r) => r.rankCounts[0],
    "max",
    (r) => `${r.rankCounts[0]} 回`,
    seasonPointsByStanding,
    championIds,
  );

  const lastAvoidance = pickAwardWithTiebreak(
    standings,
    (r) => r.lastRate,
    "min",
    (r) => `${r.lastRate.toFixed(1)}%`,
    seasonPointsByStanding,
    championIds,
  );

  type HighScoreCandidate = {
    player: Player;
    matches: number;
    rawScore: number;
    matchId: string;
    playedAt: string;
  };
  const byPlayer = new Map<string, Player>(players.map((p) => [p.id, p]));
  const matchCountByPlayer = new Map<string, number>();
  for (const m of matches) {
    for (const r of m.results) {
      matchCountByPlayer.set(
        r.playerId,
        (matchCountByPlayer.get(r.playerId) ?? 0) + 1,
      );
    }
  }
  const bestByPlayer = new Map<string, HighScoreCandidate>();
  for (const m of matches) {
    for (const r of m.results) {
      const player = byPlayer.get(r.playerId);
      if (!player) continue;
      const current = bestByPlayer.get(r.playerId);
      if (!current || r.rawScore > current.rawScore) {
        bestByPlayer.set(r.playerId, {
          player,
          matches: matchCountByPlayer.get(r.playerId) ?? 0,
          rawScore: r.rawScore,
          matchId: m.id,
          playedAt: m.playedAt,
        });
      }
    }
  }
  const highScoreRows = [...bestByPlayer.values()];
  const seasonPointsById = new Map(
    standings.map((s) => [s.player.id, s.totalPoints]),
  );
  const highScore = pickAwardWithTiebreak(
    highScoreRows,
    (r) => r.rawScore,
    "max",
    (r) => `${r.rawScore.toLocaleString()} 点`,
    (r) => seasonPointsById.get(r.player.id) ?? 0,
    championIds,
  ).map((award) => {
    const src = highScoreRows.find((r) => r.player.id === award.player.id);
    return {
      ...award,
      meta: src
        ? {
            matchId: src.matchId,
            playedAt: src.playedAt,
          }
        : undefined,
    } satisfies TitleAward;
  });

  return {
    champion,
    mostTop,
    lastAvoidance,
    highScore,
  };
}
