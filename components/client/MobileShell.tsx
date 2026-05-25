'use client';

import { useGameState } from './useGameState';
import { useI18n } from './i18nContext';
import { useStageTheme } from '@/components/stage/atmosphere';
import { StageEntry } from './StageEntry';
import { PromptingView } from './PromptingView';
import { AudienceView } from './AudienceView';
import { VoteView } from './VoteView';
import { ResultView } from './ResultView';

export function MobileShell() {
  const { state, mySlot } = useGameState();
  const { t } = useI18n();
  useStageTheme(state?.stageTheme);

  if (!state) {
    // Match the dark broadcast language even before socket state lands, so the
    // first paint never flashes the light surface.
    return (
      <main
        className="grid place-items-center px-6"
        style={{ minHeight: '100dvh', background: 'var(--pc-ink)' }}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-[3px] border-white/15 border-t-[#7c4dff] animate-spin" />
          <p
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#8c8898',
            }}
          >
            {t('connecting')}
          </p>
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
    case 'PLAYER_1_JOINED':
      return <StageEntry />;
    case 'VOTING':
    case 'TIEBREAK_VOTE':
      return <VoteView />;
    case 'RESULT':
      return <ResultView />;
    default:
      return <AudienceView />;
  }
}
