// Target prompt expansion disk cache.
// Key: `${category}:${difficulty}:${seed}` → { promptEn, promptTr }.
// pickRound() deterministik (sabit havuz × 4 zorluk = ~80 kombinasyon), aynı
// input tekrar geldiğinde Gemini'ye sormaya gerek yok. Sıcak cache'te tur başı
// 2 expansion çağrısı sıfıra düşer.

const fs = require('fs');
const path = require('path');

const CACHE_DIR = path.join(process.cwd(), 'cache');
const CACHE_FILE = path.join(CACHE_DIR, 'target-expansions.json');

let _cache = null;
let _writeTimer = null;

function _ensureLoaded() {
  if (_cache) return _cache;
  try {
    if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
    if (fs.existsSync(CACHE_FILE)) {
      _cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
      const n = Object.keys(_cache).length;
      console.log(`[expansionCache] loaded ${n} entries`);
    } else {
      _cache = {};
    }
  } catch (err) {
    console.warn('[expansionCache] load failed, starting empty:', err.message);
    _cache = {};
  }
  return _cache;
}

function _scheduleSave() {
  if (_writeTimer) return;
  _writeTimer = setTimeout(() => {
    _writeTimer = null;
    try {
      fs.writeFileSync(CACHE_FILE, JSON.stringify(_cache, null, 2));
    } catch (err) {
      console.warn('[expansionCache] save failed:', err.message);
    }
  }, 500);
}

function makeKey({ category, difficulty, seed }) {
  return `${category}:${difficulty}:${seed}`;
}

function get(input) {
  const cache = _ensureLoaded();
  return cache[makeKey(input)] || null;
}

function set(input, value) {
  const cache = _ensureLoaded();
  cache[makeKey(input)] = value;
  _scheduleSave();
}

function size() {
  return Object.keys(_ensureLoaded()).length;
}

module.exports = { get, set, size };
