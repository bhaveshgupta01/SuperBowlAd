import axios from "axios";
import { GameEvent, LiveGame, SportsApiAdapter } from "./types";

const ESPN_SCOREBOARD_BASE = "https://site.api.espn.com/apis/site/v2/sports";

interface ESPNGame {
  id: string;
  name: string;
  status: {
    type: {
      name: string;
      state: string;
    };
    period: number;
    displayClock: string;
  };
  competitions: Array<{
    status: { type: { name: string } };
    competitors: Array<{
      id: string;
      team: {
        id: string;
        name: string;
        abbreviation: string;
        logo: string;
      };
      score: {
        value: number;
        displayValue: string;
      };
      homeAway: "home" | "away";
    }>;
    startDate: string;
    venue?: {
      fullName: string;
    };
    articles?: Array<{
      description: string;
      links: Array<{ text: string; href: string }>;
    }>;
  }>;
}

async function fetchESPNData(sport: "football" | "basketball", league: "nfl" | "nba"): Promise<ESPNGame[]> {
  try {
    const response = await axios.get(
      `${ESPN_SCOREBOARD_BASE}/${sport}/${league}/scoreboard`,
      { timeout: 5000 }
    );
    return response.data.events || [];
  } catch (error) {
    console.error(`ESPN API error for ${league}:`, error);
    return [];
  }
}

function mapESPNGameToLiveGame(espnGame: ESPNGame, sport: "nfl" | "nba"): LiveGame | null {
  const competition = espnGame.competitions[0];
  if (!competition) return null;

  const homeTeam = competition.competitors.find((c) => c.homeAway === "home");
  const awayTeam = competition.competitors.find((c) => c.homeAway === "away");

  if (!homeTeam || !awayTeam) return null;

  const status = espnGame.status.type.state === "in" ? "in_progress" : espnGame.status.type.state === "post" ? "final" : "scheduled";

  const eventTypes =
    sport === "nfl"
      ? ["touchdown", "field_goal", "interception", "sack", "fumble"]
      : ["3pointer", "dunk", "buzzer_beater", "technical_foul", "three_pointer"];

  return {
    id: espnGame.id,
    sport,
    gameId: espnGame.id,
    homeTeam: homeTeam.team.name,
    awayTeam: awayTeam.team.name,
    homeScore: homeTeam.score.value,
    awayScore: awayTeam.score.value,
    status,
    startTime: new Date(competition.startDate),
    venue: competition.venue?.fullName,
    eventTypes,
  };
}

async function mapESPNGameToEvents(
  espnGame: ESPNGame,
  sport: "nfl" | "nba"
): Promise<GameEvent[]> {
  const competition = espnGame.competitions[0];
  if (!competition) return [];

  const homeTeam = competition.competitors.find((c) => c.homeAway === "home");
  const awayTeam = competition.competitors.find((c) => c.homeAway === "away");

  if (!homeTeam || !awayTeam) return [];

  // Generate synthetic events based on score changes
  // In production, you'd parse the articles/play-by-play
  const events: GameEvent[] = [];

  // This is a simplified implementation
  // In production, integrate with ESPN's detailed game API endpoint
  if (homeTeam.score.value > 0) {
    events.push({
      id: `${espnGame.id}_home_score`,
      sport,
      gameId: espnGame.id,
      eventType: sport === "nfl" ? "touchdown" : "3pointer",
      severity: sport === "nfl" ? "major" : "minor",
      description: `${homeTeam.team.name} scored`,
      occurredAt: new Date(),
      homeTeam: homeTeam.team.name,
      awayTeam: awayTeam.team.name,
      homeScore: homeTeam.score.value,
      awayScore: awayTeam.score.value,
    });
  }

  return events;
}

export const ESPNNFLAdapter: SportsApiAdapter = {
  name: "ESPN NFL",
  sport: "nfl",

  async getLiveGames(): Promise<LiveGame[]> {
    const espnGames = await fetchESPNData("football", "nfl");
    return espnGames
      .map((g) => mapESPNGameToLiveGame(g, "nfl"))
      .filter((g): g is LiveGame => g !== null);
  },

  async getGameEvents(gameId: string): Promise<GameEvent[]> {
    const espnGames = await fetchESPNData("football", "nfl");
    const game = espnGames.find((g) => g.id === gameId);
    if (!game) return [];
    return mapESPNGameToEvents(game, "nfl");
  },
};

export const ESPNNBAAdapter: SportsApiAdapter = {
  name: "ESPN NBA",
  sport: "nba",

  async getLiveGames(): Promise<LiveGame[]> {
    const espnGames = await fetchESPNData("basketball", "nba");
    return espnGames
      .map((g) => mapESPNGameToLiveGame(g, "nba"))
      .filter((g): g is LiveGame => g !== null);
  },

  async getGameEvents(gameId: string): Promise<GameEvent[]> {
    const espnGames = await fetchESPNData("basketball", "nba");
    const game = espnGames.find((g) => g.id === gameId);
    if (!game) return [];
    return mapESPNGameToEvents(game, "nba");
  },
};
