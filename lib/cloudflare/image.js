// Cloudflare Workers AI görsel üretimi — ücretsiz tier (~100k istek/gün), kredi kartı gerekmez.
// Model: CLOUDFLARE_IMAGE_MODEL (default @cf/black-forest-labs/flux-1-schnell)
// Auth: CLOUDFLARE_ACCOUNT_ID + CLOUDFLARE_API_TOKEN

const { timeoutMs, withTimeout } = require('../async.js');

const MODEL = process.env.CLOUDFLARE_IMAGE_MODEL || '@cf/black-forest-labs/flux-1-schnell';
const STEPS = Number(process.env.CLOUDFLARE_IMAGE_STEPS) || 4;

async function _generateOnce(prompt) {
  const acct = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!acct || !token) throw new Error('CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_API_TOKEN is not set');

  const url = `https://api.cloudflare.com/client/v4/accounts/${acct}/ai/run/${MODEL}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, steps: STEPS }),
  });

  const ctype = res.headers.get('content-type') || '';
  if (!res.ok) {
    let detail = '';
    try { detail = (await res.text()).slice(0, 200); } catch {}
    throw new Error(`Cloudflare HTTP ${res.status} ${detail}`);
  }

  // flux-1-schnell: JSON { result: { image: "<base64>" }, success: true }
  if (ctype.includes('application/json')) {
    const json = await res.json();
    const b64 = json?.result?.image;
    if (!b64) throw new Error('Cloudflare response had no image');
    return { buffer: Buffer.from(b64, 'base64'), mimeType: 'image/jpeg' };
  }
  // Bazı modeller ham binary png döner
  const buffer = Buffer.from(await res.arrayBuffer());
  if (!buffer.length) throw new Error('Cloudflare response was empty');
  return { buffer, mimeType: ctype || 'image/png' };
}

async function generateImage(prompt, { retries = 3 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const ms = timeoutMs('CLOUDFLARE_IMAGE', 45000);
      return await withTimeout(_generateOnce(prompt), ms, 'Cloudflare image generation');
    } catch (err) {
      lastErr = err;
      const backoff = Math.pow(2, attempt) * 1000;
      console.warn(`[cloudflare.image] attempt ${attempt + 1} failed:`, err.message);
      if (attempt < retries - 1) await new Promise((r) => setTimeout(r, backoff));
    }
  }
  throw lastErr || new Error('image generation failed');
}

module.exports = { generateImage };
