import { NextRequest, NextResponse } from "next/server";
import { evaluateBet } from "@/lib/campaign-logic";
import {
  getActiveScenarioForEventType,
  addUserBet,
  getGameEvents,
  getActivePostId,
} from "@/lib/store";

export interface WebhookPayload {
  userId: string;
  message: string;
  timestamp: number; // Unix seconds (when user sent the DM)
}

/**
 * Simulated Instagram DM webhook.
 * POST body: { userId, message, timestamp }
 * Returns discount code based on evaluateBet(userReplyTime, eventTime).
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as WebhookPayload;
    const { userId, message, timestamp: userReplyTime } = body;

    if (!userId || typeof userReplyTime !== "number") {
      return NextResponse.json(
        { error: "Missing userId or timestamp" },
        { status: 400 }
      );
    }

    const events = getGameEvents();
    const latestRelevant = events[0]; // Most recent event
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

    const eventTime = latestRelevant.timestamp;
    const { result, code } = evaluateBet(userReplyTime, eventTime);

    const postId = getActivePostId();
    addUserBet({
      userId,
      scenarioId: scenario.id,
      eventTime,
      replyTime: userReplyTime,
      result,
      code,
      ...(postId && { postId }),
    });

    return NextResponse.json({
      result,
      code,
      message:
        result === "WIN"
          ? "You replied in time! Use code " + code
          : "You were a bit late. Use code " + code,
    });
  } catch (e) {
    console.error("Instagram webhook error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
