// Pollinations görsel üretimi — ücretsiz, API key gerektirmez.
// Endpoint: https://image.pollinations.ai/prompt/{prompt}
// Model: POLLINATIONS_IMAGE_MODEL (default flux)

const { timeoutMs, withTimeout } = require('../async.js');

const MODEL = process.env.POLLINATIONS_IMAGE_MODEL || 'flux';
const WIDTH = Number(process.env.POLLINATIONS_IMAGE_WIDTH) || 1024;
const HEIGHT = Number(process.env.POLLINATIONS_IMAGE_HEIGHT) || 1024;

async function _generateOnce(prompt) {
  const params = new URLSearchParams({
    width: String(WIDTH),
    height: String(HEIGHT),
    model: MODEL,
    nologo: 'true',
    seed: String(Math.floor(Math.random() * 1e9)),
  });
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${params}`;
  const headers = {};
  if (process.env.POLLINATIONS_API_KEY) {
    headers.Authorization = `Bearer ${process.env.POLLINATIONS_API_KEY}`;
  }

  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`Pollinations HTTP ${res.status}`);
  }
  const mimeType = res.headers.get('content-type') || 'image/jpeg';
  const buffer = Buffer.from(await res.arrayBuffer());
  if (!buffer.length) throw new Error('Pollinations response was empty');
  return { buffer, mimeType };
}

async function generateImage(prompt, { retries = 3 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const ms = timeoutMs('POLLINATIONS_IMAGE', 60000);
      return await withTimeout(_generateOnce(prompt), ms, 'Pollinations image generation');
    } catch (err) {
      lastErr = err;
      const backoff = Math.pow(2, attempt) * 1000;
      console.warn(`[pollinations.image] attempt ${attempt + 1} failed:`, err.message);
      if (attempt < retries - 1) await new Promise((r) => setTimeout(r, backoff));
    }
  }
  throw lastErr || new Error('image generation failed');
}

module.exports = { generateImage };
