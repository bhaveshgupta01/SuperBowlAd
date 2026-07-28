import { NextRequest, NextResponse } from "next/server";
import {
  startWatcher,
  stopWatcher,
  getWatcherStatus,
  FEATURED_REPLAY,
  WatcherConfig,
} from "@/lib/watcher";

export const dynamic = "force-dynamic";

/**
 * GET /api/watcher — watcher status + the featured replay game.
 * POST /api/watcher — { action: "start", sport, gameId, mode, intervalSecs?, autoPost?, label? }
 *                     { action: "stop" }
 */
export async function GET() {
  return NextResponse.json({
    status: getWatcherStatus(),
    featuredReplay: FEATURED_REPLAY,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body?.action as string;

    if (action === "stop") {
      return NextResponse.json({ status: stopWatcher() });
    }

    if (action === "start") {
      const sport = body?.sport === "nba" ? "nba" : "nfl";
      const gameId = body?.gameId as string | undefined;
      const mode = body?.mode === "live" ? "live" : "replay";
      if (!gameId) {
        return NextResponse.json({ error: "gameId is required" }, { status: 400 });
      }
      const config: WatcherConfig = {
        sport,
        gameId,
        mode,
        intervalSecs: typeof body?.intervalSecs === "number" ? body.intervalSecs : 15,
        autoPost: body?.autoPost !== false,
        label: typeof body?.label === "string" ? body.label : undefined,
      };
      const status = await startWatcher(config);
      return NextResponse.json({ status });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    console.error("Watcher API error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
