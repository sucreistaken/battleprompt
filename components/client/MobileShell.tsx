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
      <main className="min-h-screen bg-paper grid place-items-center text-ink/30 font-display italic">
        bağlanıyor…
      </main>
    );
  }

  // Player flow
  if (mySlot) {
    if (state.phase === 'PROMPTING' || state.phase === 'VS_INTRO') {
      return <PromptingView />;
    }
    if (state.phase === 'VOTING' || state.phase === 'TIEBREAK_VOTE') {
      return <AudienceView />;
    }
    if (state.phase === 'GENERATING' || state.phase === 'SCORING') {
      return <AudienceView />;
    }
    if (state.phase === 'RESULT') {
      return <ResultView />;
    }
  }

  switch (state.phase) {
    case 'IDLE':
      return <JoinForm />;
    case 'PLAYER_1_JOINED':
      return (
        <JoinForm
          subtitle={`${state.players.A?.nickname} bekliyor — Player B olarak katıl`}
        />
      );
    case 'VOTING':
    case 'TIEBREAK_VOTE':
      return <VoteView />;
    case 'RESULT':
      return <ResultView />;
    default:
      return <AudienceView />;
  }
}
