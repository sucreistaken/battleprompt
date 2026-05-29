// Local disk storage — GCS olmadan çalışır (şimdilik / dev için).
// Dosyalar public/uploads altına yazılır, Next.js bunları kök yoldan servis eder.

const fs = require('fs/promises');
const path = require('path');

const ROOT = path.join(process.cwd(), 'public', 'uploads');

async function uploadBuffer(objectPath, buffer, contentType = 'image/png') {
  const safe = objectPath.replace(/\.\.+/g, '').replace(/^\/+/, '');
  const dest = path.join(ROOT, safe);
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.writeFile(dest, buffer);
  const base = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/+$/, '');
  return `${base}/uploads/${safe}`;
}

module.exports = { uploadBuffer };
