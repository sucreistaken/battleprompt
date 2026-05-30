// Gemini API key rotator + failover.
// GEMINI_API_KEY, GEMINI_API_KEY_2, GEMINI_API_KEY_3, ... env değişkenleri taranır.
// Round-robin sırayla seçer; bir key 429/quota verirse otomatik sıradakine geçer
// (failover). Tüm key'ler tükenmiş ise son hatayı fırlatır.

const { GoogleGenerativeAI } = require('@google/generative-ai');

let _clients = null;
let _cursor = 0;

function _isQuotaError(err) {
  const msg = String(err?.message || err || '');
  return /\b429\b|quota|rate.?limit|exceeded/i.test(msg);
}

function _loadClients() {
  if (_clients) return _clients;
  const keys = [];
  if (process.env.GEMINI_API_KEY) keys.push(process.env.GEMINI_API_KEY);
  let i = 2;
  while (process.env[`GEMINI_API_KEY_${i}`]) {
    keys.push(process.env[`GEMINI_API_KEY_${i}`]);
    i++;
  }
  if (keys.length === 0) throw new Error('GEMINI_API_KEY is not set');
  _clients = keys.map((k) => new GoogleGenerativeAI(k));
  console.log(`[gemini.keyRotator] ${_clients.length} key loaded`);
  return _clients;
}

// Round-robin + quota failover. fn(client, index) → result.
// Bir key 429 verirse sıradakini dener. Hepsi tükenirse son hatayı fırlatır.
async function withKeyFailover(fn) {
  const arr = _loadClients();
  const start = _cursor % arr.length;
  let lastErr;
  for (let i = 0; i < arr.length; i++) {
    const idx = (start + i) % arr.length;
    // Bir sonraki çağrı için cursor'u ilerlet (round-robin).
    _cursor = (idx + 1) % arr.length;
    try {
      return await fn(arr[idx], idx);
    } catch (err) {
      lastErr = err;
      if (!_isQuotaError(err)) throw err;
      if (i < arr.length - 1) {
        console.warn(`[gemini.keyRotator] key #${idx + 1} quota hit, trying next`);
      }
    }
  }
  throw lastErr;
}

function keyCount() {
  return _loadClients().length;
}

module.exports = { withKeyFailover, keyCount };
