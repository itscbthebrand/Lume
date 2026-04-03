import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

export const models = {
  flash: "gemini-3-flash-preview",
  pro: "gemini-3.1-pro-preview",
  lite: "gemini-3.1-flash-lite-preview",
  live: "gemini-3.1-flash-live-preview",
  image: "gemini-2.5-flash-image",
};

export async function askShiPuAI(prompt: string, context?: string) {
  const response = await ai.models.generateContent({
    model: models.flash,
    contents: context ? `${context}\n\nUser: ${prompt}` : prompt,
    config: {
      systemInstruction: "You are ShiPu AI, the intelligent assistant for Lume social media app. You are helpful, friendly, and provide accurate information. If the user asks a question, provide a comprehensive and helpful answer. If analyzing a post, provide a concise summary and insights.",
    },
  });
  return response.text;
}

export async function factCheckPost(content: string) {
  const response = await ai.models.generateContent({
    model: models.flash,
    contents: `Perform a reality check on this post content: "${content}". Use Google Search to verify claims. If the information is fake or unverified, flag it clearly, provide the correct information, and explain why it might be misleading. If it's true, confirm it.`,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });
  return response.text;
}

export async function analyzeMedia(mediaUrl: string, mimeType: string, prompt: string) {
  const response = await ai.models.generateContent({
    model: models.pro,
    contents: {
      parts: [
        { text: prompt },
        { inlineData: { data: mediaUrl, mimeType } }
      ]
    }
  });
  return response.text;
}

export async function getPlaceInfo(placeName: string, userLocation?: { lat: number, lng: number }) {
  const response = await ai.models.generateContent({
    model: models.flash,
    contents: `Find information about this place: ${placeName}`,
    config: {
      tools: [{ googleMaps: {} }],
      toolConfig: userLocation ? {
        retrievalConfig: {
          latLng: {
            latitude: userLocation.lat,
            longitude: userLocation.lng
          }
        }
      } : undefined
    }
  });
  return response.text;
}
