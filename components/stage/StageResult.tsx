'use client';

import { useGameState } from '@/components/client/useGameState';
import { useI18n } from '@/components/client/i18nContext';
import { StageChrome, LiveBadge, StageMatchMeta } from '@/components/ui/StageChrome';
import { PlayerCard } from '@/components/ui/PlayerCard';
import { cn } from '@/lib/utils';

/**
 * RESULT — winner reveal. Big editorial headline, winner card glowing,
 * loser card dimmed. AI reasoning shown when winner mode is AI_SCORE.
 */
export function StageResult() {
  const { state } = useGameState();
  const { t } = useI18n();

  if (!state) return null;
  const isTie = state.winner === 'TIE';
  const winnerSlot = state.winner === 'A' ? 'A' : state.winner === 'B' ? 'B' : null;
  const winner = winnerSlot ? state.players[winnerSlot] : null;
  const aiMode = state.winnerMode === 'AI_SCORE';

  return (
    <StageChrome
      topBar={
        <>
          <div className="flex items-center gap-4">
            <span className="q-display text-2xl text-primary">prompt clash</span>
            <LiveBadge />
          </div>
          <StageMatchMeta theme={state.theme} matchLabel={`${t('match')} #${state.matchId?.slice(-4) ?? ''}`} />
        </>
      }
    >
      <div className="w-full max-w-7xl">
        {/* Headline */}
        <div className="text-center mb-10 animate-slideUp">
          <span className="q-label q-label-primary text-base block mb-3">
            {aiMode ? t('aiScore') : t('audienceVote')}
          </span>
          <h1
            className={cn(
              'q-display text-display-2xl',
              isTie ? 'text-ink' : 'text-primary',
            )}
          >
            {isTie ? t('tie') : t('winner')}
          </h1>
          {!isTie && winner && (
            <p className="mt-3 q-h1 text-display-lg text-ink">{winner.nickname}</p>
          )}
        </div>

        {/* Cards side by side */}
        <div className="grid grid-cols-2 gap-8">
          {(['A', 'B'] as const).map((slot) => {
            const isW = !isTie && winnerSlot === slot;
            const isL = !isTie && winnerSlot && winnerSlot !== slot;
            return (
              <PlayerCard
                key={slot}
                slot={slot}
                player={state.players[slot]}
                variant="stage"
                state={isW ? 'winner' : isL ? 'loser' : 'revealed'}
                aiScore={aiMode ? state.players[slot]?.aiScore ?? null : undefined}
                voteCount={!aiMode && state.votes ? state.votes[slot] : undefined}
              />
            );
          })}
        </div>

        {/* AI reasoning */}
        {aiMode && state.aiReasoning && (
          <div className="q-card-soft p-6 mt-10 max-w-3xl mx-auto">
            <p className="q-label text-base mb-2">AI değerlendirmesi</p>
            <p className="text-xl text-ink-variant leading-relaxed">{state.aiReasoning}</p>
          </div>
        )}
      </div>
    </StageChrome>
  );
}
