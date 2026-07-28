import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { generateDiscountCode } from "@/lib/codes";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      post_id,
      customer_identifier,
      prediction_value,
      submitted_at,
    } = body;

    if (!post_id || !customer_identifier || !prediction_value) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get the post to find campaign and timing
    const { data: post, error: postError } = await supabase
      .from("posts")
      .select("*")
      .eq("id", post_id)
      .single();

    if (postError || !post) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .select("*")
      .eq("id", post.campaign_id)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    const submittedTime = submitted_at || Math.floor(Date.now() / 1000);
    const postedTime = Math.floor(new Date(post.posted_at).getTime() / 1000);
    const secondsElapsed = submittedTime - postedTime;
    const withinWindow = secondsElapsed >= 0 && secondsElapsed <= campaign.timing_window_secs;

    // Create prediction record
    const { data: prediction, error: predError } = await supabase
      .from("predictions")
      .insert({
        post_id,
        customer_identifier,
        prediction_value,
        submitted_at: new Date(submittedTime * 1000).toISOString(),
        within_window: withinWindow,
        is_correct: null, // Will be set when event resolves
      })
      .select()
      .single();

    if (predError) throw predError;

    // Generate discount code if within window
    let code = null;
    if (withinWindow) {
      code = await generateDiscountCode(
        campaign.id,
        prediction.id,
        campaign.discount_percent,
        campaign.code_validity_mins
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          prediction,
          code,
          withinWindow,
          secondsElapsed,
          message: withinWindow
            ? `🎉 Got it! Code: ${code}`
            : "⏱️ Too late this time — replies must arrive within the campaign window.",
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Predictions POST error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to submit prediction",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const postId = request.nextUrl.searchParams.get("post_id");

    let query = supabase.from("predictions").select("*");

    if (postId) {
      query = query.eq("post_id", postId);
    }

    const { data: predictions, error } = await query.order("submitted_at", {
      ascending: false,
    });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: predictions,
    });
  } catch (error) {
    console.error("Predictions GET error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch predictions",
      },
      { status: 500 }
    );
  }
}
