'use client';

import { useGameState } from './useGameState';
import { useI18n } from './i18nContext';
import { JoinForm } from './JoinForm';
import { PromptingView } from './PromptingView';
import { AudienceView } from './AudienceView';
import { VoteView } from './VoteView';
import { ResultView } from './ResultView';

export function MobileShell() {
  const { state, mySlot } = useGameState();
  const { t } = useI18n();

  if (!state) {
    return (
      <main className="min-h-screen grid place-items-center bg-surface px-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-[3px] border-primary-100 border-t-primary animate-spin" />
          <p className="q-label">{t('connecting')}</p>
        </div>
      </main>
    );
  }

  // Active player flow
  if (mySlot) {
    if (state.phase === 'PROMPTING' || state.phase === 'VS_INTRO') {
      return <PromptingView />;
    }
    if (state.phase === 'GENERATING' || state.phase === 'SCORING') {
      return <AudienceView />;
    }
    if (state.phase === 'VOTING' || state.phase === 'TIEBREAK_VOTE') {
      return <AudienceView />;
    }
    if (state.phase === 'RESULT') {
      return <ResultView />;
    }
  }

  // Audience flow
  switch (state.phase) {
    case 'IDLE':
      return <JoinForm />;
    case 'PLAYER_1_JOINED':
      return <JoinForm waitingFor={state.players.A?.nickname ?? null} />;
    case 'VOTING':
    case 'TIEBREAK_VOTE':
      return <VoteView />;
    case 'RESULT':
      return <ResultView />;
    default:
      return <AudienceView />;
  }
}
