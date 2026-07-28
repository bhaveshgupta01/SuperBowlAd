/**
 * Campaign logic for AdBlitz: evaluates user reply timing and mints codes.
 *
 * Business rules (from the 2026-07 market analysis):
 * - The reply window anchors to when the STORY WAS POSTED, not the raw game
 *   event — customers always get the full advertised window.
 * - Codes are unique per user (base + random suffix), so a screenshot of one
 *   code can't be redeemed by the whole internet.
 * - WINs are capped per event (first N fast replies); the cap converts an
 *   unbounded discount liability into a fixed promo budget.
 * - Codes expire (default 24h) to force the visit the promo is meant to drive.
 */

export const WIN_WINDOW_SECONDS = 45;
export const DEFAULT_WINNER_CAP = 10;
export const CODE_VALIDITY_MINS = 24 * 60;

export type BetResult = "WIN" | "LATE";

/**
 * Was the reply inside the win window?
 * @param userReplyTime - Unix seconds when the user sent the DM
 * @param anchorTime - Unix seconds the window started (post time, or event time as fallback)
 * @param windowSecs - length of the win window
 */
export function evaluateReplyTiming(
  userReplyTime: number,
  anchorTime: number,
  windowSecs: number = WIN_WINDOW_SECONDS
): BetResult {
  const diffSeconds = userReplyTime - anchorTime;
  if (diffSeconds >= 0 && diffSeconds <= windowSecs) {
    return "WIN";
  }
  return "LATE";
}

// No 0/O/1/I — codes get read aloud at a register.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateUniqueCode(base: string): string {
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return `${base}-${suffix}`;
}

/** @deprecated kept for reference; the webhook now uses evaluateReplyTiming + generateUniqueCode */
export function evaluateBet(
  userReplyTime: number,
  eventTime: number
): { result: BetResult; code: string } {
  const result = evaluateReplyTiming(userReplyTime, eventTime);
  return { result, code: result === "WIN" ? "GOLD50" : "SILVER10" };
}
