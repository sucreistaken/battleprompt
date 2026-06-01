// Phase-1 cookie auth (D-9 / Story 1.5).
// HMAC-SHA256 signed pc_host_session cookie + helpers for the unsigned
// pc_device_id and pc_audience_id cookie families. pc_admin (existing
// lib/adminAuth.js) is preserved unchanged.
//
// Phase-1 design intent: NO accounts, NO OAuth, NO password reset. Host
// privilege = signed cookie attached to a roomId. Phase 2 will revisit.

const crypto = require('crypto');
const { readPhase1Limits } = require('../env.js');

const HOST_COOKIE_NAME = 'pc_host_session';
const DEVICE_COOKIE_NAME = 'pc_device_id';
const AUDIENCE_COOKIE_NAME = 'pc_audience_id';

const DEVICE_COOKIE_TTL_DAYS = 365;
const AUDIENCE_COOKIE_TTL_DAYS = 30;

function _hostTtlMs() {
  const hours = readPhase1Limits().hostCookieTtlHours;
  return hours * 3600 * 1000;
}

function _secret() {
  const s = process.env.COOKIE_SECRET;
  if (!s || s.length < 32) {
    // Lazy throw — module load must not crash even if env is unset in dev.
    // Production boot is hard-failed by validateEnv (Story 1.2).
    throw new Error('COOKIE_SECRET is not set or shorter than 32 chars');
  }
  return s;
}

// ---------------------------------------------------------------------------
// HMAC sign / verify for the host session
// ---------------------------------------------------------------------------

function sign(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const mac = crypto.createHmac('sha256', _secret()).update(body).digest('base64url');
  return `${body}.${mac}`;
}

function verify(token) {
  if (!token || typeof token !== 'string') return null;
  const [body, mac] = token.split('.');
  if (!body || !mac) return null;
  let expected;
  try {
    expected = crypto.createHmac('sha256', _secret()).update(body).digest('base64url');
  } catch {
    // Secret unset — treat as unauthenticated rather than crash.
    return null;
  }
  if (
    expected.length !== mac.length ||
    !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(mac))
  ) {
    return null;
  }
  let payload;
  try {
    payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
  if (!payload || typeof payload !== 'object') return null;
  if (!payload.exp || payload.exp < Date.now()) return null;
  return payload;
}

// ---------------------------------------------------------------------------
// Host session helpers
// ---------------------------------------------------------------------------

// Build a fresh host token. payload = { hostId } at minimum.
function newHostToken({ hostId }) {
  return sign({
    role: 'host',
    hostId,
    iat: Date.now(),
    exp: Date.now() + _hostTtlMs()
  });
}

// Returns the verified host payload from a raw Cookie: header string, or null.
function hostPayloadFromCookieHeader(rawCookieHeader) {
  if (!rawCookieHeader) return null;
  const parsed = _parseCookieHeader(rawCookieHeader);
  const token = parsed[HOST_COOKIE_NAME];
  if (!token) return null;
  return verify(token);
}

function _parseCookieHeader(raw) {
  // Lightweight parser — avoids pulling the `cookie` dep transitively from
  // every consumer. cookie format: name=value; name2=value2; ...
  const out = {};
  if (typeof raw !== 'string' || !raw) return out;
  const parts = raw.split(';');
  for (const part of parts) {
    const eq = part.indexOf('=');
    if (eq < 0) continue;
    const k = part.slice(0, eq).trim();
    const v = part.slice(eq + 1).trim();
    if (!k) continue;
    out[k] = decodeURIComponent(v);
  }
  return out;
}

// Build a Set-Cookie attribute string for the host session cookie.
// Use with `cookies().set({ name: HOST_COOKIE_NAME, value, ...attrs })` in
// Next.js route handlers or with res.setHeader('Set-Cookie', ...) elsewhere.
/**
 * @returns {{ httpOnly: true, secure: boolean, sameSite: 'lax', path: '/', maxAge: number }}
 */
function hostCookieAttrs() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: /** @type {'lax'} */ ('lax'),
    path: '/',
    maxAge: Math.floor(_hostTtlMs() / 1000)
  };
}

// Revocation: max-age=0 wipes the cookie. Audit-log writing is the caller's
// responsibility (typically a /api/rooms/:id/close handler).
/**
 * @returns {{ httpOnly: true, secure: boolean, sameSite: 'lax', path: '/', maxAge: 0 }}
 */
function clearHostCookieAttrs() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: /** @type {'lax'} */ ('lax'),
    path: '/',
    maxAge: 0
  };
}

// ---------------------------------------------------------------------------
// Unsigned cookie families
// ---------------------------------------------------------------------------

function _uuid() {
  // Node 14.17+. Falls back to a base32 random if unavailable.
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return crypto.randomBytes(16).toString('hex');
}

function newDeviceId() {
  return _uuid();
}

function newAudienceId() {
  return _uuid();
}

/**
 * @returns {{ httpOnly: false, secure: boolean, sameSite: 'lax', path: '/', maxAge: number }}
 */
function deviceCookieAttrs() {
  return {
    httpOnly: false, // client-readable so reconnect logic can attach it
    secure: process.env.NODE_ENV === 'production',
    sameSite: /** @type {'lax'} */ ('lax'),
    path: '/',
    maxAge: DEVICE_COOKIE_TTL_DAYS * 24 * 3600
  };
}

/**
 * @returns {{ httpOnly: true, secure: boolean, sameSite: 'lax', path: '/', maxAge: number }}
 */
function audienceCookieAttrs() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: /** @type {'lax'} */ ('lax'),
    path: '/',
    maxAge: AUDIENCE_COOKIE_TTL_DAYS * 24 * 3600
  };
}

// Convenience: read all the cookie families a handler might need from a
// raw Cookie header string (used by socket handshake + REST middleware).
function readAllCookies(rawCookieHeader) {
  const parsed = _parseCookieHeader(rawCookieHeader);
  return {
    hostToken: parsed[HOST_COOKIE_NAME] || null,
    deviceId: parsed[DEVICE_COOKIE_NAME] || null,
    audienceId: parsed[AUDIENCE_COOKIE_NAME] || null,
    adminToken: parsed.pc_admin || null,
    hostPayload: parsed[HOST_COOKIE_NAME] ? verify(parsed[HOST_COOKIE_NAME]) : null
  };
}

module.exports = {
  // names
  HOST_COOKIE_NAME,
  DEVICE_COOKIE_NAME,
  AUDIENCE_COOKIE_NAME,
  // low-level
  sign,
  verify,
  // host session
  newHostToken,
  hostPayloadFromCookieHeader,
  hostCookieAttrs,
  clearHostCookieAttrs,
  // device + audience
  newDeviceId,
  newAudienceId,
  deviceCookieAttrs,
  audienceCookieAttrs,
  // bulk reader
  readAllCookies
};
