// State snapshot builder + broadcast helpers.

const { state, PHASES } = require('../game/state.js');
const { mask } = require('../profanity.js');
const { categoryLabel, difficultyLabel } = require('../game/targetPrompt.js');

function _safePlayer(p, opts) {
  if (!p) return null;
  return {
    nickname: p.nickname,
    submitted: !!p.submitted,
    forfeit: !!p.forfeit,
    disconnected: !!p.disconnectedAt,
    imageUrl: opts.includeImage ? p.imageUrl : null,
    prompt: opts.includePrompt ? mask(p.prompt) : null,
    aiScore: opts.includeScore ? p.aiScore : null
  };
}

function buildSnapshot() {
  const phase = state.phase;

  // Live prompt görünürlüğü: PROMPTING/GENERATING'de showLivePrompts ayarına bağlı.
  // Maç karara bağlandıktan sonra (SCORING ve sonrası) prompt'lar her zaman görünür
  // — reveal'in parçası; gizlemenin anlamı yok ve gizlersek ekranda kaybolur.
  const includePrompt =
    (state.showLivePrompts &&
      (phase === PHASES.PROMPTING || phase === PHASES.GENERATING)) ||
    phase === PHASES.SCORING ||
    phase === PHASES.VOTING ||
    phase === PHASES.TIEBREAK_VOTE ||
    phase === PHASES.RESULT;

  const includeImage =
    phase === PHASES.GENERATING ||
    phase === PHASES.SCORING ||
    phase === PHASES.VOTING ||
    phase === PHASES.TIEBREAK_VOTE ||
    phase === PHASES.RESULT;

  // Kazanan her zaman AI ile belirlendiği için skorlar SCORING/RESULT'ta hep gönderilir.
  const includeScore = phase === PHASES.SCORING || phase === PHASES.RESULT;

  return {
    phase,
    phaseEndsAt: state.phaseEndsAt,
    matchId: state.matchId,
    // Kategori/zorluk rozeti: tur boyunca görünür (kod + TR etiket).
    roundCategory: state.roundCategory,
    roundDifficulty: state.roundDifficulty,
    roundCategoryLabel: state.roundCategory ? categoryLabel(state.roundCategory) : null,
    roundDifficultyLabel: state.roundDifficulty ? difficultyLabel(state.roundDifficulty) : null,
    // Gerçek prompt SADECE RESULT'ta sızdırılır (reveal/payoff).
    targetPrompt: phase === PHASES.RESULT ? state.targetPrompt : null,
    winnerMode: state.winnerMode,
    showLivePrompts: state.showLivePrompts,
    stageLanguage: state.stageLanguage,
    stageTheme: state.stageTheme,
    referenceImageUrl: state.referenceImageUrl,
    players: {
      A: _safePlayer(state.players.A, { includePrompt, includeImage, includeScore }),
      B: _safePlayer(state.players.B, { includePrompt, includeImage, includeScore })
    },
    votes:
      phase === PHASES.VOTING || phase === PHASES.TIEBREAK_VOTE || phase === PHASES.RESULT
        ? { A: state.votes.A, B: state.votes.B }
        : null,
    winner: phase === PHASES.RESULT ? state.winner : null,
    aiReasoning: phase === PHASES.RESULT ? state.aiReasoning : null,
    durations: {
      promptDurationSec: state.promptDurationSec,
      votingDurationSec: state.votingDurationSec,
      tiebreakDurationSec: state.tiebreakDurationSec,
      resultDurationSec: state.resultDurationSec,
      vsIntroDurationSec: state.vsIntroDurationSec
    }
  };
}

function broadcastState(io) {
  io.emit('state', buildSnapshot());
}

function broadcastPromptUpdate(io, slot, text) {
  if (!state.showLivePrompts) return;
  io.emit('prompt_update', { slot, text });
}

module.exports = { buildSnapshot, broadcastState, broadcastPromptUpdate };
