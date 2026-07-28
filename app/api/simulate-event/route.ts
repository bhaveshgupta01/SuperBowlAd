import { NextRequest, NextResponse } from "next/server";
import { addGameEvent } from "@/lib/store";

const EVENT_PRESETS: Record<string, { description: string }> = {
  touchdown: { description: "Touchdown - Chiefs" },
  "touchdown-49ers": { description: "Touchdown - 49ers" },
  interception: { description: "Interception - 49ers" },
  "interception-chiefs": { description: "Interception - Chiefs" },
  field_goal: { description: "Field Goal - Chiefs" },
};

/**
 * POST /api/simulate-event — Manually trigger a game event for testing.
 * Body: { type: string } e.g. { type: "touchdown" }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const type = (body?.type ?? "touchdown") as string;
    const normalized = type.toLowerCase().replace(/\s+/g, "-");
    const preset = EVENT_PRESETS[normalized] ?? {
      description: `${type} - Custom`,
    };
    const timestamp = Math.floor(Date.now() / 1000);
    const event = addGameEvent({
      type: normalized.split("-")[0],
      description: preset.description,
      timestamp,
    });
    return NextResponse.json({ ok: true, event });
  } catch (e) {
    console.error("Simulate event error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
