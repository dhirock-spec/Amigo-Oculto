import { GoogleGenAI, Type } from "@google/genai";
import { GiftSuggestion } from "../types";

// Always use named parameter for apiKey and obtain it directly from process.env.API_KEY.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateGiftSuggestions = async (interests: string): Promise<GiftSuggestion[]> => {
  // Check for API_KEY presence directly from process.env.
  if (!process.env.API_KEY) {
    console.warn("No API Key provided, returning mock data");
    return [
      { title: "Meias Confortáveis", description: "Meias de lã quentes para o inverno.", imagePrompt: "wool socks" },
      { title: "Kit de Chocolate Quente", description: "Mistura gourmet de cacau com marshmallows.", imagePrompt: "hot cocoa mug" },
      { title: "Vela Natalina", description: "Vela perfumada com notas de pinho.", imagePrompt: "christmas candle" }
    ];
  }

  try {
    // For basic text tasks like this, use 'gemini-3-flash-preview'.
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Sugira 3 ideias de presentes criativas e distintas de Amigo Secreto para alguém interessado em: ${interests}. 
      Responda em Português do Brasil. Mantenha as descrições curtas (menos de 15 palavras). Forneça um prompt visual para um gerador de imagem.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              imagePrompt: { type: Type.STRING }
            },
            required: ["title", "description", "imagePrompt"]
          }
        }
      }
    });

    // Access the text property directly from GenerateContentResponse.
    if (response.text) {
      return JSON.parse(response.text.trim()) as GiftSuggestion[];
    }
    throw new Error("No data returned");
  } catch (error) {
    console.error("Error generating text suggestions:", error);
    return [];
  }
};

export const generateGiftImage = async (prompt: string): Promise<string | null> => {
  if (!process.env.API_KEY) return null;
  
  try {
    // General Image Generation Tasks use 'gemini-2.5-flash-image'.
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `Uma foto de produto festiva de alta qualidade de: ${prompt}. Fundo de Natal, iluminação suave, 4k.` }],
      },
    });

    // Iterate through all parts to find the image part as recommended.
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        const base64EncodeString: string = part.inlineData.data;
        return `data:image/png;base64,${base64EncodeString}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Error generating image:", error);
    return null;
  }
};