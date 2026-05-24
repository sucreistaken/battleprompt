'use client';

import { useGameState } from './useGameState';
import { useI18n } from './i18nContext';
import { PlayerCard } from '@/components/ui/PlayerCard';
import { cn } from '@/lib/utils';

/**
 * RESULT — winner reveal. Big editorial headline ("KAZANAN" or "BERABERE"),
 * winner card highlighted + glow, loser dimmed. AI reasoning shown if winner
 * mode is AI_SCORE.
 */
export function ResultView() {
  const { state } = useGameState();
  const { t } = useI18n();

  if (!state) return null;

  const isTie = state.winner === 'TIE';
  const winnerSlot = state.winner === 'A' ? 'A' : state.winner === 'B' ? 'B' : null;
  const winner = winnerSlot ? state.players[winnerSlot] : null;
  const aiMode = state.winnerMode === 'AI_SCORE';

  return (
    <main className="min-h-screen flex flex-col bg-surface qdl-safe-top">
      {/* Headline */}
      <section className="px-6 pt-6 pb-6 text-center">
        <span className="q-label q-label-primary block mb-2">
          {aiMode ? t('aiScore') : t('audienceVote')}
        </span>
        <h1
          className={cn(
            'q-display text-display-xl',
            isTie ? 'text-ink' : 'text-primary',
          )}
        >
          {isTie ? t('tie') : t('winner')}
        </h1>
        {!isTie && winner && (
          <p className="mt-2 q-h1 text-2xl text-ink">{winner.nickname}</p>
        )}
      </section>

      {/* Player cards side-by-side stacked vertical mobile */}
      <section className="flex-1 px-6 pb-4 flex flex-col gap-4">
        {(['A', 'B'] as const).map((slot) => {
          const isWinner = !isTie && winnerSlot === slot;
          const isLoser = !isTie && winnerSlot && winnerSlot !== slot;
          return (
            <PlayerCard
              key={slot}
              slot={slot}
              player={state.players[slot]}
              variant="mobile"
              state={isWinner ? 'winner' : isLoser ? 'loser' : 'revealed'}
              aiScore={aiMode ? state.players[slot]?.aiScore ?? null : undefined}
              voteCount={!aiMode && state.votes ? state.votes[slot] : undefined}
            />
          );
        })}

        {aiMode && state.aiReasoning && (
          <div className="q-card-soft p-4 mt-2">
            <p className="q-label mb-2">AI değerlendirmesi</p>
            <p className="text-sm text-ink-variant leading-relaxed">{state.aiReasoning}</p>
          </div>
        )}
      </section>

      <footer className="px-6 pb-6 qdl-safe-bottom">
        <p className="text-center text-xs text-ink-light">{t('backToIdle')}</p>
      </footer>
    </main>
  );
}
