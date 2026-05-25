// Global, in-memory game state singleton.
// Tek instance Cloud Run deploy'unda çalıştığı için RAM'de tutmak güvenli.

const PHASES = Object.freeze({
  IDLE: 'IDLE',
  PLAYER_1_JOINED: 'PLAYER_1_JOINED',
  VS_INTRO: 'VS_INTRO',
  PROMPTING: 'PROMPTING',
  GENERATING: 'GENERATING',
  SCORING: 'SCORING',
  VOTING: 'VOTING',
  TIEBREAK_VOTE: 'TIEBREAK_VOTE',
  RESULT: 'RESULT'
});

function _emptyPlayer() {
  return null;
}

function _initialState() {
  return {
    phase: PHASES.IDLE,
    phaseEndsAt: null,
    matchId: null,
    matchStartedAt: null,
    players: { A: _emptyPlayer(), B: _emptyPlayer() },
    referenceImageUrl: null,
    nextReferenceImageUrl: null,
    referencePending: false,
    referenceForTheme: null,
    theme: 'a single futuristic cyberpunk cat with neon lights',
    winnerMode: 'AI_SCORE',
    showLivePrompts: true,
    promptDurationSec: 60,
    votingDurationSec: 15,
    tiebreakDurationSec: 10,
    resultDurationSec: 15,
    vsIntroDurationSec: 5,
    stageLanguage: 'tr',
    stageTheme: 'dark',
    votes: { A: 0, B: 0 },
    voterIds: new Set(),
    scoringPhase: 'MAIN', // 'MAIN' veya 'TIEBREAK'
    results: null,
    winner: null,
    aiReasoning: null,
    genErrors: { A: false, B: false }
  };
}

const state = _initialState();

function applySettings(settings) {
  state.theme = settings.theme ?? state.theme;
  state.winnerMode = settings.winnerMode ?? state.winnerMode;
  state.showLivePrompts = settings.showLivePrompts ?? state.showLivePrompts;
  state.promptDurationSec = settings.promptDurationSec ?? state.promptDurationSec;
  state.votingDurationSec = settings.votingDurationSec ?? state.votingDurationSec;
  state.tiebreakDurationSec = settings.tiebreakDurationSec ?? state.tiebreakDurationSec;
  state.resultDurationSec = settings.resultDurationSec ?? state.resultDurationSec;
  state.vsIntroDurationSec = settings.vsIntroDurationSec ?? state.vsIntroDurationSec;
  state.stageLanguage = settings.stageLanguage ?? state.stageLanguage;
  state.stageTheme = settings.stageTheme ?? state.stageTheme;
}

function newMatchId() {
  return `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function makePlayer({ socketId, deviceId, nickname }) {
  return {
    socketId,
    deviceId,
    nickname,
    prompt: '',
    submitted: false,
    imageUrl: null,
    disconnectedAt: null,
    forfeit: false,
    aiScore: null
  };
}

function resetMatch() {
  state.phase = PHASES.IDLE;
  state.phaseEndsAt = null;
  state.matchId = null;
  state.matchStartedAt = null;
  state.players = { A: null, B: null };
  state.referenceImageUrl = null;
  state.votes = { A: 0, B: 0 };
  state.voterIds = new Set();
  state.scoringPhase = 'MAIN';
  state.results = null;
  state.winner = null;
  state.aiReasoning = null;
  state.genErrors = { A: false, B: false };
}

function setPhase(phase, endsInMs = null) {
  state.phase = phase;
  state.phaseEndsAt = endsInMs ? Date.now() + endsInMs : null;
}

module.exports = {
  PHASES,
  state,
  applySettings,
  resetMatch,
  setPhase,
  makePlayer,
  newMatchId
};
