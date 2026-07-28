/**
 * Campaign logic for AdBlitz: evaluates user reply timing against game events.
 */

const WIN_WINDOW_SECONDS = 45;

export type BetResult = "WIN" | "LATE";

export interface EvaluateBetResponse {
  result: BetResult;
  code: string;
}

/**
 * Evaluates whether a user's DM reply qualifies for the premium or consolation code.
 * - WIN: user replied within 45 seconds of the event → GOLD50
 * - LATE: user replied after 45 seconds → SILVER10
 *
 * @param userReplyTime - Unix timestamp (seconds) when the user sent the DM
 * @param eventTime - Unix timestamp (seconds) when the game event occurred
 * @returns Result and discount code
 */
export function evaluateBet(
  userReplyTime: number,
  eventTime: number
): EvaluateBetResponse {
  const diffSeconds = userReplyTime - eventTime;

  if (diffSeconds >= 0 && diffSeconds <= WIN_WINDOW_SECONDS) {
    return { result: "WIN", code: "GOLD50" };
  }

  return { result: "LATE", code: "SILVER10" };
}
