import { NextRequest, NextResponse } from "next/server";
import { generateCaption } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      sport,
      eventType,
      eventDescription,
      businessName,
      discountPercent,
      timingWindowSecs,
    } = body;

    if (!sport || !eventType || !eventDescription || !businessName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { caption, hashtags } = await generateCaption({
      sport,
      eventType,
      eventDescription,
      businessName,
      discountPercent: discountPercent || 20,
      timingWindowSecs: timingWindowSecs || 120,
    });

    return NextResponse.json({
      success: true,
      data: { caption, hashtags },
    });
  } catch (error) {
    console.error("Post generation error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate post content",
      },
      { status: 500 }
    );
  }
}
