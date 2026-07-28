import { NextRequest, NextResponse } from "next/server";
import { getPostById, getBetsForPost } from "@/lib/store";

/**
 * GET /api/posts/[id]/stats — Stats for a single post: interactions, got discount, promo usage.
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
  const gotDiscount = bets.length; // everyone who replied got a code (WIN or LATE)
  const winCount = bets.filter((b) => b.result === "WIN").length;
  const lateCount = bets.filter((b) => b.result === "LATE").length;
  const usedGold50 = bets.filter((b) => b.code === "GOLD50").length;
  const usedSilver10 = bets.filter((b) => b.code === "SILVER10").length;

  return NextResponse.json({
    postId: id,
    interactions,
    gotDiscount,
    winCount,
    lateCount,
    usedPromoCode: {
      GOLD50: usedGold50,
      SILVER10: usedSilver10,
    },
  });
}
