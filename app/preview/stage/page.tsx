'use client';

/**
 * Dev preview — full broadcast stage (all phases) with mock socket state.
 * Renders StageShell so fonts, keyframes and the 1920x1080 scaler are exercised
 * exactly like production. Not linked anywhere; access at /preview/stage?phase=VS_INTRO.
 * Phases: IDLE, PLAYER_1_JOINED, VS_INTRO, PROMPTING, GENERATING, SCORING, VOTING, RESULT.
 */

import { useSearchParams } from 'next/navigation';
import { GameCtx } from '@/components/client/useGameState';
import { I18nProvider } from '@/components/client/i18nContext';
import { StageShell } from '@/components/stage/StageShell';
import type { Phase, StateSnapshot } from '@/types/game';

const IMG_A = 'https://picsum.photos/seed/clash-a/700/700';
const IMG_B = 'https://picsum.photos/seed/clash-b/700/700';
const REF = 'https://picsum.photos/seed/clash-ref/600/600';
const PROMPT_A = 'neon-soaked alley cat, chrome whiskers, holographic collar glowing magenta, rain reflections of tokyo signs';
const PROMPT_B = 'lone cyber-feline on a midnight rooftop, fiber-optic fur, two katanas, the moon a flickering hologram';

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

function buildMock(phase: Phase): { state: StateSnapshot; livePrompts: { A: string; B: string } } {
  const base: StateSnapshot = {
    phase,
    phaseEndsAt: Date.now() + 22_000,
    matchId: 'preview-match-12ab',
    theme: 'a single futuristic cyberpunk cat with neon lights',
    winnerMode: 'AUDIENCE_VOTE',
    showLivePrompts: true,
    stageLanguage: 'tr',
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

export default function PreviewStagePage() {
  const params = useSearchParams();
  const phase = (params.get('phase') as Phase) || 'IDLE';
  const { state, livePrompts } = buildMock(phase);

  const ctx = {
    socket: null,
    state,
    livePrompts,
    mySlot: null,
    myNickname: null,
    setMyNickname: () => {},
    joinGame: async () => ({ ok: false }),
    submitPrompt: () => {},
    sendTyping: () => {},
    vote: async () => ({ ok: false }),
    forceUpdate: () => {},
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;

  return (
    <I18nProvider forceLang="tr">
      <GameCtx.Provider value={ctx}>
        <StageShell />
      </GameCtx.Provider>
    </I18nProvider>
  );
}
