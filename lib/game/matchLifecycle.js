// Maç yaşam döngüsü orkestrasyonu.
// Tüm faz geçişleri buradan yapılır; her geçiş sonunda broadcastState çağrılır.

const {
  state,
  PHASES,
  setPhase,
  resetMatch,
  makePlayer,
  newMatchId
} = require('./state.js');
const {
  setPhaseTimer,
  clearPhaseTimer,
  setDisconnectTimer,
  clearDisconnectTimer,
  clearAllDisconnectTimers
} = require('./timers.js');
const { broadcastState, broadcastPromptUpdate } = require('../socket/broadcasts.js');
const { generateImage } = require('../gemini/image.js');
const { scoreVsReference } = require('../gemini/score.js');
const { uploadBuffer } = require('../gcs.js');
const { saveMatch } = require('../../models/Match.js');
const { recordVote } = require('../../models/Vote.js');
const { validateNickname, mask } = require('../profanity.js');

const DISCONNECT_GRACE_MS = 10_000;
const REF_PROMPT_PREFIX =
  'A single subject, vivid and clear composition, professional photograph or illustration. Theme: ';

let _io = null;
function setIo(io) {
  _io = io;
}

// ---------------------------------------------------------------------------
// Reference image (pre-cache + on-demand)
// ---------------------------------------------------------------------------

async function ensureReferenceImage(theme) {
  if (state.referencePending) return;
  if (state.nextReferenceImageUrl && state.referenceForTheme === theme) return;
  state.referencePending = true;
  try {
    if (process.env.DEMO_MODE === '1') {
      // Placeholder reference for screenshot demos without Gemini/GCS
      state.nextReferenceImageUrl =
        'https://picsum.photos/seed/promptclash-ref-' + Date.now() + '/640';
      state.referenceForTheme = theme;
      console.log('[ref] demo placeholder set');
      return;
    }
    const prompt = REF_PROMPT_PREFIX + theme;
    const { buffer, mimeType } = await generateImage(prompt);
    const path = `references/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${mimeType.includes('jpeg') ? 'jpg' : 'png'}`;
    const url = await uploadBuffer(path, buffer, mimeType);
    state.nextReferenceImageUrl = url;
    state.referenceForTheme = theme;
    console.log('[ref] pre-cached:', url);
  } catch (err) {
    console.warn('[ref] generation failed:', err.message);
    // Fallback: keep null; UI will show generic placeholder.
    state.nextReferenceImageUrl = null;
    state.referenceForTheme = null;
  } finally {
    state.referencePending = false;
  }
}

function invalidateReferenceCache() {
  state.nextReferenceImageUrl = null;
  state.referenceForTheme = null;
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
  state.matchId = newMatchId();
  state.matchStartedAt = new Date();
  // Promote next reference image into current
  state.referenceImageUrl = state.nextReferenceImageUrl;
  state.nextReferenceImageUrl = null;
  state.referenceForTheme = null;

  setPhase(PHASES.VS_INTRO, state.vsIntroDurationSec * 1000);
  broadcastState(_io);
  setPhaseTimer(state.vsIntroDurationSec * 1000, () => beginPrompting());

  // If we didn't have a pre-cached reference, generate now in the background.
  // (Players will see a placeholder briefly; usually pre-cache is ready.)
  if (!state.referenceImageUrl) {
    ensureReferenceImage(state.theme).then(() => {
      if (state.nextReferenceImageUrl && !state.referenceImageUrl) {
        state.referenceImageUrl = state.nextReferenceImageUrl;
        state.nextReferenceImageUrl = null;
        broadcastState(_io);
      }
    });
  }
}

function beginPrompting() {
  setPhase(PHASES.PROMPTING, state.promptDurationSec * 1000);
  broadcastState(_io);
  setPhaseTimer(state.promptDurationSec * 1000, () => beginGenerating('timer'));
}

// ---------------------------------------------------------------------------
// Prompt updates / submission
// ---------------------------------------------------------------------------

function handlePromptTyping({ slot, text }) {
  if (state.phase !== PHASES.PROMPTING) return;
  const p = state.players[slot];
  if (!p || p.submitted) return;
  p.prompt = String(text || '').slice(0, 500);
  if (state.showLivePrompts) {
    broadcastPromptUpdate(_io, slot, p.prompt);
  }
}

function handlePromptSubmit({ slot, text }) {
  if (state.phase !== PHASES.PROMPTING) return;
  const p = state.players[slot];
  if (!p || p.submitted) return;
  p.prompt = String(text || '').slice(0, 500);
  p.submitted = true;
  broadcastState(_io);

  if (state.players.A?.submitted && state.players.B?.submitted) {
    beginGenerating('both_submitted');
  }
}

// ---------------------------------------------------------------------------
// Generation
// ---------------------------------------------------------------------------

async function _generateForSlot(slot) {
  const p = state.players[slot];
  if (!p) return;
  const prompt = (p.prompt && p.prompt.trim()) || 'abstract art';

  if (process.env.DEMO_MODE === '1') {
    // Stagger so the two "renderings" arrive at slightly different times
    await new Promise((r) => setTimeout(r, 1500 + Math.random() * 2500));
    const seed = `${state.matchId}-${slot}-${prompt.slice(0, 20)}`.replace(/\s+/g, '-');
    p.imageUrl = `https://picsum.photos/seed/${encodeURIComponent(seed)}/640`;
    state.genErrors[slot] = false;
    broadcastState(_io);
    return;
  }

  try {
    const { buffer, mimeType } = await generateImage(prompt);
    const objPath = `matches/${state.matchId}/${slot}.png`;
    const url = await uploadBuffer(objPath, buffer, mimeType);
    p.imageUrl = url;
    state.genErrors[slot] = false;
  } catch (err) {
    console.warn(`[gen] slot ${slot} failed:`, err.message);
    state.genErrors[slot] = true;
    p.forfeit = true;
  }
  broadcastState(_io);
}

async function beginGenerating(reason) {
  clearPhaseTimer();
  // Lock any un-submitted prompts as final
  for (const slot of ['A', 'B']) {
    const p = state.players[slot];
    if (p && !p.submitted) p.submitted = true;
  }
  setPhase(PHASES.GENERATING);
  broadcastState(_io);
  console.log(`[lifecycle] GENERATING (${reason})`);

  await Promise.all([_generateForSlot('A'), _generateForSlot('B')]);
  await afterGenerating();
}

async function afterGenerating() {
  const failA = state.genErrors.A;
  const failB = state.genErrors.B;

  if (failA && failB) {
    // İki taraf da başarısız → berabere ilan et, hemen RESULT
    state.winner = 'TIE';
    finalizeMatch();
    return;
  }
  if (failA || failB) {
    // Tek taraf forfeit → diğeri kazandı
    state.winner = failA ? 'B' : 'A';
    finalizeMatch();
    return;
  }

  if (state.winnerMode === 'AI_SCORE') {
    await beginScoring();
  } else {
    beginVoting('MAIN');
  }
}

// ---------------------------------------------------------------------------
// Scoring (AI mode)
// ---------------------------------------------------------------------------

async function beginScoring() {
  setPhase(PHASES.SCORING);
  broadcastState(_io);

  if (process.env.DEMO_MODE === '1') {
    // Stay on SCORING screen briefly, then commit fake scores
    await new Promise((r) => setTimeout(r, 3000));
    const a = 52 + Math.floor(Math.random() * 12);
    const b = 100 - a + Math.floor(Math.random() * 8) - 4;
    state.players.A.aiScore = a;
    state.players.B.aiScore = b;
    state.aiReasoning =
      'Both entries captured the brief, but one held the mood and composition tighter.';
    broadcastState(_io);
    if (a === b) {
      beginVoting('TIEBREAK');
      return;
    }
    state.winner = a > b ? 'A' : 'B';
    finalizeMatch();
    return;
  }

  try {
    if (!state.referenceImageUrl || !state.players.A?.imageUrl || !state.players.B?.imageUrl) {
      throw new Error('missing images');
    }
    const { a, b, reasoning } = await scoreVsReference(
      state.referenceImageUrl,
      state.players.A.imageUrl,
      state.players.B.imageUrl
    );
    state.players.A.aiScore = a;
    state.players.B.aiScore = b;
    state.aiReasoning = reasoning;
    broadcastState(_io);

    if (a === b) {
      // Tie → sudden-death audience vote
      beginVoting('TIEBREAK');
      return;
    }
    state.winner = a > b ? 'A' : 'B';
    finalizeMatch();
  } catch (err) {
    console.warn('[scoring] failed, falling back to audience vote:', err.message);
    beginVoting('MAIN');
  }
}

// ---------------------------------------------------------------------------
// Voting (audience + tiebreak)
// ---------------------------------------------------------------------------

function beginVoting(scoringPhase) {
  state.scoringPhase = scoringPhase;
  state.votes = { A: 0, B: 0 };
  state.voterIds = new Set();
  const phase = scoringPhase === 'TIEBREAK' ? PHASES.TIEBREAK_VOTE : PHASES.VOTING;
  const durationSec =
    scoringPhase === 'TIEBREAK' ? state.tiebreakDurationSec : state.votingDurationSec;
  setPhase(phase, durationSec * 1000);
  broadcastState(_io);
  setPhaseTimer(durationSec * 1000, () => finalizeVote());
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

function finalizeVote() {
  const { A, B } = state.votes;
  if (state.players.A) state.players.A.voteCount = A;
  if (state.players.B) state.players.B.voteCount = B;

  if (A === B) {
    // Hâlâ berabere
    if (state.scoringPhase === 'MAIN') {
      // Sudden-death dene
      beginVoting('TIEBREAK');
      return;
    }
    state.winner = 'TIE';
  } else {
    state.winner = A > B ? 'A' : 'B';
  }
  finalizeMatch();
}

// ---------------------------------------------------------------------------
// Finalize → RESULT → back to IDLE
// ---------------------------------------------------------------------------

function finalizeMatch() {
  setPhase(PHASES.RESULT, state.resultDurationSec * 1000);
  broadcastState(_io);

  // Mongo'ya yaz (best-effort)
  saveMatch({
    startedAt: state.matchStartedAt || new Date(),
    endedAt: new Date(),
    theme: state.theme,
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

  // Pre-cache next reference image (best effort)
  ensureReferenceImage(state.theme).catch(() => {});

  // Schedule return to idle
  setPhaseTimer(state.resultDurationSec * 1000, () => returnToIdle());
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
  state.winner = 'TIE';
  finalizeMatch();
}

function adminReset() {
  clearPhaseTimer();
  clearAllDisconnectTimers();
  returnToIdle();
}

function adminUpdateSettings(patch) {
  const themeChanged = patch.theme && patch.theme !== state.theme;
  Object.assign(state, {
    theme: patch.theme ?? state.theme,
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
  if (themeChanged) {
    invalidateReferenceCache();
    if (state.phase === PHASES.IDLE) {
      ensureReferenceImage(state.theme).catch(() => {});
    }
  }
  broadcastState(_io);
}

module.exports = {
  setIo,
  ensureReferenceImage,
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
