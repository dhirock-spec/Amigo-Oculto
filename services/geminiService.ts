import { GoogleGenAI, Type } from "@google/genai";
import { GiftSuggestion } from "../types";

// Safety check for process.env to avoid "process is not defined" in browser environments
const getApiKey = () => {
  try {
    if (typeof process !== 'undefined' && process.env) {
      return process.env.API_KEY || '';
    }
  } catch (e) {
    // Ignore error if process is not accessible
  }
  return '';
};

const apiKey = getApiKey();
const ai = new GoogleGenAI({ apiKey });

export const generateGiftSuggestions = async (interests: string): Promise<GiftSuggestion[]> => {
  if (!apiKey) {
    console.warn("No API Key provided, returning mock data");
    return [
      { title: "Meias Confortáveis", description: "Meias de lã quentes para o inverno.", imagePrompt: "wool socks" },
      { title: "Kit de Chocolate Quente", description: "Mistura gourmet de cacau com marshmallows.", imagePrompt: "hot cocoa mug" },
      { title: "Vela Natalina", description: "Vela perfumada com notas de pinho.", imagePrompt: "christmas candle" }
    ];
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
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

    if (response.text) {
      return JSON.parse(response.text) as GiftSuggestion[];
    }
    throw new Error("No data returned");
  } catch (error) {
    console.error("Error generating text suggestions:", error);
    return [];
  }
};

export const generateGiftImage = async (prompt: string): Promise<string | null> => {
  if (!apiKey) return null;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `Uma foto de produto festiva de alta qualidade de: ${prompt}. Fundo de Natal, iluminação suave, 4k.` }],
      },
    });

    // Check all parts for the image
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData && part.inlineData.data) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Error generating image:", error);
    return null;
  }
};