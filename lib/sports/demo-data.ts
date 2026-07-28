import { GameEvent, LiveGame, SportsApiAdapter } from "./types";

// NFL Demo Game
const NFL_DEMO_GAME: LiveGame = {
  id: "nfl_demo_sb",
  sport: "nfl",
  gameId: "nfl_demo_sb",
  homeTeam: "Kansas City Chiefs",
  awayTeam: "San Francisco 49ers",
  homeScore: 0,
  awayScore: 0,
  status: "scheduled",
  startTime: new Date(Date.now() + 3600000),
  venue: "Las Vegas Stadium",
  eventTypes: ["touchdown", "field_goal", "interception", "sack", "fumble"],
};

// NBA Demo Game
const NBA_DEMO_GAME: LiveGame = {
  id: "nba_demo_lal_bos",
  sport: "nba",
  gameId: "nba_demo_lal_bos",
  homeTeam: "Los Angeles Lakers",
  awayTeam: "Boston Celtics",
  homeScore: 0,
  awayScore: 0,
  status: "scheduled",
  startTime: new Date(Date.now() + 7200000),
  venue: "Crypto.com Arena",
  eventTypes: ["3pointer", "dunk", "buzzer_beater", "technical_foul"],
};

// Soccer Demo Game
const SOCCER_DEMO_GAME: LiveGame = {
  id: "soccer_demo_messi",
  sport: "soccer",
  gameId: "soccer_demo_messi",
  homeTeam: "Manchester United",
  awayTeam: "Liverpool FC",
  homeScore: 0,
  awayScore: 0,
  status: "scheduled",
  startTime: new Date(Date.now() + 10800000),
  venue: "Old Trafford",
  eventTypes: ["goal", "penalty", "red_card", "yellow_card", "corner"],
};

// Cricket Demo Game
const CRICKET_DEMO_GAME: LiveGame = {
  id: "cricket_demo_ind_aus",
  sport: "cricket",
  gameId: "cricket_demo_ind_aus",
  homeTeam: "India",
  awayTeam: "Australia",
  homeScore: 0,
  awayScore: 0,
  status: "scheduled",
  startTime: new Date(Date.now() + 14400000),
  venue: "Melbourne Cricket Ground",
  eventTypes: ["boundary", "wicket", "over", "six", "dot_ball", "drs_review"],
};

// Scripted events for demo games (occurs every N seconds)
const DEMO_EVENTS: { game: LiveGame; events: (GameEvent & { delaySeconds: number })[] }[] = [
  {
    game: NFL_DEMO_GAME,
    events: [
      {
        id: "nfl_td1",
        sport: "nfl",
        gameId: "nfl_demo_sb",
        eventType: "touchdown",
        severity: "major",
        description: "Kansas City Chiefs - Touchdown!",
        occurredAt: new Date(),
        homeTeam: "Kansas City Chiefs",
        awayTeam: "San Francisco 49ers",
        homeScore: 7,
        awayScore: 0,
        delaySeconds: 10,
      },
      {
        id: "nfl_fg1",
        sport: "nfl",
        gameId: "nfl_demo_sb",
        eventType: "field_goal",
        severity: "major",
        description: "San Francisco 49ers - Field Goal!",
        occurredAt: new Date(),
        homeTeam: "Kansas City Chiefs",
        awayTeam: "San Francisco 49ers",
        homeScore: 7,
        awayScore: 3,
        delaySeconds: 20,
      },
      {
        id: "nfl_int1",
        sport: "nfl",
        gameId: "nfl_demo_sb",
        eventType: "interception",
        severity: "major",
        description: "Interception! Kansas City turnover",
        occurredAt: new Date(),
        homeTeam: "Kansas City Chiefs",
        awayTeam: "San Francisco 49ers",
        homeScore: 7,
        awayScore: 3,
        delaySeconds: 30,
      },
      {
        id: "nfl_td2",
        sport: "nfl",
        gameId: "nfl_demo_sb",
        eventType: "touchdown",
        severity: "major",
        description: "San Francisco 49ers - Touchdown!",
        occurredAt: new Date(),
        homeTeam: "Kansas City Chiefs",
        awayTeam: "San Francisco 49ers",
        homeScore: 7,
        awayScore: 10,
        delaySeconds: 40,
      },
    ],
  },
  {
    game: NBA_DEMO_GAME,
    events: [
      {
        id: "nba_3p1",
        sport: "nba",
        gameId: "nba_demo_lal_bos",
        eventType: "3pointer",
        severity: "minor",
        description: "Lakers - Three Pointer!",
        occurredAt: new Date(),
        homeTeam: "Los Angeles Lakers",
        awayTeam: "Boston Celtics",
        homeScore: 3,
        awayScore: 0,
        delaySeconds: 10,
      },
      {
        id: "nba_dunk1",
        sport: "nba",
        gameId: "nba_demo_lal_bos",
        eventType: "dunk",
        severity: "major",
        description: "Celtics - Slam Dunk!",
        occurredAt: new Date(),
        homeTeam: "Los Angeles Lakers",
        awayTeam: "Boston Celtics",
        homeScore: 3,
        awayScore: 2,
        delaySeconds: 20,
      },
      {
        id: "nba_3p2",
        sport: "nba",
        gameId: "nba_demo_lal_bos",
        eventType: "3pointer",
        severity: "minor",
        description: "Celtics - Three Pointer!",
        occurredAt: new Date(),
        homeTeam: "Los Angeles Lakers",
        awayTeam: "Boston Celtics",
        homeScore: 3,
        awayScore: 5,
        delaySeconds: 30,
      },
    ],
  },
  {
    game: SOCCER_DEMO_GAME,
    events: [
      {
        id: "soccer_goal1",
        sport: "soccer",
        gameId: "soccer_demo_messi",
        eventType: "goal",
        severity: "major",
        description: "Manchester United - GOAL!",
        occurredAt: new Date(),
        homeTeam: "Manchester United",
        awayTeam: "Liverpool FC",
        homeScore: 1,
        awayScore: 0,
        delaySeconds: 15,
      },
      {
        id: "soccer_yc1",
        sport: "soccer",
        gameId: "soccer_demo_messi",
        eventType: "yellow_card",
        severity: "minor",
        description: "Liverpool - Yellow Card",
        occurredAt: new Date(),
        homeTeam: "Manchester United",
        awayTeam: "Liverpool FC",
        homeScore: 1,
        awayScore: 0,
        delaySeconds: 25,
      },
      {
        id: "soccer_goal2",
        sport: "soccer",
        gameId: "soccer_demo_messi",
        eventType: "goal",
        severity: "major",
        description: "Liverpool - GOAL!",
        occurredAt: new Date(),
        homeTeam: "Manchester United",
        awayTeam: "Liverpool FC",
        homeScore: 1,
        awayScore: 1,
        delaySeconds: 35,
      },
    ],
  },
  {
    game: CRICKET_DEMO_GAME,
    events: [
      {
        id: "cricket_six1",
        sport: "cricket",
        gameId: "cricket_demo_ind_aus",
        eventType: "six",
        severity: "major",
        description: "India - Six! Beautiful shot!",
        occurredAt: new Date(),
        homeTeam: "India",
        awayTeam: "Australia",
        homeScore: 6,
        awayScore: 0,
        delaySeconds: 12,
      },
      {
        id: "cricket_boundary1",
        sport: "cricket",
        gameId: "cricket_demo_ind_aus",
        eventType: "boundary",
        severity: "minor",
        description: "India - Boundary (4 runs)",
        occurredAt: new Date(),
        homeTeam: "India",
        awayTeam: "Australia",
        homeScore: 10,
        awayScore: 0,
        delaySeconds: 22,
      },
      {
        id: "cricket_wicket1",
        sport: "cricket",
        gameId: "cricket_demo_ind_aus",
        eventType: "wicket",
        severity: "major",
        description: "Australia - Wicket! India batter out!",
        occurredAt: new Date(),
        homeTeam: "India",
        awayTeam: "Australia",
        homeScore: 10,
        awayScore: 0,
        delaySeconds: 32,
      },
      {
        id: "cricket_six2",
        sport: "cricket",
        gameId: "cricket_demo_ind_aus",
        eventType: "six",
        severity: "major",
        description: "Australia - Six! Great recovery!",
        occurredAt: new Date(),
        homeTeam: "India",
        awayTeam: "Australia",
        homeScore: 10,
        awayScore: 6,
        delaySeconds: 42,
      },
    ],
  },
];

export class DemoSportsAdapter implements SportsApiAdapter {
  name: string;
  sport: "nfl" | "nba" | "soccer" | "cricket";
  private currentEventIndex = 0;
  private gameData: LiveGame;
  private gameEvents: (GameEvent & { delaySeconds: number })[];

  constructor(sport: "nfl" | "nba" | "soccer" | "cricket") {
    this.sport = sport;
    const demoConfig = DEMO_EVENTS.find((d) => d.game.sport === sport);
    this.gameData = demoConfig?.game!;
    this.gameEvents = demoConfig?.events || [];
    this.name = `Demo ${sport.toUpperCase()}`;
  }

  async getLiveGames(): Promise<LiveGame[]> {
    return [this.gameData];
  }

  async getGameEvents(): Promise<GameEvent[]> {
    // Return all events for demo
    return this.gameEvents.map(({ delaySeconds, ...event }) => event);
  }

  // Utility for getting next event in sequence
  getNextEvent(): (GameEvent & { delaySeconds: number }) | null {
    if (this.currentEventIndex >= this.gameEvents.length) {
      return null;
    }
    const event = this.gameEvents[this.currentEventIndex];
    this.currentEventIndex++;
    return event;
  }

  resetEvents(): void {
    this.currentEventIndex = 0;
  }
}

// Export demo adapters for all sports
export const demoDemoAdapters = {
  nfl: new DemoSportsAdapter("nfl"),
  nba: new DemoSportsAdapter("nba"),
  soccer: new DemoSportsAdapter("soccer"),
  cricket: new DemoSportsAdapter("cricket"),
};

export const DEMO_GAMES = {
  nfl: NFL_DEMO_GAME,
  nba: NBA_DEMO_GAME,
  soccer: SOCCER_DEMO_GAME,
  cricket: CRICKET_DEMO_GAME,
};
