export type Player = {
  id: string;
  name: string;
  joinedAt: string;
  active: boolean;
  avatarDataUrl?: string;
};

export type MatchResult = {
  playerId: string;
  rawScore: number;
  rank: number;
  finalPoints: number;
};

export type Match = {
  id: string;
  playedAt: string;
  createdAt: string;
  note?: string;
  results: MatchResult[];
};

export type ScoringConfig = {
  startingPoints: number;
  returnPoints: number;
  uma: [number, number, number, number];
};

export type ScheduleEntry = {
  id: string;
  scheduledAt: string;
  label: string;
  notes?: string;
};

export type StandingRow = {
  player: Player;
  matches: number;
  totalPoints: number;
  averageRank: number;
  rankCounts: [number, number, number, number];
  topRate: number;
  lastRate: number;
};

export type TitleAward = {
  player: Player;
  value: number;
  display: string;
  meta?: {
    matchId: string;
    playedAt: string;
  };
};

export type LeagueTitles = {
  champion: TitleAward[];
  mostTop: TitleAward[];
  lastAvoidance: TitleAward[];
  highScore: TitleAward[];
};
