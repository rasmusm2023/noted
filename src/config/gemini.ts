// Gemini API Configuration
// This file handles the secure configuration for Gemini AI

import { HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

export const geminiConfig = {
  // Get API key from environment variables
  apiKey: import.meta.env.VITE_GEMINI_API_KEY,

  // Gemini model configuration
  model: "gemini-1.5-flash",

  // Generation settings
  generationConfig: {
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 2048,
  },

  // Safety settings
  safetySettings: [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
  ],
};

// Validate that API key is available
export const validateGeminiConfig = () => {
  if (!geminiConfig.apiKey) {
    console.warn(
      "Gemini API key not found. Please set VITE_GEMINI_API_KEY in your .env file"
    );
    return false;
  }
  return true;
};
