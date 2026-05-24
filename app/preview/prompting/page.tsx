'use client';

/**
 * Dev preview — stage PROMPTING with mock socket state.
 * Useful for visual review without running a full match. Not linked from
 * anywhere in the app; access directly at /preview/prompting.
 */

import { GameCtx } from '@/components/client/useGameState';
import { I18nProvider } from '@/components/client/i18nContext';
import { StagePrompting } from '@/components/stage/StagePrompting';
import type { StateSnapshot } from '@/types/game';

const mockState: StateSnapshot = {
  phase: 'PROMPTING',
  phaseEndsAt: Date.now() + 25_000,
  matchId: 'preview-match-12ab',
  theme: 'a single futuristic cyberpunk cat with neon lights',
  winnerMode: 'AI_SCORE',
  showLivePrompts: true,
  stageLanguage: 'tr',
  referenceImageUrl: 'https://picsum.photos/seed/promptclash/600/600',
  players: {
    A: {
      nickname: 'alice',
      submitted: false,
      forfeit: false,
      disconnected: false,
      imageUrl: null,
      prompt: null,
      aiScore: null,
    },
    B: {
      nickname: 'bob',
      submitted: true,
      forfeit: false,
      disconnected: false,
      imageUrl: null,
      prompt: null,
      aiScore: null,
    },
  },
  votes: null,
  winner: null,
  aiReasoning: null,
  durations: {
    promptDurationSec: 30,
    votingDurationSec: 20,
    tiebreakDurationSec: 10,
    resultDurationSec: 12,
    vsIntroDurationSec: 5,
  },
};

const mockLivePrompts = {
  A: 'a futuristic cyberpunk cat with neon eyes on a rainy rooftop in Tokyo',
  B: 'a stray cat under a glowing pink sign, wet pavement reflecting the city',
};

const mockCtx = {
  socket: null,
  state: mockState,
  livePrompts: mockLivePrompts,
  mySlot: null,
  myNickname: null,
  setMyNickname: () => {},
  joinGame: async () => ({ ok: false }),
  submitPrompt: () => {},
  sendTyping: () => {},
  vote: async () => ({ ok: false }),
  forceUpdate: () => {},
} as any;

export default function PreviewPromptingPage() {
  return (
    <I18nProvider forceLang="tr">
      <GameCtx.Provider value={mockCtx}>
        <StagePrompting />
      </GameCtx.Provider>
    </I18nProvider>
  );
}
