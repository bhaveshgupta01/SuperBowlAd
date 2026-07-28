import { NextRequest, NextResponse } from "next/server";
import {
  evaluateReplyTiming,
  generateUniqueCode,
  CODE_VALIDITY_MINS,
} from "@/lib/campaign-logic";
import {
  getActiveScenarioForEventType,
  addUserBet,
  getGameEvents,
  getActivePostId,
  getPostById,
  findBetByUserAndEvent,
  countWinsForEvent,
} from "@/lib/store";

export interface WebhookPayload {
  userId: string;
  message: string;
  timestamp: number; // Unix seconds (when user sent the DM)
}

/**
 * Simulated Instagram DM webhook.
 * POST body: { userId, message, timestamp }
 *
 * Business rules:
 * - Window anchors to the story's postedAt (full advertised window for the
 *   customer), falling back to the game-event time when no post exists.
 * - One play per user per event — repeat replies return the original code.
 * - Gold codes are capped per event (scenario.winnerCap); once sold out,
 *   in-window replies still get the consolation tier.
 * - Every code is unique (base-XXXX) and expires after CODE_VALIDITY_MINS.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as WebhookPayload;
    const { userId, timestamp: userReplyTime } = body;

    if (!userId || typeof userReplyTime !== "number") {
      return NextResponse.json(
        { error: "Missing userId or timestamp" },
        { status: 400 }
      );
    }

    // Customers reply to the STORY they see, so evaluate against the active
    // post's event — not the newest raw game event (which may be a moment with
    // no campaign, e.g. a sack that fired after the field-goal story).
    const events = getGameEvents();
    const activePostId = getActivePostId();
    const activePost = activePostId ? getPostById(activePostId) : null;
    const latestRelevant =
      (activePost && events.find((e) => e.id === activePost.eventId)) ??
      events[0] ??
      null;
    if (!latestRelevant) {
      return NextResponse.json(
        { error: "No game event to evaluate against", code: null },
        { status: 200 }
      );
    }

    const scenario = getActiveScenarioForEventType(
      latestRelevant.type.toLowerCase()
    );
    if (!scenario) {
      return NextResponse.json(
        { error: "No active campaign for this event type", code: null },
        { status: 200 }
      );
    }

    // One play per user per event
    const existing = findBetByUserAndEvent(userId, latestRelevant.id);
    if (existing) {
      return NextResponse.json({
        result: existing.result,
        code: existing.code,
        alreadyPlayed: true,
        expiresAt: existing.expiresAt,
        message: `You already played this one! Your code is ${existing.code} (${existing.discountPercent}% off).`,
      });
    }

    // Anchor the window to the story post when one exists for this event
    const anchorTime =
      activePost && activePost.eventId === latestRelevant.id
        ? activePost.postedAt
        : latestRelevant.timestamp;

    let result = evaluateReplyTiming(
      userReplyTime,
      anchorTime,
      scenario.winWindowSecs
    );

    // Winner cap: gold is a fixed promo budget, not unbounded liability
    let goldSoldOut = false;
    if (result === "WIN" && countWinsForEvent(latestRelevant.id) >= scenario.winnerCap) {
      result = "LATE";
      goldSoldOut = true;
    }

    const codeBase = result === "WIN" ? scenario.winCodeBase : scenario.lateCodeBase;
    const discountPercent =
      result === "WIN" ? scenario.winDiscountPercent : scenario.lateDiscountPercent;
    const code = generateUniqueCode(codeBase);
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + CODE_VALIDITY_MINS * 60;

    const postId = activePost?.id;
    addUserBet({
      userId,
      scenarioId: scenario.id,
      eventId: latestRelevant.id,
      eventTime: latestRelevant.timestamp,
      replyTime: userReplyTime,
      latencySecs: Math.max(0, userReplyTime - anchorTime),
      result,
      code,
      discountPercent,
      expiresAt,
      ...(postId && { postId }),
    });

    const validityHours = Math.round(CODE_VALIDITY_MINS / 60);
    const message =
      result === "WIN"
        ? `🎉 You made it! Code ${code} — ${discountPercent}% off, valid ${validityHours}h.`
        : goldSoldOut
          ? `⚡ Gold codes sold out for this one! Here's ${code} — ${discountPercent}% off, valid ${validityHours}h.`
          : `⏱️ A bit late this time — code ${code} gets you ${discountPercent}% off, valid ${validityHours}h.`;

    return NextResponse.json({ result, code, discountPercent, expiresAt, goldSoldOut, message });
  } catch (e) {
    console.error("Instagram webhook error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
