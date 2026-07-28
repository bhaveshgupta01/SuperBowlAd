import { NextRequest, NextResponse } from "next/server";
import {
  getPostById,
  getBetsForPost,
  getBettingScenarios,
} from "@/lib/store";

export const dynamic = "force-dynamic";

/**
 * GET /api/posts/[id]/stats — Owner-facing ROI metrics for one post:
 * engagement, win/late split, redemption by tier, latency, gold-cap usage.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const post = getPostById(id);
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const bets = getBetsForPost(id);
  const interactions = bets.length;
  const uniqueUsers = new Set(bets.map((b) => b.userId)).size;
  const winBets = bets.filter((b) => b.result === "WIN");
  const lateBets = bets.filter((b) => b.result === "LATE");
  const redeemedGold = winBets.filter((b) => b.redeemedAt).length;
  const redeemedSilver = lateBets.filter((b) => b.redeemedAt).length;

  const latencies = bets
    .map((b) => b.latencySecs)
    .filter((n): n is number => typeof n === "number")
    .sort((a, b) => a - b);
  const medianReplyLatencySecs =
    latencies.length > 0 ? latencies[Math.floor(latencies.length / 2)] : null;

  // Gold-cap usage: find the scenario driving this post's event, if any
  const scenario =
    getBettingScenarios().find((s) =>
      bets.some((b) => b.scenarioId === s.id)
    ) ?? null;

  return NextResponse.json({
    postId: id,
    interactions,
    uniqueUsers,
    gotDiscount: interactions,
    winCount: winBets.length,
    lateCount: lateBets.length,
    redeemed: {
      gold: redeemedGold,
      silver: redeemedSilver,
      total: redeemedGold + redeemedSilver,
    },
    redemptionRatePct:
      interactions > 0
        ? Math.round(((redeemedGold + redeemedSilver) / interactions) * 100)
        : 0,
    medianReplyLatencySecs,
    goldCap: scenario
      ? { used: winBets.length, total: scenario.winnerCap }
      : null,
    usedPromoCode: {
      GOLD50: winBets.length,
      SILVER10: lateBets.length,
    },
  });
}
