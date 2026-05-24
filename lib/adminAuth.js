// Admin auth: tek şifre (env), HMAC-imzalı cookie.
// In-memory rate limit (IP başına 5 yanlış denemede 5 dk lockout).

const crypto = require('crypto');

const COOKIE_NAME = 'pc_admin';
const COOKIE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const _lockouts = new Map(); // ip -> { count, lockUntil }
const MAX_TRIES = 5;
const LOCK_MS = 5 * 60 * 1000;

function _secret() {
  const s = process.env.ADMIN_COOKIE_SECRET;
  if (!s || s.length < 16) {
    throw new Error('ADMIN_COOKIE_SECRET must be set (>=16 chars)');
  }
  return s;
}

function _sign(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const mac = crypto
    .createHmac('sha256', _secret())
    .update(body)
    .digest('base64url');
  return `${body}.${mac}`;
}

function _verify(token) {
  if (!token || typeof token !== 'string') return null;
  const [body, mac] = token.split('.');
  if (!body || !mac) return null;
  const expected = crypto
    .createHmac('sha256', _secret())
    .update(body)
    .digest('base64url');
  if (
    expected.length !== mac.length ||
    !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(mac))
  ) {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

function checkLockout(ip) {
  const rec = _lockouts.get(ip);
  if (!rec) return { locked: false };
  if (rec.lockUntil && rec.lockUntil > Date.now()) {
    return { locked: true, remainingMs: rec.lockUntil - Date.now() };
  }
  return { locked: false };
}

function recordFailure(ip) {
  const rec = _lockouts.get(ip) || { count: 0, lockUntil: 0 };
  rec.count += 1;
  if (rec.count >= MAX_TRIES) {
    rec.lockUntil = Date.now() + LOCK_MS;
    rec.count = 0;
  }
  _lockouts.set(ip, rec);
}

function clearFailures(ip) {
  _lockouts.delete(ip);
}

function attemptLogin(ip, password) {
  const lock = checkLockout(ip);
  if (lock.locked) {
    return { ok: false, reason: 'locked', retryInMs: lock.remainingMs };
  }
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return { ok: false, reason: 'not_configured' };
  if (
    Buffer.byteLength(password) !== Buffer.byteLength(expected) ||
    !crypto.timingSafeEqual(Buffer.from(password), Buffer.from(expected))
  ) {
    recordFailure(ip);
    return { ok: false, reason: 'bad_password' };
  }
  clearFailures(ip);
  const token = _sign({ role: 'admin', exp: Date.now() + COOKIE_TTL_MS });
  return { ok: true, token, maxAge: Math.floor(COOKIE_TTL_MS / 1000) };
}

function verifyToken(token) {
  return _verify(token);
}

module.exports = {
  COOKIE_NAME,
  COOKIE_TTL_MS,
  attemptLogin,
  verifyToken,
  checkLockout
};
