// Görsel üretim provider seçici.
// IMAGE_PROVIDER=cloudflare (ücretsiz ~100k/gün) | pollinations | gemini

const PROVIDER = (process.env.IMAGE_PROVIDER || 'pollinations').toLowerCase();

let impl;
if (PROVIDER === 'gemini') {
  impl = require('./gemini/image.js');
} else if (PROVIDER === 'cloudflare') {
  impl = require('./cloudflare/image.js');
} else {
  impl = require('./pollinations/image.js');
}

module.exports = { generateImage: impl.generateImage, provider: PROVIDER };
