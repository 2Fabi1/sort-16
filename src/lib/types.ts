export interface User {
  id: number;
  username: string;
}

export interface BestTime {
  id: number;
  username: string;
  time: number;
  difficulty: number;
  moves: number;
  seed: string;
}

export interface CompletionCount {
  id: number;
  username: string;
  difficulty: number;
  count: number;
}

export interface LeaderboardEntry {
  username: string;
  completions: number;
}
