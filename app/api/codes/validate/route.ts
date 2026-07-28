import { NextRequest, NextResponse } from "next/server";
import { validateDiscountCode, redeemDiscountCode } from "@/lib/codes";
import { isSupabaseConfigured } from "@/lib/supabase";
import { findBetByCode, markBetRedeemed } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, redeem } = body;

    if (!code) {
      return NextResponse.json(
        { error: "Code is required" },
        { status: 400 }
      );
    }

    // Zero-config path: validate/redeem against the in-memory bet registry
    // (codes minted by the instagram-webhook demo flow).
    if (!isSupabaseConfigured) {
      const bet = findBetByCode(code);
      if (!bet) {
        return NextResponse.json({ success: false, valid: false, message: "Code not found" });
      }
      if (bet.redeemedAt) {
        return NextResponse.json({ success: false, valid: false, message: "Code already redeemed" });
      }
      const now = Math.floor(Date.now() / 1000);
      if (now > bet.expiresAt) {
        return NextResponse.json({ success: false, valid: false, message: "Code expired" });
      }
      if (redeem) {
        markBetRedeemed(code);
      }
      return NextResponse.json({
        success: true,
        valid: true,
        discountPercent: bet.discountPercent,
        message: redeem
          ? `Redeemed — ${bet.discountPercent}% off`
          : `Valid — ${bet.discountPercent}% off until ${new Date(bet.expiresAt * 1000).toLocaleTimeString()}`,
      });
    }

    // Validate code
    const validation = await validateDiscountCode(code);

    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          message: validation.message,
        },
        { status: 200 }
      );
    }

    // Optionally redeem the code
    if (redeem) {
      const redeemed = await redeemDiscountCode(code);
      if (!redeemed) {
        return NextResponse.json(
          {
            success: false,
            message: "Failed to redeem code",
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      valid: true,
      discountPercent: validation.discountPercent,
      message: validation.message,
    });
  } catch (error) {
    console.error("Code validation error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to validate code",
      },
      { status: 500 }
    );
  }
}
