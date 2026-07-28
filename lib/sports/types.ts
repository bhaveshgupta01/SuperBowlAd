export interface GameEvent {
  id: string;
  sport: "nfl" | "nba" | "soccer" | "cricket";
  gameId: string;
  eventType: string;
  severity: "minor" | "major" | "peak";
  description: string;
  occurredAt: Date;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  rawData?: unknown;
}

export interface LiveGame {
  id: string;
  sport: "nfl" | "nba" | "soccer" | "cricket";
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: "scheduled" | "in_progress" | "final";
  startTime: Date;
  venue?: string;
  eventTypes: string[]; // e.g., ["touchdown", "field_goal", "interception"]
}

export interface SportsApiAdapter {
  name: string;
  sport: "nfl" | "nba" | "soccer" | "cricket";
  getLiveGames(): Promise<LiveGame[]>;
  getGameEvents(gameId: string, since?: Date): Promise<GameEvent[]>;
}
