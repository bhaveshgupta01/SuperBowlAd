import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn("GEMINI_API_KEY not set. AI generation will be disabled.");
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// gemini-2.0-flash's free tier was retired (limit 0); the -latest alias tracks
// the newest flash-lite model, which keeps free-tier quota for keys without billing.
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-flash-lite-latest";

interface CaptionGeneratorOptions {
  sport: string;
  eventType: string;
  eventDescription: string;
  businessName: string;
  discountPercent: number;
  timingWindowSecs: number;
}

interface ImageGeneratorOptions {
  sport: string;
  eventType: string;
  eventDescription: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
}

/**
 * Generate free-form text from a raw prompt. Returns null when the API key is
 * missing or the call fails, so callers can fall back to templates.
 */
export async function generateFromPrompt(prompt: string): Promise<string | null> {
  if (!genAI) {
    return null;
  }

  try {
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    return text.length > 0 ? text : null;
  } catch (error) {
    console.error("Gemini generation error:", error);
    return null;
  }
}

export async function generateCaption(options: CaptionGeneratorOptions): Promise<{
  caption: string;
  hashtags: string[];
}> {
  if (!genAI) {
    return getDefaultCaption(options);
  }

  try {
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

    const prompt = `Generate a short, engaging Instagram story caption for ${options.businessName}.
Event: ${options.eventDescription} (${options.sport.toUpperCase()})
Event Type: ${options.eventType}
Discount: ${options.discountPercent}% off
Prediction Window: ${options.timingWindowSecs} seconds

Requirements:
- Keep it under 150 characters
- Use emojis relevant to the sport
- Create urgency ("React within ${options.timingWindowSecs}s!")
- Include a prediction question (YES/NO)
- Make it fun and exciting
- End with call-to-action: "Reply YES or NO to win!"

Format the response as JSON with keys: "caption" and "hashtags" (array of 3-5 hashtags).`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    try {
      const parsed = JSON.parse(text);
      return {
        caption: parsed.caption || getDefaultCaption(options).caption,
        hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : [],
      };
    } catch {
      return getDefaultCaption(options);
    }
  } catch (error) {
    console.error("Gemini caption generation error:", error);
    return getDefaultCaption(options);
  }
}

export async function generateImage(options: ImageGeneratorOptions): Promise<string | null> {
  if (!genAI) {
    return null;
  }

  try {
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

    const prompt = `Create a vibrant, sports-themed image for a social media post about this moment:
${options.eventDescription}
${options.homeTeam} vs ${options.awayTeam}
Score: ${options.homeTeam} ${options.homeScore} - ${options.awayScore} ${options.awayTeam}

Style: Bold colors, energetic, modern sports design. Include the event name prominently. Make it suitable for Instagram stories (9:16 aspect ratio).
Sport: ${options.sport}`;

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
    });

    // Note: Gemini doesn't return image URLs directly
    // In production, integrate with Vertex AI Image Generation or use Stability AI
    // For now, return null to indicate image generation failed
    return null;
  } catch (error) {
    console.error("Gemini image generation error:", error);
    return null;
  }
}

function getDefaultCaption(options: CaptionGeneratorOptions): {
  caption: string;
  hashtags: string[];
} {
  const sport = options.sport.toUpperCase();
  const emoji = getSportEmoji(options.sport);
  const defaultCaptions = [
    `${emoji} ${options.eventDescription}\n\nReply YES or NO within ${options.timingWindowSecs}s to win ${options.discountPercent}% off! ⚡`,
    `🔥 ${options.eventDescription}\n\nPrediction time! React in ${options.timingWindowSecs} seconds for your code 🎯`,
    `⚡ LIVE: ${options.eventDescription}\n\nCan you predict what happens next? Reply now! ${emoji}`,
  ];

  const caption = defaultCaptions[Math.floor(Math.random() * defaultCaptions.length)];
  const hashtags = [`#${sport}`, "#LivePredictions", "#ExclusiveDeal", "#SportsRewards"];

  return { caption, hashtags };
}

function getSportEmoji(sport: string): string {
  const emojis: Record<string, string> = {
    nfl: "🏈",
    nba: "🏀",
    soccer: "⚽",
    football: "⚽",
    cricket: "🏏",
  };
  return emojis[sport.toLowerCase()] || "🎉";
}
