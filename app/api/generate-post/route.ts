import { NextRequest, NextResponse } from "next/server";
import { getGameEvents } from "@/lib/store";
import { generateFromPrompt } from "@/lib/gemini";

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

    const prompt = `Create an Instagram story caption for this live game moment: "${event.description}". Call to action: ask viewers to reply within 45 seconds to get a discount. Keep it short, punchy, and Super Bowl themed.`;

    const templates: Record<string, string> = {
      touchdown: `🏈 TOUCHDOWN! ${event.description}\n\nReply within 45 seconds and we'll send you a discount code. Don't miss it! ⚡`,
      interception: `😱 INTERCEPTION! ${event.description}\n\nReply in the next 45 seconds to grab your discount. Quick! 🔥`,
      field_goal: `✅ Field goal! ${event.description}\n\nReply now (within 45 sec) for your exclusive code. 🎯`,
    };
    const type = event.type.toLowerCase();
    const templateCaption = templates[type] ?? `${event.description}\n\nReply within 45 seconds for your discount code! ⚡`;

    const caption = (await generateFromPrompt(prompt)) ?? templateCaption;

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
