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

function cleanupRateLimits() {
  const now = Date.now();
  for (const [key, rec] of buckets) {
    if (rec.resetAt <= now) buckets.delete(key);
  }
}

setInterval(cleanupRateLimits, 60_000).unref?.();

module.exports = { rateLimit };
