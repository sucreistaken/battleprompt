// Gemini görsel üretimi.
// Model: GEMINI_IMAGE_MODEL (default gemini-2.5-flash-image)
// 3x retry, exponential backoff.

const { GoogleGenerativeAI } = require('@google/generative-ai');

let client = null;
function getClient() {
  if (client) return client;
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY is not set');
  client = new GoogleGenerativeAI(key);
  return client;
}

const IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image';

async function _generateOnce(prompt) {
  const gen = getClient().getGenerativeModel({ model: IMAGE_MODEL });
  const result = await gen.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }]
  });

  const candidates = result?.response?.candidates || [];
  for (const cand of candidates) {
    const parts = cand?.content?.parts || [];
    for (const p of parts) {
      if (p.inlineData?.data) {
        const buf = Buffer.from(p.inlineData.data, 'base64');
        return { buffer: buf, mimeType: p.inlineData.mimeType || 'image/png' };
      }
    }
  }
  throw new Error('Gemini response had no image');
}

async function generateImage(prompt, { retries = 3 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await _generateOnce(prompt);
    } catch (err) {
      lastErr = err;
      const backoff = Math.pow(2, attempt) * 1000;
      console.warn(`[gemini.image] attempt ${attempt + 1} failed:`, err.message);
      if (attempt < retries - 1) await new Promise((r) => setTimeout(r, backoff));
    }
  }
  throw lastErr || new Error('image generation failed');
}

module.exports = { generateImage };
