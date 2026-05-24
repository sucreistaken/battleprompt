'use client';

import { useGameState } from '@/components/client/useGameState';
import { StageIdle } from './StageIdle';
import { StageVS } from './StageVS';
import { StagePrompting } from './StagePrompting';
import { StageGenerating } from './StageGenerating';
import { StageVoting } from './StageVoting';
import { StageResult } from './StageResult';

export function StageShell() {
  const { state } = useGameState();
  if (!state) {
    return (
      <div className="min-h-screen grid place-items-center text-white/30">
        connecting…
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
      return <StageVoting scoringMode />;
    case 'VOTING':
    case 'TIEBREAK_VOTE':
      return <StageVoting />;
    case 'RESULT':
      return <StageResult />;
    default:
      return null;
  }
}
