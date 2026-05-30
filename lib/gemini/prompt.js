// Gemini metin: bir tohum konsepti + kategori + zorluk alıp,
// görsel üretimine uygun canlı/somut tek sahnelik bir prompt yazar.
// Strict JSON döndürür: {"prompt": "..."}.

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { timeoutMs, withTimeout } = require('../async.js');

let client = null;
function getClient() {
  if (client) return client;
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY is not set');
  client = new GoogleGenerativeAI(key);
  return client;
}

const TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || 'gemini-2.5-flash-lite';

const DIFFICULTY_GUIDE = {
  easy: 'Easy: one iconic subject, simple clean composition, easy to guess in a few words.',
  medium: 'Medium: a subject plus a setting and a clear visual style.',
  hard: 'Hard: a compound concept combining multiple specific elements and a distinctive style.',
  legendary: 'Legendary: a rare, surprising, meme-worthy mashup that is hard to guess yet coherent.'
};

const SYSTEM_PROMPT = `You invent target images for a "guess the prompt" party game.
Given a CATEGORY, a DIFFICULTY and a short SEED concept, write ONE vivid, concrete
single-scene description in TWO languages: English (for the image generator) and
Turkish (for Turkish-speaking players who will read it on the result screen).
Rules:
- Each language: one or two sentences, concrete and visual (subject, setting, lighting, style).
- The Turkish version must describe the SAME scene as the English one — natural Turkish,
  not a literal word-for-word translation. Read like a human-written description.
- Match the requested difficulty complexity.
- Be fun and surprising but coherent; safe for work; no real public figures.
- Do NOT include any text, words, captions or watermarks in the described image.
Return STRICT JSON only, no prose: {"promptEn": "<english prompt>", "promptTr": "<turkish prompt>"}`;

function _parseJson(text) {
  const cleaned = String(text || '').replace(/```json|```/g, '').trim();
  const start = cleaned.indexOf('{');
  if (start === -1) throw new Error('no JSON in response');
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < cleaned.length; i++) {
    const c = cleaned[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) return JSON.parse(cleaned.slice(start, i + 1));
    }
  }
  throw new Error('no complete JSON object in response');
}

// Tohumu canlı bir görsel prompt'a açar. Başarısızlıkta üst katman fallback yapar.
async function expandSeedToPrompt({ category, difficulty, seed }) {
  const gen = getClient().getGenerativeModel({
    model: TEXT_MODEL,
    generationConfig: { responseMimeType: 'application/json', temperature: 1.0 }
  });

  const diffGuide = DIFFICULTY_GUIDE[difficulty] || DIFFICULTY_GUIDE.medium;
  const userText = `CATEGORY: ${category}\nDIFFICULTY: ${difficulty}\n${diffGuide}\nSEED: ${seed}`;

  const result = await withTimeout(
    gen.generateContent({
      contents: [{ role: 'user', parts: [{ text: SYSTEM_PROMPT }, { text: userText }] }]
    }),
    timeoutMs('GEMINI_PROMPT', 20000),
    'Gemini prompt expansion'
  );

  const text = result?.response?.text?.() || '';
  const parsed = _parseJson(text);
  const promptEn = String(parsed.promptEn || parsed.prompt || '').trim();
  const promptTr = String(parsed.promptTr || '').trim();
  if (!promptEn) throw new Error('empty promptEn in response');
  if (!promptTr) throw new Error('empty promptTr in response');
  return { promptEn, promptTr };
}

// Oyuncu prompt'unu görsel üretimi için İngilizce'ye çevirir. Görsel modelleri
// (flux vb.) İngilizce'de çok daha iyi sonuç verir. Başarısızlıkta orijinal döner.
async function translateToEnglish(text) {
  const t = String(text || '').trim();
  if (!t) return t;
  const gen = getClient().getGenerativeModel({
    model: TEXT_MODEL,
    generationConfig: { temperature: 0 }
  });
  const result = await withTimeout(
    gen.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Translate this image description to English for an image generator. Output ONLY the translation, no quotes or notes. If it is already English, return it unchanged.\n\n${t}`
            }
          ]
        }
      ]
    }),
    timeoutMs('GEMINI_TRANSLATE', 12000),
    'Gemini translate'
  );
  const out = String(result?.response?.text?.() || '').trim();
  return out || t;
}

module.exports = { expandSeedToPrompt, translateToEnglish };
