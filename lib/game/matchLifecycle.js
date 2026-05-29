// Maç yaşam döngüsü orkestrasyonu.
// Tüm faz geçişleri buradan yapılır; her geçiş sonunda broadcastState çağrılır.

const {
  state,
  PHASES,
  setPhase,
  resetMatch,
  makePlayer,
  newMatchId,
  bumpOperationEpoch,
  getOperationEpoch,
  isCurrentEpoch
} = require('./state.js');
const {
  setPhaseTimer,
  clearPhaseTimer,
  setDisconnectTimer,
  clearDisconnectTimer,
  clearAllDisconnectTimers
} = require('./timers.js');
const { broadcastState, broadcastPromptUpdate } = require('../socket/broadcasts.js');
const { generateImage } = require('../image.js');
const { scoreVsReference } = require('../gemini/score.js');
const { pickRound, generateTargetPrompt } = require('./targetPrompt.js');
const { translateToEnglish } = require('../gemini/prompt.js');
const { uploadBuffer } = require('../storage.js');
const { saveMatch } = require('../../models/Match.js');
const { recordVote } = require('../../models/Vote.js');
const { validateNickname, mask } = require('../profanity.js');

const DISCONNECT_GRACE_MS = 10_000;
// Hafif kısıt: yazı/filigran yok + etkinlik için SFW. Tema DAYATMAZ —
// oyuncunun girdisi aynen kullanılır ("a woman" → woman). Tema dışı kalan,
// referansa benzemediği için AI puanlamasında düşük alır (oyun böyle adil).
const SAFETY_SUFFIX = '. No text or watermark, safe for work.';

function buildGuardedPrompt(userText) {
  const desc = (userText && userText.trim()) || 'abstract art';
  return `${desc}${SAFETY_SUFFIX}`;
}

let _io = null;
function setIo(io) {
  _io = io;
}

// ---------------------------------------------------------------------------
// Target image (her tur dinamik üretilir; pre-cache + on-demand)
// ---------------------------------------------------------------------------

// Bir sonraki turun hedefini (gerçek prompt + görsel + kategori/zorluk) üretip
// next* alanlarına yazar. startMatch bunu aktif tura promote eder.
async function ensureTargetImage() {
  if (state.referencePending) return;
  if (state.nextReferenceImageUrl && state.nextTargetPrompt) return;
  state.referencePending = true;
  try {
    const round = pickRound({
      category: state.lockedCategory || undefined,
      difficulty: state.lockedDifficulty || undefined
    });
    const { prompt, category, difficulty } = await generateTargetPrompt(round);

    if (process.env.DEMO_MODE === '1') {
      // Placeholder reference for screenshot demos without Gemini/GCS
      state.nextReferenceImageUrl =
        'https://picsum.photos/seed/promptclash-ref-' + Date.now() + '/640';
      state.nextTargetPrompt = prompt;
      state.nextRoundCategory = category;
      state.nextRoundDifficulty = difficulty;
      console.log('[target] demo placeholder set:', category, difficulty);
      return;
    }

    const { buffer, mimeType } = await generateImage(prompt + SAFETY_SUFFIX);
    const path = `references/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${mimeType.includes('jpeg') ? 'jpg' : 'png'}`;
    const url = await uploadBuffer(path, buffer, mimeType);
    state.nextReferenceImageUrl = url;
    state.nextTargetPrompt = prompt;
    state.nextRoundCategory = category;
    state.nextRoundDifficulty = difficulty;
    console.log('[target] pre-cached:', category, difficulty, url);
  } catch (err) {
    console.warn('[target] generation failed:', err.message);
    // Fallback: keep null; UI will show generic placeholder.
    invalidateReferenceCache();
  } finally {
    state.referencePending = false;
  }
}

function invalidateReferenceCache() {
  state.nextReferenceImageUrl = null;
  state.nextTargetPrompt = null;
  state.nextRoundCategory = null;
  state.nextRoundDifficulty = null;
}

// ---------------------------------------------------------------------------
// Join flow
// ---------------------------------------------------------------------------

function tryJoinAsPlayer({ socketId, deviceId, nickname }) {
  const v = validateNickname(nickname);
  if (!v.ok) return { ok: false, reason: v.reason };

  if (state.phase === PHASES.IDLE) {
    state.players.A = makePlayer({ socketId, deviceId, nickname: v.value });
    setPhase(PHASES.PLAYER_1_JOINED);
    broadcastState(_io);
    return { ok: true, slot: 'A' };
  }
  if (state.phase === PHASES.PLAYER_1_JOINED) {
    if (state.players.A?.deviceId === deviceId) {
      return { ok: false, reason: 'already_player_a' };
    }
    state.players.B = makePlayer({ socketId, deviceId, nickname: v.value });
    startMatch();
    return { ok: true, slot: 'B' };
  }
  return { ok: false, reason: 'match_in_progress' };
}

function startMatch() {
  const epoch = bumpOperationEpoch();
  state.matchId = newMatchId();
  state.matchStartedAt = new Date();
  // Promote pre-cached next target into current (görsel + gerçek prompt + kategori/zorluk).
  if (state.nextReferenceImageUrl && state.nextTargetPrompt) {
    state.referenceImageUrl = state.nextReferenceImageUrl;
    state.targetPrompt = state.nextTargetPrompt;
    state.roundCategory = state.nextRoundCategory;
    state.roundDifficulty = state.nextRoundDifficulty;
    invalidateReferenceCache();
  } else {
    state.referenceImageUrl = null;
    state.targetPrompt = null;
    state.roundCategory = null;
    state.roundDifficulty = null;
    invalidateReferenceCache();
  }

  setPhase(PHASES.VS_INTRO, state.vsIntroDurationSec * 1000);
  broadcastState(_io);
  setPhaseTimer(state.vsIntroDurationSec * 1000, () => {
    if (isCurrentEpoch(epoch)) beginPrompting(epoch);
  });

  // If we didn't have a pre-cached target, generate now in the background.
  // (Players will see a placeholder briefly; usually pre-cache is ready.)
  if (!state.referenceImageUrl) {
    state.referencePending = false;
    ensureTargetImage().then(() => {
      if (!isCurrentEpoch(epoch)) return;
      if (state.nextReferenceImageUrl && !state.referenceImageUrl) {
        state.referenceImageUrl = state.nextReferenceImageUrl;
        state.targetPrompt = state.nextTargetPrompt;
        state.roundCategory = state.nextRoundCategory;
        state.roundDifficulty = state.nextRoundDifficulty;
        invalidateReferenceCache();
        broadcastState(_io);
      }
    });
  }
}

function beginPrompting(epoch = getOperationEpoch()) {
  if (!isCurrentEpoch(epoch)) return;
  setPhase(PHASES.PROMPTING, state.promptDurationSec * 1000);
  broadcastState(_io);
  setPhaseTimer(state.promptDurationSec * 1000, () => beginGenerating('timer', epoch));
}

// ---------------------------------------------------------------------------
// Prompt updates / submission
// ---------------------------------------------------------------------------

function handlePromptTyping({ slot, text }) {
  if (state.phase !== PHASES.PROMPTING) return;
  const p = state.players[slot];
  if (!p || p.submitted) return;
  p.prompt = normalizePrompt(text);
  if (state.showLivePrompts) {
    broadcastPromptUpdate(_io, slot, mask(p.prompt));
  }
}

function handlePromptSubmit({ slot, text }) {
  if (state.phase !== PHASES.PROMPTING) return;
  const p = state.players[slot];
  if (!p || p.submitted) return;
  p.prompt = normalizePrompt(text);
  p.submitted = true;
  broadcastState(_io);

  if (state.players.A?.submitted && state.players.B?.submitted) {
    beginGenerating('both_submitted', getOperationEpoch());
  }
}

function normalizePrompt(text) {
  return String(text || '').trim().slice(0, 500);
}

// ---------------------------------------------------------------------------
// Generation
// ---------------------------------------------------------------------------

async function _generateForSlot(slot, epoch) {
  const p = state.players[slot];
  if (!p) return;

  if (process.env.DEMO_MODE === '1') {
    // Stagger so the two "renderings" arrive at slightly different times
    await new Promise((r) => setTimeout(r, 1500 + Math.random() * 2500));
    if (!isCurrentEpoch(epoch)) return;
    const seed = `${state.matchId}-${slot}-${p.prompt.slice(0, 20)}`.replace(/\s+/g, '-');
    p.imageUrl = `https://picsum.photos/seed/${encodeURIComponent(seed)}/640`;
    state.genErrors[slot] = false;
    broadcastState(_io);
    return;
  }

  // Görsel modelleri İngilizce'de daha iyi: oyuncu metnini çevir (fallback orijinal).
  // Ekranda gösterilen p.prompt Türkçe kalır; sadece üretime giden metin çevrilir.
  let promptText = p.prompt;
  try {
    promptText = await translateToEnglish(p.prompt);
  } catch (err) {
    console.warn(`[gen] slot ${slot} translate failed, using original:`, err.message);
  }
  if (!isCurrentEpoch(epoch)) return;
  const prompt = buildGuardedPrompt(promptText);

  try {
    const { buffer, mimeType } = await generateImage(prompt);
    if (!isCurrentEpoch(epoch)) return;
    const objPath = `matches/${state.matchId}/${slot}.png`;
    const url = await uploadBuffer(objPath, buffer, mimeType);
    if (!isCurrentEpoch(epoch)) return;
    p.imageUrl = url;
    state.genErrors[slot] = false;
  } catch (err) {
    if (!isCurrentEpoch(epoch)) return;
    console.warn(`[gen] slot ${slot} failed:`, err.message);
    state.genErrors[slot] = true;
    p.forfeit = true;
  }
  if (isCurrentEpoch(epoch)) broadcastState(_io);
}

async function beginGenerating(reason, epoch = getOperationEpoch()) {
  if (!isCurrentEpoch(epoch)) return;
  clearPhaseTimer();
  // Lock any un-submitted prompts as final
  for (const slot of ['A', 'B']) {
    const p = state.players[slot];
    if (p && !p.submitted) p.submitted = true;
  }
  setPhase(PHASES.GENERATING);
  broadcastState(_io);
  console.log(`[lifecycle] GENERATING (${reason})`);

  // Sıralı üret: ücretsiz görsel sağlayıcılar eşzamanlı çift isteği throttle ediyor (402/429).
  await _generateForSlot('A', epoch);
  if (!isCurrentEpoch(epoch)) return;
  await _generateForSlot('B', epoch);
  if (!isCurrentEpoch(epoch)) return;
  await afterGenerating(epoch);
}

async function afterGenerating(epoch = getOperationEpoch()) {
  if (!isCurrentEpoch(epoch)) return;
  const failA = state.genErrors.A;
  const failB = state.genErrors.B;

  if (failA && failB) {
    // İki taraf da başarısız → berabere ilan et, hemen RESULT
    state.winner = 'TIE';
    finalizeMatch(epoch);
    return;
  }
  if (failA || failB) {
    // Tek taraf forfeit → diğeri kazandı
    state.winner = failA ? 'B' : 'A';
    finalizeMatch(epoch);
    return;
  }

  // Kazananı her zaman AI belirler (kullanıcı oylaması yok).
  await beginScoring(epoch);
}

// ---------------------------------------------------------------------------
// Scoring (AI mode)
// ---------------------------------------------------------------------------

async function beginScoring(epoch = getOperationEpoch()) {
  if (!isCurrentEpoch(epoch)) return;
  setPhase(PHASES.SCORING);
  broadcastState(_io);

  if (process.env.DEMO_MODE === '1') {
    // Stay on SCORING screen briefly, then commit fake scores
    await new Promise((r) => setTimeout(r, 3000));
    if (!isCurrentEpoch(epoch)) return;
    const a = 52 + Math.floor(Math.random() * 12);
    let b = 100 - a + Math.floor(Math.random() * 8) - 4;
    if (b === a) b = a - 1; // beraberlik yok
    state.players.A.aiScore = a;
    state.players.B.aiScore = b;
    state.aiReasoning =
      'Both entries captured the brief, but one held the mood and composition tighter.';
    state.winner = a > b ? 'A' : 'B';
    broadcastState(_io);
    finalizeMatch(epoch);
    return;
  }

  try {
    if (!state.referenceImageUrl || !state.players.A?.imageUrl || !state.players.B?.imageUrl) {
      throw new Error('missing images');
    }
    // AI puanlama 2 denemeli; başarısız olursa oylamaya DÜŞMEZ (kullanıcı oyu yok).
    let scored;
    let lastErr;
    for (let attempt = 0; attempt < 2 && !scored; attempt++) {
      try {
        scored = await scoreVsReference(
          state.referenceImageUrl,
          state.players.A.imageUrl,
          state.players.B.imageUrl
        );
      } catch (e) {
        lastErr = e;
        console.warn(`[scoring] attempt ${attempt + 1} failed:`, e.message);
      }
    }
    if (!isCurrentEpoch(epoch)) return;
    if (!scored) throw lastErr || new Error('scoring failed');

    const { a, b, winner, reasoning } = scored;
    state.players.A.aiScore = a;
    state.players.B.aiScore = b;
    state.aiReasoning = reasoning;
    state.winner = winner === 'b' ? 'B' : 'A';
    broadcastState(_io);
    finalizeMatch(epoch);
  } catch (err) {
    if (!isCurrentEpoch(epoch)) return;
    // AI hiç çalışmadıysa (nadir): skor yok → puana göre/ A varsayılan, oylama YOK.
    console.warn('[scoring] failed permanently, AI fallback winner:', err.message);
    const a = state.players.A?.aiScore ?? 0;
    const b = state.players.B?.aiScore ?? 0;
    state.winner = b > a ? 'B' : 'A';
    state.aiReasoning = null;
    broadcastState(_io);
    finalizeMatch(epoch);
  }
}

// ---------------------------------------------------------------------------
// Voting (audience + tiebreak)
// ---------------------------------------------------------------------------

function beginVoting(scoringPhase, epoch = getOperationEpoch()) {
  if (!isCurrentEpoch(epoch)) return;
  state.scoringPhase = scoringPhase;
  state.votes = { A: 0, B: 0 };
  state.voterIds = new Set();
  const phase = scoringPhase === 'TIEBREAK' ? PHASES.TIEBREAK_VOTE : PHASES.VOTING;
  const durationSec =
    scoringPhase === 'TIEBREAK' ? state.tiebreakDurationSec : state.votingDurationSec;
  setPhase(phase, durationSec * 1000);
  broadcastState(_io);
  setPhaseTimer(durationSec * 1000, () => finalizeVote(epoch));
}

function handleVote({ deviceId, votedFor }) {
  if (state.phase !== PHASES.VOTING && state.phase !== PHASES.TIEBREAK_VOTE) {
    return { ok: false, reason: 'not_voting' };
  }
  if (!['A', 'B'].includes(votedFor)) return { ok: false, reason: 'invalid' };
  if (state.voterIds.has(deviceId)) return { ok: false, reason: 'already_voted' };
  state.voterIds.add(deviceId);
  state.votes[votedFor] += 1;
  // Async, best-effort Mongo dedup record
  recordVote({
    matchId: state.matchId,
    deviceId,
    votedFor,
    phase: state.scoringPhase
  }).catch(() => {});
  broadcastState(_io);
  return { ok: true };
}

function finalizeVote(epoch = getOperationEpoch()) {
  if (!isCurrentEpoch(epoch)) return;
  const { A, B } = state.votes;
  if (state.players.A) state.players.A.voteCount = A;
  if (state.players.B) state.players.B.voteCount = B;

  if (A === B) {
    // Hâlâ berabere
    if (state.scoringPhase === 'MAIN') {
      // Sudden-death dene
      beginVoting('TIEBREAK', epoch);
      return;
    }
    state.winner = 'TIE';
  } else {
    state.winner = A > B ? 'A' : 'B';
  }
  finalizeMatch(epoch);
}

// ---------------------------------------------------------------------------
// Finalize → RESULT → back to IDLE
// ---------------------------------------------------------------------------

function finalizeMatch(epoch = getOperationEpoch()) {
  if (!isCurrentEpoch(epoch)) return;
  setPhase(PHASES.RESULT, state.resultDurationSec * 1000);
  broadcastState(_io);

  // Mongo'ya yaz (best-effort)
  saveMatch({
    startedAt: state.matchStartedAt || new Date(),
    endedAt: new Date(),
    targetPrompt: state.targetPrompt,
    category: state.roundCategory,
    difficulty: state.roundDifficulty,
    referenceImageUrl: state.referenceImageUrl,
    winnerMode: state.winnerMode,
    playerA: state.players.A
      ? {
          nickname: state.players.A.nickname,
          prompt: state.players.A.prompt,
          imageUrl: state.players.A.imageUrl,
          aiScore: state.players.A.aiScore,
          voteCount: state.votes.A,
          forfeit: state.players.A.forfeit
        }
      : null,
    playerB: state.players.B
      ? {
          nickname: state.players.B.nickname,
          prompt: state.players.B.prompt,
          imageUrl: state.players.B.imageUrl,
          aiScore: state.players.B.aiScore,
          voteCount: state.votes.B,
          forfeit: state.players.B.forfeit
        }
      : null,
    winner: state.winner,
    tiebreakUsed: state.scoringPhase === 'TIEBREAK'
  }).catch(() => {});

  // Pre-cache next target (best effort)
  ensureTargetImage().catch(() => {});

  // Schedule return to idle
  setPhaseTimer(state.resultDurationSec * 1000, () => {
    if (isCurrentEpoch(epoch)) returnToIdle();
  });
}

function returnToIdle() {
  clearAllDisconnectTimers();
  resetMatch();
  broadcastState(_io);
}

// ---------------------------------------------------------------------------
// Disconnect handling
// ---------------------------------------------------------------------------

function handlePlayerDisconnect(slot) {
  const p = state.players[slot];
  if (!p) return;

  if (state.phase === PHASES.PLAYER_1_JOINED) {
    // Player A vazgeçti, oyun idle'a döner
    returnToIdle();
    return;
  }

  if (state.phase === PHASES.VS_INTRO || state.phase === PHASES.PROMPTING) {
    p.disconnectedAt = Date.now();
    broadcastState(_io);
    setDisconnectTimer(slot, DISCONNECT_GRACE_MS, () => {
      const stillGone = state.players[slot]?.disconnectedAt;
      if (!stillGone) return;
      if (state.phase === PHASES.PROMPTING) {
        // Auto-submit whatever they had
        p.submitted = true;
        broadcastState(_io);
        if (state.players.A?.submitted && state.players.B?.submitted) {
          beginGenerating('disconnect_grace');
        }
      } else if (state.phase === PHASES.VS_INTRO) {
        // Reset to idle — eşitsiz başlangıç olur
        returnToIdle();
      }
    });
  }
}

function handlePlayerReconnect(slot, socketId) {
  const p = state.players[slot];
  if (!p) return;
  p.disconnectedAt = null;
  p.socketId = socketId;
  clearDisconnectTimer(slot);
  broadcastState(_io);
}

// ---------------------------------------------------------------------------
// Admin actions
// ---------------------------------------------------------------------------

function adminForceEnd() {
  if (state.phase === PHASES.IDLE) return;
  const epoch = bumpOperationEpoch();
  state.winner = 'TIE';
  finalizeMatch(epoch);
}

function adminReset() {
  clearPhaseTimer();
  clearAllDisconnectTimers();
  returnToIdle();
}

function adminUpdateSettings(patch) {
  const lockChanged =
    (patch.lockedCategory !== undefined && patch.lockedCategory !== state.lockedCategory) ||
    (patch.lockedDifficulty !== undefined && patch.lockedDifficulty !== state.lockedDifficulty);
  Object.assign(state, {
    lockedCategory: patch.lockedCategory ?? state.lockedCategory,
    lockedDifficulty: patch.lockedDifficulty ?? state.lockedDifficulty,
    winnerMode: patch.winnerMode ?? state.winnerMode,
    showLivePrompts:
      patch.showLivePrompts !== undefined ? !!patch.showLivePrompts : state.showLivePrompts,
    promptDurationSec: patch.promptDurationSec ?? state.promptDurationSec,
    votingDurationSec: patch.votingDurationSec ?? state.votingDurationSec,
    tiebreakDurationSec: patch.tiebreakDurationSec ?? state.tiebreakDurationSec,
    resultDurationSec: patch.resultDurationSec ?? state.resultDurationSec,
    vsIntroDurationSec: patch.vsIntroDurationSec ?? state.vsIntroDurationSec,
    stageLanguage: patch.stageLanguage ?? state.stageLanguage,
    stageTheme: patch.stageTheme ?? state.stageTheme
  });
  if (lockChanged) {
    invalidateReferenceCache();
    state.referencePending = false;
    if (state.phase === PHASES.IDLE) {
      ensureTargetImage().catch(() => {});
    }
  }
  broadcastState(_io);
}

module.exports = {
  setIo,
  ensureTargetImage,
  invalidateReferenceCache,
  tryJoinAsPlayer,
  handlePromptTyping,
  handlePromptSubmit,
  handleVote,
  handlePlayerDisconnect,
  handlePlayerReconnect,
  adminForceEnd,
  adminReset,
  adminUpdateSettings,
  returnToIdle,
  // for testing
  beginGenerating
};
