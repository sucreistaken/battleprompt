// State snapshot builder + broadcast helpers.

const { state, PHASES } = require('../game/state.js');

function _safePlayer(p, opts) {
  if (!p) return null;
  return {
    nickname: p.nickname,
    submitted: !!p.submitted,
    forfeit: !!p.forfeit,
    disconnected: !!p.disconnectedAt,
    imageUrl: opts.includeImage ? p.imageUrl : null,
    prompt: opts.includePrompt ? p.prompt : null,
    aiScore: opts.includeScore ? p.aiScore : null
  };
}

function buildSnapshot() {
  const phase = state.phase;

  // Live prompt görünürlüğü: PROMPTING fazında showLivePrompts=true ise içerik
  // broadcast'a dahil edilir (UI yine de filtre uygulayabilir).
  const includePrompt =
    state.showLivePrompts &&
    (phase === PHASES.PROMPTING || phase === PHASES.GENERATING);

  const includeImage =
    phase === PHASES.GENERATING ||
    phase === PHASES.SCORING ||
    phase === PHASES.VOTING ||
    phase === PHASES.TIEBREAK_VOTE ||
    phase === PHASES.RESULT;

  const includeScore =
    (phase === PHASES.SCORING || phase === PHASES.RESULT) &&
    state.winnerMode === 'AI_SCORE';

  return {
    phase,
    phaseEndsAt: state.phaseEndsAt,
    matchId: state.matchId,
    theme: state.theme,
    winnerMode: state.winnerMode,
    showLivePrompts: state.showLivePrompts,
    stageLanguage: state.stageLanguage,
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
