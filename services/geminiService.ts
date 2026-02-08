
import { GoogleGenAI, Type } from "@google/genai";
import { GeneratorOptions } from "../types";

export class GeminiService {
  static async generateCaption(options: GeneratorOptions): Promise<{ caption: string; hashtags: string[]; chatbotKeyword: string }> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = 'gemini-3-flash-preview';

    const isPrediction = options.engagementMode === 'Prediction';
    const triggerContext = options.contextData ? `REAL-TIME EVENT DATA: ${JSON.stringify(options.contextData)}` : '';
    
    const systemInstruction = `You are a world-class Super Bowl social media strategist. 
    ${isPrediction ? 
      "Create a 'Live Prediction' post. Ask a specific, high-stakes question about what will happen in the NEXT 30-60 SECONDS of the game." : 
      "Create a high-energy viral post celebrating the current moment."
    }
    STYLE: ${options.style}. PLATFORM: ${options.platform}.
    
    ${triggerContext}

    MANDATORY CHATBOT HOOK: You must provide a 'chatbotKeyword' (a single uppercase word like 'TD', 'RUSH', 'WIN').
    Ensure the caption ends with: "Comment [KEYWORD] to get the exclusive game analysis DM'd to you!"
    
    Return JSON with 'caption', 'hashtags', and 'chatbotKeyword'.`;

    const promptContext = `EVENT: ${options.gameEvent}. ${options.prompt ? `CONTEXT: ${options.prompt}` : ''}`;

    const response = await ai.models.generateContent({
      model,
      contents: `Generate a ${options.engagementMode} post for ${options.platform}. ${promptContext}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            caption: { type: Type.STRING },
            hashtags: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            chatbotKeyword: { type: Type.STRING }
          },
          required: ["caption", "hashtags", "chatbotKeyword"]
        }
      }
    });

    try {
      return JSON.parse(response.text?.trim() || '{}');
    } catch (e) {
      return { caption: response.text || '', hashtags: [], chatbotKeyword: 'SCORE' };
    }
  }

  static async generateImage(options: GeneratorOptions): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = 'gemini-2.5-flash-image';

    const visualSubject = options.contextData?.raw_text || options.gameEvent + (options.prompt ? `, ${options.prompt}` : '');
    const imagePrompt = `Action sports photography of ${visualSubject} at Super Bowl LIX. 
    Cinematic lighting, motion blur, hyper-realistic, professional broadcast quality. No text in image.`;

    const response = await ai.models.generateContent({
      model,
      contents: { parts: [{ text: imagePrompt }] },
      config: { imageConfig: { aspectRatio: "1:1" } }
    });

    const candidate = response.candidates?.[0];
    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    throw new Error("No image data returned from Gemini");
  }

  static async generateVideo(options: GeneratorOptions): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = 'veo-3.1-fast-generate-preview';

    const visualSubject = options.contextData?.raw_text || options.gameEvent + (options.prompt ? `, ${options.prompt}` : '');
    const videoPrompt = `Slow-motion cinematic 1080p footage of ${visualSubject} at the Super Bowl. High-intensity NFL action.`;

    let operation = await ai.models.generateVideos({
      model,
      prompt: videoPrompt,
      config: { numberOfVideos: 1, resolution: '1080p', aspectRatio: '16:9' }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("Video generation failed");

    const fetchResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const blob = await fetchResponse.blob();
    return URL.createObjectURL(blob);
  }
}
