import { NextRequest, NextResponse } from "next/server";
import { validateDiscountCode, redeemDiscountCode } from "@/lib/codes";

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
