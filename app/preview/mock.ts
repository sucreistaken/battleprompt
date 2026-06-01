// Shared mock match state for the dev preview (/preview/stage) and the demo
// auto-player (/demo). One source of truth so the two never drift. No socket,
// no AI, no DB — pure fixtures that exercise every StageShell phase board.

import type { Phase, Slot, StateSnapshot } from '@/types/game';

export const IMG_A = 'https://picsum.photos/seed/clash-a/700/700';
export const IMG_B = 'https://picsum.photos/seed/clash-b/700/700';
export const REF = 'https://picsum.photos/seed/clash-ref/600/600';
export const PROMPT_A =
  'neon-soaked alley cat, chrome whiskers, holographic collar glowing magenta, rain reflections of tokyo signs';
export const PROMPT_B =
  'lone cyber-feline on a midnight rooftop, fiber-optic fur, two katanas, the moon a flickering hologram';

const durations = {
  promptDurationSec: 30,
  votingDurationSec: 20,
  tiebreakDurationSec: 10,
  resultDurationSec: 12,
  vsIntroDurationSec: 5,
};

function player(nickname: string, over: Partial<StateSnapshot['players']['A']> = {}) {
  return {
    nickname,
    submitted: false,
    forfeit: false,
    disconnected: false,
    imageUrl: null,
    prompt: null,
    aiScore: null,
    ...over,
  };
}

export function buildMock(phase: Phase): {
  state: StateSnapshot;
  livePrompts: { A: string; B: string };
} {
  const base: StateSnapshot = {
    phase,
    phaseEndsAt: Date.now() + 22_000,
    matchId: 'preview-match-12ab',
    roomCode: 'DX22DT',
    roundCategory: 'scifi',
    roundDifficulty: 'legendary',
    roundCategoryLabel: 'BİLİM-KURGU',
    roundDifficultyLabel: 'EFSANE',
    targetPrompt: 'a neon megacity skyline at dusk, flying cars between glass towers',
    targetPromptTr: 'alacakaranlıkta neon kaplı bir megakent silueti, cam kuleler arasından süzülen uçan arabalar',
    winnerMode: 'AUDIENCE_VOTE',
    showLivePrompts: true,
    stageLanguage: 'tr',
    stageTheme: 'dark',
    referenceImageUrl: REF,
    players: { A: player('alice'), B: player('bob') },
    votes: null,
    winner: null,
    aiReasoning: null,
    durations,
  };
  const live = { A: '', B: '' };

  switch (phase) {
    case 'IDLE':
      base.players = { A: null, B: null };
      break;
    case 'PLAYER_1_JOINED':
      base.players = { A: player('alice'), B: null };
      break;
    case 'PROMPTING':
      base.players = { A: player('alice'), B: player('bob', { submitted: true, prompt: PROMPT_B }) };
      live.A = PROMPT_A;
      live.B = PROMPT_B;
      break;
    case 'GENERATING':
      base.players = {
        A: player('alice', { submitted: true, prompt: PROMPT_A }),
        B: player('bob', { submitted: true, prompt: PROMPT_B }),
      };
      live.A = PROMPT_A;
      live.B = PROMPT_B;
      break;
    case 'SCORING':
      base.players = {
        A: player('alice', { submitted: true, prompt: PROMPT_A, imageUrl: IMG_A }),
        B: player('bob', { submitted: true, prompt: PROMPT_B, imageUrl: IMG_B }),
      };
      break;
    case 'VOTING':
    case 'TIEBREAK_VOTE':
      base.players = {
        A: player('alice', { submitted: true, prompt: PROMPT_A, imageUrl: IMG_A }),
        B: player('bob', { submitted: true, prompt: PROMPT_B, imageUrl: IMG_B }),
      };
      base.votes = { A: 47, B: 35 };
      break;
    case 'RESULT':
      base.players = {
        A: player('alice', { submitted: true, prompt: PROMPT_A, imageUrl: IMG_A }),
        B: player('bob', { submitted: true, prompt: PROMPT_B, imageUrl: IMG_B }),
      };
      base.votes = { A: 54, B: 33 };
      base.winner = 'A';
      base.phaseEndsAt = null;
      break;
    default:
      break;
  }
  return { state: base, livePrompts: live };
}

/**
 * Mock socket context StageShell / MobileShell consume — everything inert.
 * Pass `mySlot` to preview the player phone flow (PromptingView etc.).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mockGameCtx(
  phase: Phase,
  mySlot: Slot | null = null,
  theme: 'dark' | 'light' = 'dark',
): any {
  const { state, livePrompts } = buildMock(phase);
  state.stageTheme = theme;
  return {
    socket: null,
    state,
    livePrompts,
    mySlot,
    myNickname: null,
    setMyNickname: () => {},
    joinGame: async () => ({ ok: false }),
    submitPrompt: () => {},
    sendTyping: () => {},
    vote: async () => ({ ok: false }),
    forceUpdate: () => {},
  };
}

/** Demo auto-play order + how long each board stays on screen (ms). */
export const DEMO_SEQUENCE: { phase: Phase; ms: number }[] = [
  { phase: 'IDLE', ms: 3000 },
  { phase: 'PLAYER_1_JOINED', ms: 3000 },
  { phase: 'VS_INTRO', ms: 3500 },
  { phase: 'PROMPTING', ms: 5500 },
  { phase: 'GENERATING', ms: 4500 },
  { phase: 'SCORING', ms: 3500 },
  { phase: 'VOTING', ms: 5500 },
  { phase: 'RESULT', ms: 5500 },
];
