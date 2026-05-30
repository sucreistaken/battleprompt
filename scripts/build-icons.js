/**
 * build-icons.js
 *
 * public/logo-mark.svg'den marka asset'lerini üretir:
 *   - public/favicon.ico (multi-size 16,32,48)
 *   - public/icon-192.png, icon-512.png
 *   - public/icon-maskable-512.png (safe area + bg)
 *   - public/apple-icon.png (180)
 *   - app/icon.png (Next.js metadata convention)
 *   - app/apple-icon.png
 *   - app/opengraph-image.png (1200x630, composed)
 *   - app/twitter-image.png (1200x600, composed)
 *   - app/opengraph-image.alt.txt
 *
 * Çalıştırma: node scripts/build-icons.js
 * Bağımlılıklar: sharp, png-to-ico (npm install)
 */

const fs = require('node:fs/promises');
const path = require('node:path');

let sharp;
let pngToIco;
try {
  sharp = require('sharp');
  const ico = require('png-to-ico');
  pngToIco = ico.default || ico;
} catch (err) {
  console.error('Gerekli paketler kurulu değil. Önce çalıştır:');
  console.error('  npm install --save-dev sharp png-to-ico');
  process.exit(1);
}

const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const APP_DIR = path.join(ROOT, 'app');
const MARK_SVG = path.join(PUBLIC_DIR, 'logo-mark.svg');

const INK = { r: 34, g: 32, b: 43, alpha: 1 }; // --pc-ink #22202b

async function renderSvgToPng(size, out, opts = {}) {
  const buf = await sharp(MARK_SVG)
    .resize(size, size, {
      fit: 'contain',
      background: opts.background ?? { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
  await fs.writeFile(out, buf);
  console.log('✓', path.relative(ROOT, out), `(${size}x${size})`);
}

async function renderMaskable(size, out) {
  // PWA maskable icon, ~70% safe area, dark surface bg
  const inner = Math.floor(size * 0.7);
  const offset = Math.floor((size - inner) / 2);
  const fg = await sharp(MARK_SVG)
    .resize(inner, inner, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  await sharp({
    create: { width: size, height: size, channels: 4, background: INK },
  })
    .composite([{ input: fg, top: offset, left: offset }])
    .png()
    .toFile(out);
  console.log('✓', path.relative(ROOT, out), `(${size}x${size}, maskable)`);
}

async function buildFavicon(out) {
  const sizes = [16, 32, 48];
  const buffers = await Promise.all(
    sizes.map((s) => sharp(MARK_SVG).resize(s, s).png().toBuffer())
  );
  const icoBuf = await pngToIco(buffers);
  await fs.writeFile(out, icoBuf);
  console.log('✓', path.relative(ROOT, out), '(multi-size ICO)');
}

async function buildSocialImage(width, height, out, opts = {}) {
  // OG/Twitter image composition.
  // Layout: dark surface bg + axolotl mark sol + wordmark sağ + tagline alt.
  const markSize = Math.floor(height * 0.62);
  const markLeft = Math.floor(width * 0.08);
  const markTop = Math.floor((height - markSize) / 2);

  const textLeft = markLeft + markSize + Math.floor(width * 0.05);
  const wordmarkSize = Math.floor(height * 0.18);
  const taglineSize = Math.floor(height * 0.045);

  // Background SVG with text overlay. Uses widely available Windows fonts as
  // fallback (Arial Black) since Silkscreen may not be installed system-wide.
  const overlaySvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <rect width="${width}" height="${height}" fill="#22202b"/>
  <text x="${textLeft}" y="${Math.floor(height * 0.42)}"
        font-family="'Arial Black', 'Impact', 'Helvetica Bold', sans-serif"
        font-size="${wordmarkSize}" font-weight="900" letter-spacing="4"
        fill="#ffffff">PROMPT</text>
  <text x="${textLeft}" y="${Math.floor(height * 0.62)}"
        font-family="'Arial Black', 'Impact', 'Helvetica Bold', sans-serif"
        font-size="${wordmarkSize}" font-weight="900" letter-spacing="4"
        fill="#7c4dff">CLASH</text>
  <text x="${textLeft}" y="${Math.floor(height * 0.78)}"
        font-family="ui-monospace, 'Consolas', monospace"
        font-size="${taglineSize}" letter-spacing="8"
        fill="#aed24a">${opts.tagline ?? '1V1 AI GORSEL KAPISMASI'}</text>
</svg>`;

  const bg = await sharp(Buffer.from(overlaySvg)).png().toBuffer();

  const markBuf = await sharp(MARK_SVG)
    .resize(markSize, markSize, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  await sharp(bg)
    .composite([{ input: markBuf, top: markTop, left: markLeft }])
    .png()
    .toFile(out);
  console.log('✓', path.relative(ROOT, out), `(${width}x${height})`);
}

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

async function main() {
  console.log('Prompt Clash icons build\n');
  console.log('Reading:', path.relative(ROOT, MARK_SVG));
  console.log();

  await ensureDir(PUBLIC_DIR);
  await ensureDir(APP_DIR);

  // PWA + general icons (public/)
  await renderSvgToPng(192, path.join(PUBLIC_DIR, 'icon-192.png'));
  await renderSvgToPng(512, path.join(PUBLIC_DIR, 'icon-512.png'));
  await renderMaskable(512, path.join(PUBLIC_DIR, 'icon-maskable-512.png'));
  await renderSvgToPng(180, path.join(PUBLIC_DIR, 'apple-icon.png'));

  // Favicon ICO (multi-size)
  await buildFavicon(path.join(PUBLIC_DIR, 'favicon.ico'));

  // Next.js app/ metadata file convention
  await renderSvgToPng(512, path.join(APP_DIR, 'icon.png'));
  await renderSvgToPng(180, path.join(APP_DIR, 'apple-icon.png'));

  // Social images, composed
  await buildSocialImage(1200, 630, path.join(APP_DIR, 'opengraph-image.png'));
  await buildSocialImage(1200, 600, path.join(APP_DIR, 'twitter-image.png'));

  // Alt text
  await fs.writeFile(
    path.join(APP_DIR, 'opengraph-image.alt.txt'),
    'Prompt Clash, axolotl maskotlu 1v1 AI gorsel kapismasi logosu'
  );
  console.log('✓', path.relative(ROOT, path.join(APP_DIR, 'opengraph-image.alt.txt')));

  console.log('\nDone.');
}

main().catch((err) => {
  console.error('\nBuild failed:', err.message);
  process.exit(1);
});
