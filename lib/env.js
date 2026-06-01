// Env validation + public config readout.
// Story 1.2: COOKIE_SECRET required in prod; Phase-1 multi-room defaults
// surfaced as validated env vars with safe fallbacks. Secrets never appear
// in error messages (NFR-3.8).

function required(name, errors) {
  if (!process.env[name]) errors.push(`${name} is not set`);
}

// Phase-1 defaults (Story 1.2 / D-16).
const DEFAULTS = Object.freeze({
  HOST_COOKIE_TTL_HOURS: 24,
  ROOM_IDLE_TTL_HOURS: 4,
  MAX_AUDIENCE_PER_ROOM: 200,
  MAX_CONCURRENT_ROOMS_PER_HOST: 5,
  AUDIT_LOG_RETENTION_DAYS: 30,
  GENERATION_MAX_CONCURRENT: 2,
  GENERATION_MAX_RETRIES: 2
});

function _readNumber(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return n;
}

function readPhase1Limits() {
  return {
    hostCookieTtlHours: _readNumber('HOST_COOKIE_TTL_HOURS', DEFAULTS.HOST_COOKIE_TTL_HOURS),
    roomIdleTtlHours: _readNumber('ROOM_IDLE_TTL_HOURS', DEFAULTS.ROOM_IDLE_TTL_HOURS),
    maxAudiencePerRoom: _readNumber('MAX_AUDIENCE_PER_ROOM', DEFAULTS.MAX_AUDIENCE_PER_ROOM),
    maxConcurrentRoomsPerHost: _readNumber(
      'MAX_CONCURRENT_ROOMS_PER_HOST',
      DEFAULTS.MAX_CONCURRENT_ROOMS_PER_HOST
    ),
    auditLogRetentionDays: _readNumber(
      'AUDIT_LOG_RETENTION_DAYS',
      DEFAULTS.AUDIT_LOG_RETENTION_DAYS
    ),
    generationMaxConcurrent: _readNumber(
      'GENERATION_MAX_CONCURRENT',
      DEFAULTS.GENERATION_MAX_CONCURRENT
    ),
    generationMaxRetries: _readNumber(
      'GENERATION_MAX_RETRIES',
      DEFAULTS.GENERATION_MAX_RETRIES
    )
  };
}

function validateEnv({ strict = process.env.NODE_ENV === 'production' } = {}) {
  const errors = [];
  required('ADMIN_PASSWORD', errors);
  required('ADMIN_COOKIE_SECRET', errors);
  required('MONGODB_URI', errors);
  required('COOKIE_SECRET', errors);

  if (process.env.DEMO_MODE !== '1') {
    const imageProvider = (process.env.IMAGE_PROVIDER || 'pollinations').toLowerCase();
    const storageProvider = (process.env.STORAGE_PROVIDER || 'local').toLowerCase();
    if (imageProvider === 'gemini') required('GEMINI_API_KEY', errors);
    if (storageProvider === 'gcs') required('GCS_BUCKET', errors);
  }

  // Admin cookie secret (existing) — preserved unchanged.
  const adminSecret = process.env.ADMIN_COOKIE_SECRET || '';
  if (adminSecret && adminSecret.length < 16) {
    errors.push('ADMIN_COOKIE_SECRET must be >=16 chars');
  }
  // Host cookie secret (Story 1.2 / 1.5) — separate from admin secret so the
  // admin cookie cannot be replayed as a host cookie. Stricter min length per
  // D-16 ("invalid COOKIE_SECRET (empty or < 32 chars) → boot fails in
  // production"). NEVER log the secret itself.
  const cookieSecret = process.env.COOKIE_SECRET || '';
  if (cookieSecret && cookieSecret.length < 32) {
    errors.push('COOKIE_SECRET must be >=32 chars');
  }

  if (errors.length && strict) {
    throw new Error(`Invalid environment: ${errors.join('; ')}`);
  }
  if (errors.length) {
    console.warn(`[env] ${errors.join('; ')}`);
  }
  return { ok: errors.length === 0, errors, limits: readPhase1Limits() };
}

function publicConfig() {
  return {
    demoMode: process.env.DEMO_MODE === '1',
    imageModel: process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image',
    textModel: process.env.GEMINI_TEXT_MODEL || 'gemini-2.5-flash-lite',
    hasMongo: !!process.env.MONGODB_URI,
    hasGemini: !!process.env.GEMINI_API_KEY,
    hasGcs: !!process.env.GCS_BUCKET,
    hasCookieSecret: !!process.env.COOKIE_SECRET, // boolean readout; never the value
    limits: readPhase1Limits()
  };
}

module.exports = { validateEnv, publicConfig, readPhase1Limits, DEFAULTS };
