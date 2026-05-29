function required(name, errors) {
  if (!process.env[name]) errors.push(`${name} is not set`);
}

function validateEnv({ strict = process.env.NODE_ENV === 'production' } = {}) {
  const errors = [];
  required('ADMIN_PASSWORD', errors);
  required('ADMIN_COOKIE_SECRET', errors);
  required('MONGODB_URI', errors);

  if (process.env.DEMO_MODE !== '1') {
    const imageProvider = (process.env.IMAGE_PROVIDER || 'pollinations').toLowerCase();
    const storageProvider = (process.env.STORAGE_PROVIDER || 'local').toLowerCase();
    if (imageProvider === 'gemini') required('GEMINI_API_KEY', errors);
    if (storageProvider === 'gcs') required('GCS_BUCKET', errors);
  }

  const secret = process.env.ADMIN_COOKIE_SECRET || '';
  if (secret && secret.length < 16) errors.push('ADMIN_COOKIE_SECRET must be >=16 chars');

  if (errors.length && strict) {
    throw new Error(`Invalid environment: ${errors.join('; ')}`);
  }
  if (errors.length) {
    console.warn(`[env] ${errors.join('; ')}`);
  }
  return { ok: errors.length === 0, errors };
}

function publicConfig() {
  return {
    demoMode: process.env.DEMO_MODE === '1',
    imageModel: process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image',
    textModel: process.env.GEMINI_TEXT_MODEL || 'gemini-2.5-flash-lite',
    hasMongo: !!process.env.MONGODB_URI,
    hasGemini: !!process.env.GEMINI_API_KEY,
    hasGcs: !!process.env.GCS_BUCKET
  };
}

module.exports = { validateEnv, publicConfig };
