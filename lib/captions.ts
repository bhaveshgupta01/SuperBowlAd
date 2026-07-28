import { generateFromPrompt } from "./gemini";
import type { GameEvent } from "./store";

/**
 * Caption generation for game-event posts, shared by the generate-post API
 * route and the game watcher's auto-poster. Gemini when GEMINI_API_KEY is
 * set, template fallback otherwise.
 */

export function buildPromptForEvent(event: Pick<GameEvent, "description">, windowSecs: number): string {
  return `Create an Instagram story caption for this live game moment: "${event.description}". Call to action: ask viewers to reply within ${windowSecs} seconds of this post to get a discount. Keep it short, punchy, and Super Bowl themed.`;
}

export function templateCaptionForEvent(event: Pick<GameEvent, "type" | "description">, windowSecs: number): string {
  const templates: Record<string, string> = {
    touchdown: `🏈 TOUCHDOWN! ${event.description}\n\nReply within ${windowSecs} seconds and we'll send you a discount code. Don't miss it! ⚡`,
    interception: `😱 INTERCEPTION! ${event.description}\n\nReply in the next ${windowSecs} seconds to grab your discount. Quick! 🔥`,
    field_goal: `✅ Field goal! ${event.description}\n\nReply now (within ${windowSecs} sec) for your exclusive code. 🎯`,
  };
  return (
    templates[event.type.toLowerCase()] ??
    `${event.description}\n\nReply within ${windowSecs} seconds for your discount code! ⚡`
  );
}

export async function captionForEvent(
  event: Pick<GameEvent, "type" | "description">,
  windowSecs: number
): Promise<{ prompt: string; caption: string }> {
  const prompt = buildPromptForEvent(event, windowSecs);
  const caption = (await generateFromPrompt(prompt)) ?? templateCaptionForEvent(event, windowSecs);
  return { prompt, caption };
}
