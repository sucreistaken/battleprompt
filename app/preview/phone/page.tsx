'use client';

/**
 * Dev preview — the MOBILE/phone shell (MobileShell) with mock socket state.
 * Lets you see the player + audience phone views without a live match.
 * Access: /preview/phone?phase=PROMPTING&slot=A
 *   phase: IDLE, PLAYER_1_JOINED, VS_INTRO, PROMPTING, GENERATING, SCORING, VOTING, RESULT
 *   slot:  A | B (omit for the audience/voter flow)
 */

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { GameCtx } from '@/components/client/useGameState';
import { I18nProvider } from '@/components/client/i18nContext';
import { MobileShell } from '@/components/client/MobileShell';
import { mockGameCtx } from '../mock';
import type { Phase, Slot } from '@/types/game';

export default function PreviewPhonePage() {
  return (
    <Suspense fallback={null}>
      <PreviewInner />
    </Suspense>
  );
}

function PreviewInner() {
  const params = useSearchParams();
  const phase = (params.get('phase') as Phase) || 'PROMPTING';
  const slotParam = params.get('slot');
  const slot = slotParam === 'A' || slotParam === 'B' ? (slotParam as Slot) : null;
  const theme = params.get('theme') === 'light' ? 'light' : 'dark';

  return (
    <I18nProvider forceLang="tr">
      <GameCtx.Provider value={mockGameCtx(phase, slot, theme)}>
        <MobileShell />
      </GameCtx.Provider>
    </I18nProvider>
  );
}
