/**
 * Gemini Vision - FREE tier only for image understanding.
 * Converts images to structured text; no paid APIs.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const VISION_MODEL = 'gemini-1.5-flash';

/**
 * @param {string} apiKey - Gemini API key (free tier)
 */
export function createGeminiVision(apiKey) {
  if (!apiKey?.trim()) {
    return {
      async describeImage() {
        return { text: '', error: 'Gemini API key not set. Add GEMINI_API_KEY to server/.env for image uploads.' };
      },
    };
  }

  const genAI = new GoogleGenerativeAI(apiKey.trim());

  return {
    /**
     * Describe image and extract structured content (tasks, notes, schedule).
     * @param {Buffer} imageBuffer
     * @param {string} mimeType - e.g. image/png
     * @returns {Promise<{ text: string; error?: string }>}
     */
    async describeImage(imageBuffer, mimeType = 'image/png') {
      try {
        const model = genAI.getGenerativeModel({ model: VISION_MODEL });
        const part = {
          inlineData: {
            data: imageBuffer.toString('base64'),
            mimeType,
          },
        };
        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [part] }],
          generationConfig: {
            maxOutputTokens: 1024,
            temperature: 0.2,
          },
        });
        const response = result.response;
        const text = response.text?.()?.trim() ?? '';
        return { text };
      } catch (e) {
        const msg = e.message || 'Vision request failed';
        return { text: '', error: msg };
      }
    },
  };
}
