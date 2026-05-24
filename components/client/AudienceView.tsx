'use client';

import { useGameState } from './useGameState';
import { useI18n } from './i18nContext';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { PlayerCard } from '@/components/ui/PlayerCard';

/**
 * Catch-all audience / spectating view for non-player phases.
 * Shows phase status, optional countdown, and 2 player cards stacked.
 * Generating → shimmer skeletons; SCORING → "AI puanlıyor" label.
 */
export function AudienceView() {
  const { state, livePrompts } = useGameState();
  const { t } = useI18n();

  if (!state) return null;

  const phase = state.phase;
  const isGenerating = phase === 'GENERATING' || phase === 'SCORING';
  const isPrompting = phase === 'PROMPTING' || phase === 'VS_INTRO';

  const statusLabel =
    phase === 'GENERATING' ? t('generating') :
    phase === 'SCORING' ? 'AI puanlıyor…' :
    phase === 'PROMPTING' ? 'Oyuncular prompt yazıyor' :
    phase === 'VS_INTRO' ? t('vs') :
    phase === 'IDLE' ? t('backToIdle') :
    '';

  const slotState = (slot: 'A' | 'B'): any => {
    if (isGenerating) return 'generating';
    if (isPrompting) {
      return state.players[slot]?.submitted ? 'submitted' : 'typing';
    }
    if (state.players[slot]?.imageUrl) return 'revealed';
    return 'idle';
  };

  return (
    <main className="min-h-screen flex flex-col bg-surface qdl-safe-top">
      {/* Top status */}
      <header className="px-6 pt-4 pb-3 flex items-center justify-between">
        <div>
          <span className="q-label q-label-primary">{t('audience')}</span>
          <p className="mt-1 text-sm font-semibold text-ink">{statusLabel}</p>
        </div>
        {isPrompting && state.phaseEndsAt && (
          <CountdownTimer
            endsAt={state.phaseEndsAt}
            totalSeconds={state.durations.promptDurationSec}
            showLabel={false}
          />
        )}
      </header>

      {/* Player cards stacked */}
      <section className="flex-1 px-6 py-4 flex flex-col gap-4 overflow-auto">
        <PlayerCard
          slot="A"
          player={state.players.A}
          variant="mobile"
          state={slotState('A')}
          livePromptText={livePrompts.A}
          showLivePrompt={state.showLivePrompts && isPrompting}
        />
        <PlayerCard
          slot="B"
          player={state.players.B}
          variant="mobile"
          state={slotState('B')}
          livePromptText={livePrompts.B}
          showLivePrompt={state.showLivePrompts && isPrompting}
        />
      </section>
    </main>
  );
}
