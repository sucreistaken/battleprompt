// Profanite filtresi: bad-words (EN) + minimal TR wordlist.
// Politika: nickname submit'te REDDEDİLİR; prompt'lar SAHNEDE MASKELENİR,
// orijinal hali Gemini'ye gider (Gemini'nin kendi safety katmanı var).

let Filter;
try {
  Filter = require('bad-words');
} catch {
  Filter = null;
}

const TR_BAD_WORDS = [
  // Etkinlik bağlamı için temel argo. Genişletilebilir.
  'amk', 'aq', 'sik', 'piç', 'oç', 'orospu', 'göt', 'siktir',
  'yarrak', 'taşşak', 'meme', 'mal', 'gerizekalı', 'ibne',
  'sürtük', 'kahpe', 'şerefsiz', 'pezevenk'
];

let filterInstance = null;
function getFilter() {
  if (filterInstance) return filterInstance;
  if (!Filter) return null;
  const f = new Filter();
  try {
    f.addWords(...TR_BAD_WORDS);
  } catch {}
  filterInstance = f;
  return f;
}

function isClean(text) {
  if (!text) return true;
  const f = getFilter();
  if (!f) return true;
  try {
    return !f.isProfane(String(text));
  } catch {
    return true;
  }
}

function mask(text) {
  if (!text) return '';
  const f = getFilter();
  if (!f) return text;
  try {
    return f.clean(String(text));
  } catch {
    return text;
  }
}

function validateNickname(text) {
  const trimmed = String(text || '').trim();
  if (trimmed.length < 2) return { ok: false, reason: 'too_short' };
  if (trimmed.length > 20) return { ok: false, reason: 'too_long' };
  if (!/^[\p{L}\p{N}_\- ]+$/u.test(trimmed)) return { ok: false, reason: 'invalid_chars' };
  if (!isClean(trimmed)) return { ok: false, reason: 'profane' };
  return { ok: true, value: trimmed };
}

module.exports = { isClean, mask, validateNickname };
