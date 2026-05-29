// Google Cloud Storage wrapper.
// Auth: GOOGLE_APPLICATION_CREDENTIALS (file path) veya GCS_SA_KEY_JSON (inline JSON).
// Cloud Run'da default ADC de kullanılabilir.

const { Storage } = require('@google-cloud/storage');
const { timeoutMs, withTimeout } = require('./async.js');

let storage = null;
let bucket = null;

function getBucket() {
  if (bucket) return bucket;
  const bucketName = process.env.GCS_BUCKET;
  if (!bucketName) throw new Error('GCS_BUCKET is not set');

  const opts = {};
  if (process.env.GCS_SA_KEY_JSON) {
    try {
      opts.credentials = JSON.parse(process.env.GCS_SA_KEY_JSON);
    } catch (err) {
      console.warn('[gcs] GCS_SA_KEY_JSON parse failed:', err.message);
    }
  }
  storage = new Storage(opts);
  bucket = storage.bucket(bucketName);
  return bucket;
}

async function uploadBuffer(objectPath, buffer, contentType = 'image/png') {
  const b = getBucket();
  const file = b.file(objectPath);
  await withTimeout(file.save(buffer, {
    contentType,
    resumable: false,
    metadata: { cacheControl: 'public, max-age=31536000, immutable' }
  }), timeoutMs('GCS_UPLOAD', 20000), 'GCS upload');
  return `https://storage.googleapis.com/${b.name}/${objectPath}`;
}

module.exports = { uploadBuffer, getBucket };
