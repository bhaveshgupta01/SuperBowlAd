import { SportsApiAdapter, LiveGame, GameEvent } from "./types";
import { ESPNNFLAdapter, ESPNNBAAdapter } from "./espn";
import { demoDemoAdapters, DEMO_GAMES } from "./demo-data";

const useRealAPIs = process.env.NEXT_PUBLIC_USE_REAL_SPORTS_API === "true";
const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

// Map adapters based on mode
const adapters: Record<string, SportsApiAdapter> = {
  nfl: useRealAPIs ? ESPNNFLAdapter : demoDemoAdapters.nfl,
  nba: useRealAPIs ? ESPNNBAAdapter : demoDemoAdapters.nba,
  soccer: demoDemoAdapters.soccer, // football-data.org not implemented yet
  cricket: demoDemoAdapters.cricket, // RapidAPI cricket not implemented yet
};

export async function getLiveGames(
  sport?: "nfl" | "nba" | "soccer" | "cricket"
): Promise<LiveGame[]> {
  if (demoMode) {
    if (sport) {
      return [DEMO_GAMES[sport]];
    }
    return Object.values(DEMO_GAMES);
  }

  if (sport) {
    const adapter = adapters[sport];
    if (!adapter) {
      return [];
    }
    return adapter.getLiveGames();
  }

  // Return all available games
  const allGames: LiveGame[] = [];
  for (const adapter of Object.values(adapters)) {
    const games = await adapter.getLiveGames();
    allGames.push(...games);
  }
  return allGames;
}

export async function getGameEvents(
  sport: string,
  gameId: string,
  since?: Date
): Promise<GameEvent[]> {
  const adapter = adapters[sport];
  if (!adapter) {
    return [];
  }
  return adapter.getGameEvents(gameId, since);
}

export type { LiveGame, GameEvent, SportsApiAdapter };
