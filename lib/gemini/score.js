// Gemini Vision skorlama: referans görseli + A + B görselleri verilir,
// strict JSON döndürür: {"a": 0-100, "b": 0-100, "reasoning": "..."}.

const { GoogleGenerativeAI } = require('@google/generative-ai');

let client = null;
function getClient() {
  if (client) return client;
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY is not set');
  client = new GoogleGenerativeAI(key);
  return client;
}

const TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || 'gemini-2.5-flash';

async function _fetchAsInline(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch ${url} -> ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const mimeType = res.headers.get('content-type') || 'image/png';
  return { inlineData: { data: buf.toString('base64'), mimeType } };
}

const SYSTEM_PROMPT = `You are an impartial judge for an AI image-generation duel.
You receive three images in order: REFERENCE, IMAGE_A, IMAGE_B.
For each of A and B, score how closely it resembles REFERENCE on a 0-100 scale.
Consider composition, subject, colors, mood, and overall similarity.
Return STRICT JSON only, no prose:
{"a": <0-100 integer>, "b": <0-100 integer>, "reasoning": "<one short sentence>"}`;

function _parseJson(text) {
  const cleaned = text.replace(/```json|```/g, '').trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('no JSON in response');
  return JSON.parse(match[0]);
}

async function scoreVsReference(refUrl, aUrl, bUrl) {
  const gen = getClient().getGenerativeModel({
    model: TEXT_MODEL,
    generationConfig: { responseMimeType: 'application/json', temperature: 0.2 }
  });

  const [ref, a, b] = await Promise.all([
    _fetchAsInline(refUrl),
    _fetchAsInline(aUrl),
    _fetchAsInline(bUrl)
  ]);

  const result = await gen.generateContent({
    contents: [
      {
        role: 'user',
        parts: [
          { text: SYSTEM_PROMPT },
          { text: 'REFERENCE:' },
          ref,
          { text: 'IMAGE_A:' },
          a,
          { text: 'IMAGE_B:' },
          b
        ]
      }
    ]
  });

  const text = result?.response?.text?.() || '';
  let parsed;
  try {
    parsed = _parseJson(text);
  } catch (err) {
    throw new Error(`score parse failed: ${err.message}; raw=${text.slice(0, 200)}`);
  }

  const a0 = clamp(parsed.a, 0, 100);
  const b0 = clamp(parsed.b, 0, 100);
  return { a: a0, b: b0, reasoning: String(parsed.reasoning || '') };
}

function clamp(n, lo, hi) {
  n = Number(n);
  if (!Number.isFinite(n)) return lo;
  return Math.max(lo, Math.min(hi, Math.round(n)));
}

module.exports = { scoreVsReference };
