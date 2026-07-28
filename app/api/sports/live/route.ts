import { NextRequest, NextResponse } from "next/server";
import { getLiveGames } from "@/lib/sports";

export async function GET(request: NextRequest) {
  try {
    const sport = request.nextUrl.searchParams.get("sport") as
      | "nfl"
      | "nba"
      | "soccer"
      | "cricket"
      | null;

    const games = await getLiveGames(sport || undefined);

    return NextResponse.json({
      success: true,
      data: games,
      count: games.length,
    });
  } catch (error) {
    console.error("Sports API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch live games",
      },
      { status: 500 }
    );
  }
}
