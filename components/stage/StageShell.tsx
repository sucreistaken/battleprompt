'use client';

import { useGameState } from '@/components/client/useGameState';
import { useI18n } from '@/components/client/i18nContext';
import { StageIdle } from './StageIdle';
import { StageVS } from './StageVS';
import { StagePrompting } from './StagePrompting';
import { StageGenerating } from './StageGenerating';
import { StageVoting } from './StageVoting';
import { StageResult } from './StageResult';

export function StageShell() {
  const { state } = useGameState();
  const { t } = useI18n();

  if (!state) {
    return (
      <div className="min-h-screen q-stage-bg grid place-items-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full border-[5px] border-primary-100 border-t-primary animate-spin" />
          <p className="q-label text-lg">{t('connecting')}</p>
        </div>
      </div>
    );
  }

  switch (state.phase) {
    case 'IDLE':
      return <StageIdle />;
    case 'PLAYER_1_JOINED':
      return <StageIdle showWaiting />;
    case 'VS_INTRO':
      return <StageVS />;
    case 'PROMPTING':
      return <StagePrompting />;
    case 'GENERATING':
      return <StageGenerating />;
    case 'SCORING':
      return <StageGenerating scoringMode />;
    case 'VOTING':
    case 'TIEBREAK_VOTE':
      return <StageVoting />;
    case 'RESULT':
      return <StageResult />;
    default:
      return null;
  }
}
