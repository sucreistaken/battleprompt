function timeoutMs(name, fallback) {
  const key = `${name}_TIMEOUT_MS`;
  const n = Number(process.env[key]);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function withTimeout(promise, ms, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

async function retry(fn, { attempts = 3, baseDelayMs = 500, label = 'operation' } = {}) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn(i);
    } catch (err) {
      lastErr = err;
      if (i >= attempts - 1) break;
      await new Promise((r) => setTimeout(r, baseDelayMs * Math.pow(2, i)));
    }
  }
  throw lastErr || new Error(`${label} failed`);
}

module.exports = { timeoutMs, withTimeout, retry };
