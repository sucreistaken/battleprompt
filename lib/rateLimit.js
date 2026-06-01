// In-memory rate limit buckets.
// Story 1.4 / D-11: extended with room-scoped key helpers. Existing global
// rateLimit(key, opts) signature preserved for back-compat; new
// checkLimit({ ip, deviceId, event, roomId?, limit, windowMs }) is the
// preferred API for new code.

const buckets = new Map();

function rateLimit(key, { limit, windowMs }) {
  const now = Date.now();
  const rec = buckets.get(key);
  if (!rec || rec.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  rec.count += 1;
  if (rec.count > limit) {
    return { ok: false, retryInMs: rec.resetAt - now };
  }
  return { ok: true };
}

// Story 1.4 / D-11: room-scoped helper. Checks both ip- and device-scoped
// limits; appends ':<roomId>' to the key when roomId is given so per-room
// limits don't bleed across rooms.
// Returns { ok: true } or { ok: false, code: 'rate_limited', retryAfterMs }.
/**
 * @param {{ ip?: string, deviceId?: string, event: string, roomId?: string, limit: number, windowMs: number }} args
 */
function checkLimit({ ip, deviceId, event, roomId, limit, windowMs }) {
  const suffix = roomId ? ':' + roomId : '';
  const keys = [];
  if (ip) keys.push(`ip:${ip}:${event}${suffix}`);
  if (deviceId) keys.push(`device:${deviceId}:${event}${suffix}`);
  for (const key of keys) {
    const res = rateLimit(key, { limit, windowMs });
    if (!res.ok) {
      return { ok: false, code: 'rate_limited', retryAfterMs: res.retryInMs };
    }
  }
  return { ok: true };
}

function cleanupRateLimits() {
  const now = Date.now();
  for (const [key, rec] of buckets) {
    if (rec.resetAt <= now) buckets.delete(key);
  }
}

const _interval = setInterval(cleanupRateLimits, 60_000);
if (typeof _interval.unref === 'function') _interval.unref();

module.exports = { rateLimit, checkLimit };
