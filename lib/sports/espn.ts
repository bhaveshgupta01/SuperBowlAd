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
  }>;
}

// One play from the summary endpoint's play-by-play.
// NFL: summary.drives.previous[].plays[] (+ drives.current.plays[])
// NBA: summary.plays[]
interface ESPNPlay {
  id?: string;
  sequenceNumber?: string;
  type?: { id?: string; text?: string };
  text?: string;
  period?: { number?: number };
  clock?: { displayValue?: string };
  scoringPlay?: boolean;
  scoreValue?: number; // NBA only
  wallclock?: string;
  awayScore?: number;
  homeScore?: number;
}

interface SummaryTeams {
  homeTeam: string;
  awayTeam: string;
  homeAbbrev: string;
  awayAbbrev: string;
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

async function fetchESPNSummary(
  sport: "football" | "basketball",
  league: "nfl" | "nba",
  gameId: string
): Promise<{ plays: ESPNPlay[]; teams: SummaryTeams } | null> {
  try {
    const response = await axios.get(
      `${ESPN_SCOREBOARD_BASE}/${sport}/${league}/summary`,
      { params: { event: gameId }, timeout: 8000 }
    );
    const data = response.data ?? {};

    let plays: ESPNPlay[] = [];
    if (league === "nfl") {
      const drives = data.drives ?? {};
      const allDrives = [...(drives.previous ?? []), ...(drives.current ? [drives.current] : [])];
      plays = allDrives.flatMap((d: { plays?: ESPNPlay[] }) => d.plays ?? []);
    } else {
      plays = data.plays ?? [];
    }

    const competitors = data.header?.competitions?.[0]?.competitors ?? [];
    const home = competitors.find((c: { homeAway?: string }) => c.homeAway === "home");
    const away = competitors.find((c: { homeAway?: string }) => c.homeAway === "away");
    const teams: SummaryTeams = {
      homeTeam: home?.team?.name ?? home?.team?.displayName ?? "Home",
      awayTeam: away?.team?.name ?? away?.team?.displayName ?? "Away",
      homeAbbrev: home?.team?.abbreviation ?? "HOME",
      awayAbbrev: away?.team?.abbreviation ?? "AWAY",
    };

    return { plays, teams };
  } catch (error) {
    console.error(`ESPN summary error for ${league}/${gameId}:`, error);
    return null;
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
      : ["3pointer", "dunk", "buzzer_beater", "technical_foul"];

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

// Classify a play into one of our campaign event types, or null for
// plays that aren't marketing moments (rushes, timeouts, punts, ...).
// Order matters: "Interception Return Touchdown" should read as a touchdown.
function classifyNFLPlay(play: ESPNPlay): { eventType: string; severity: GameEvent["severity"]; headline: string } | null {
  const t = play.type?.text ?? "";
  if (t.includes("Touchdown")) return { eventType: "touchdown", severity: "peak", headline: "TOUCHDOWN" };
  if (t === "Field Goal Good") return { eventType: "field_goal", severity: "major", headline: "FIELD GOAL" };
  if (t.includes("Interception")) return { eventType: "interception", severity: "major", headline: "INTERCEPTION" };
  if (t.includes("Fumble")) return { eventType: "fumble", severity: "minor", headline: "FUMBLE" };
  if (t.includes("Sack")) return { eventType: "sack", severity: "minor", headline: "SACK" };
  return null;
}

function classifyNBAPlay(play: ESPNPlay): { eventType: string; severity: GameEvent["severity"]; headline: string } | null {
  const t = (play.type?.text ?? "").toLowerCase();
  const txt = (play.text ?? "").toLowerCase();
  if (play.scoringPlay && play.scoreValue === 3) return { eventType: "3pointer", severity: "major", headline: "THREE POINTER" };
  if (txt.includes("dunk")) return { eventType: "dunk", severity: "major", headline: "DUNK" };
  if (t.includes("technical foul")) return { eventType: "technical_foul", severity: "minor", headline: "TECHNICAL FOUL" };
  return null;
}

function mapPlaysToGameEvents(
  plays: ESPNPlay[],
  teams: SummaryTeams,
  sport: "nfl" | "nba",
  gameId: string,
  since?: Date
): GameEvent[] {
  const classify = sport === "nfl" ? classifyNFLPlay : classifyNBAPlay;
  const events: GameEvent[] = [];

  for (const play of plays) {
    const cls = classify(play);
    if (!cls) continue;

    const occurredAt = play.wallclock ? new Date(play.wallclock) : new Date();
    if (since && occurredAt <= since) continue;

    const playText = (play.text ?? "").trim().replace(/\s+/g, " ");
    const shortText = playText.length > 120 ? `${playText.slice(0, 117)}…` : playText;
    const score = `${teams.awayAbbrev} ${play.awayScore ?? 0} – ${play.homeScore ?? 0} ${teams.homeAbbrev}`;

    events.push({
      id: `${gameId}_${play.id ?? play.sequenceNumber ?? events.length}`,
      sport,
      gameId,
      eventType: cls.eventType,
      severity: cls.severity,
      description: `${cls.headline}! ${shortText} (${score})`,
      occurredAt,
      homeTeam: teams.homeTeam,
      awayTeam: teams.awayTeam,
      homeScore: play.homeScore ?? 0,
      awayScore: play.awayScore ?? 0,
      rawData: play,
    });
  }

  events.sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());
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

  async getGameEvents(gameId: string, since?: Date): Promise<GameEvent[]> {
    const summary = await fetchESPNSummary("football", "nfl", gameId);
    if (!summary) return [];
    return mapPlaysToGameEvents(summary.plays, summary.teams, "nfl", gameId, since);
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

  async getGameEvents(gameId: string, since?: Date): Promise<GameEvent[]> {
    const summary = await fetchESPNSummary("basketball", "nba", gameId);
    if (!summary) return [];
    return mapPlaysToGameEvents(summary.plays, summary.teams, "nba", gameId, since);
  },
};
