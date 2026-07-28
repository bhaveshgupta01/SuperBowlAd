import { NextResponse } from "next/server";
import { getGameEvents, getLatestEventForSimulation } from "@/lib/store";

/**
 * GET /api/events — List recent game events (for dashboard).
 * GET /api/events?latest=1 — Return only the latest event (for simulation page polling).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const latestOnly = searchParams.get("latest") === "1";

  if (latestOnly) {
    const event = getLatestEventForSimulation();
    return NextResponse.json({ event });
  }

  const events = getGameEvents();
  return NextResponse.json({ events });
}
