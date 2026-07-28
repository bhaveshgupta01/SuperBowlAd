import { nanoid } from "nanoid";
import { supabase } from "./supabase";

export async function generateDiscountCode(
  campaignId: string,
  predictionId: string | null,
  discountPercent: number,
  validityMins: number
): Promise<string> {
  const code = `${nanoid(8).toUpperCase()}`;
  const now = new Date();
  const validUntil = new Date(now.getTime() + validityMins * 60000);

  const { error } = await supabase.from("discount_codes").insert({
    campaign_id: campaignId,
    prediction_id: predictionId,
    code,
    discount_percent: discountPercent,
    valid_from: now.toISOString(),
    valid_until: validUntil.toISOString(),
  });

  if (error) throw error;
  return code;
}

export async function validateDiscountCode(code: string): Promise<{
  valid: boolean;
  discountPercent?: number;
  message: string;
}> {
  const { data, error } = await supabase
    .from("discount_codes")
    .select("*")
    .eq("code", code)
    .single();

  if (error) {
    return { valid: false, message: "Code not found" };
  }

  if (data.redeemed_at) {
    return { valid: false, message: "Code already redeemed" };
  }

  const now = new Date();
  const validUntil = new Date(data.valid_until);

  if (now > validUntil) {
    return { valid: false, message: "Code expired" };
  }

  return {
    valid: true,
    discountPercent: data.discount_percent,
    message: `${data.discount_percent}% discount valid until ${validUntil.toLocaleTimeString()}`,
  };
}

export async function redeemDiscountCode(code: string): Promise<boolean> {
  const { error } = await supabase
    .from("discount_codes")
    .update({ redeemed_at: new Date().toISOString() })
    .eq("code", code);

  if (error) {
    console.error("Error redeeming code:", error);
    return false;
  }

  return true;
}
