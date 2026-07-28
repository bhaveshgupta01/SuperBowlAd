import { NextRequest, NextResponse } from "next/server";
import { getGameEvents, getActiveScenarioForEventType } from "@/lib/store";
import { buildPromptForEvent, templateCaptionForEvent } from "@/lib/captions";
import { generateFromPrompt } from "@/lib/gemini";
import { WIN_WINDOW_SECONDS } from "@/lib/campaign-logic";

/**
 * POST /api/generate-post
 * Body: { eventId: string } — use this game event to generate prompt + caption.
 * Returns { prompt, caption }. Uses Gemini when GEMINI_API_KEY is set,
 * otherwise falls back to string templates.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const eventId = body?.eventId as string | undefined;
    const eventDescription = body?.eventDescription as string | undefined;
    const eventType = body?.eventType as string | undefined;

    const events = getGameEvents();
    let event = eventId
      ? events.find((e) => e.id === eventId)
      : events[0];

    // Fallback: use body payload when store is empty (e.g. different worker/process)
    if (!event && eventDescription && eventType) {
      event = {
        id: eventId || "fallback",
        type: eventType,
        description: eventDescription,
        timestamp: Math.floor(Date.now() / 1000),
        createdAt: Math.floor(Date.now() / 1000),
      };
    }

    if (!event) {
      return NextResponse.json(
        { error: "No event found. Simulate an event first." },
        { status: 400 }
      );
    }

    const windowSecs =
      getActiveScenarioForEventType(event.type.toLowerCase())?.winWindowSecs ??
      WIN_WINDOW_SECONDS;

    const prompt = buildPromptForEvent(event, windowSecs);
    const caption =
      (await generateFromPrompt(prompt)) ?? templateCaptionForEvent(event, windowSecs);

    return NextResponse.json({
      eventId: event.id,
      eventDescription: event.description,
      prompt,
      caption,
    });
  } catch (e) {
    console.error("Generate post error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
