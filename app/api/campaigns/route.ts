import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { getCurrentUser, getBusinessProfile } from "@/lib/auth";
import { getBettingScenarios } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Zero-config fallback: without Supabase (or a signed-in user) the
    // dashboard's Campaign Manager reads the in-memory scenarios instead.
    const user = isSupabaseConfigured ? await getCurrentUser() : null;
    if (!user) {
      return NextResponse.json({ scenarios: getBettingScenarios() });
    }

    const business = await getBusinessProfile(user.id);
    if (!business) {
      return NextResponse.json(
        { error: "Business profile not found" },
        { status: 404 }
      );
    }

    // Get campaigns for this business
    const { data: campaigns, error } = await supabase
      .from("campaigns")
      .select("*")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: campaigns,
    });
  } catch (error) {
    console.error("Campaigns GET error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch campaigns",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const business = await getBusinessProfile(user.id);
    if (!business) {
      return NextResponse.json(
        { error: "Business profile not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      sport,
      game_id,
      event_types,
      prediction_type,
      timing_window_secs,
      discount_percent,
      code_validity_mins,
      auto_post_interval_mins,
      active,
    } = body;

    // Validate required fields
    if (
      !sport ||
      !game_id ||
      !event_types ||
      !prediction_type ||
      !timing_window_secs ||
      discount_percent === undefined ||
      code_validity_mins === undefined
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create campaign
    const { data: campaign, error } = await supabase
      .from("campaigns")
      .insert({
        business_id: business.id,
        sport,
        game_id,
        event_types: Array.isArray(event_types) ? event_types : [event_types],
        prediction_type,
        timing_window_secs,
        discount_percent,
        code_validity_mins,
        auto_post_interval_mins,
        active: active ?? false,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(
      {
        success: true,
        data: campaign,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Campaigns POST error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create campaign",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const business = await getBusinessProfile(user.id);
    if (!business) {
      return NextResponse.json(
        { error: "Business profile not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { campaign_id, ...updates } = body;

    if (!campaign_id) {
      return NextResponse.json(
        { error: "campaign_id is required" },
        { status: 400 }
      );
    }

    // Verify campaign belongs to user
    const { data: existingCampaign } = await supabase
      .from("campaigns")
      .select("business_id")
      .eq("id", campaign_id)
      .single();

    if (!existingCampaign || existingCampaign.business_id !== business.id) {
      return NextResponse.json(
        { error: "Campaign not found or unauthorized" },
        { status: 404 }
      );
    }

    // Update campaign
    const { data: campaign, error } = await supabase
      .from("campaigns")
      .update(updates)
      .eq("id", campaign_id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    console.error("Campaigns PATCH error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to update campaign",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const business = await getBusinessProfile(user.id);
    if (!business) {
      return NextResponse.json(
        { error: "Business profile not found" },
        { status: 404 }
      );
    }

    const campaignId = request.nextUrl.searchParams.get("id");
    if (!campaignId) {
      return NextResponse.json(
        { error: "campaign id is required" },
        { status: 400 }
      );
    }

    // Verify campaign belongs to user
    const { data: existingCampaign } = await supabase
      .from("campaigns")
      .select("business_id")
      .eq("id", campaignId)
      .single();

    if (!existingCampaign || existingCampaign.business_id !== business.id) {
      return NextResponse.json(
        { error: "Campaign not found or unauthorized" },
        { status: 404 }
      );
    }

    // Delete campaign
    const { error } = await supabase.from("campaigns").delete().eq("id", campaignId);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "Campaign deleted",
    });
  } catch (error) {
    console.error("Campaigns DELETE error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to delete campaign",
      },
      { status: 500 }
    );
  }
}
