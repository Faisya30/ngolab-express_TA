import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function generateAiRecommendation(prompt) {
  const models = ['gemini-2.5-flash', 'gemini-1.5-flash'];
  let lastError = null;

  for (const model of models) {
    try {
      console.log('[GEMINI] Trying model:', model);
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
      });

      console.log('[GEMINI] Success with model:', model);
      const aiText = response.text;
      console.log('[GEMINI RAW RESPONSE]', aiText);
      return aiText;
    } catch (error) {
      lastError = error;
      console.error('[GEMINI] Model failed:', model, error.message);
      
      const isHighDemand = String(error.message || '').includes('503') || 
        String(error.message || '').includes('high demand') ||
        String(error.message || '').includes('UNAVAILABLE');
      
      if (!isHighDemand) {
        throw error;
      }
      
      console.log('[GEMINI] Retrying with next model...');
    }
  }

  throw lastError;
}
