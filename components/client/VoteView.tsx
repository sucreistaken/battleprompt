'use client';

import { useState } from 'react';
import { useGameState } from './useGameState';
import { useI18n } from './i18nContext';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { cn } from '@/lib/utils';
import type { Slot } from '@/types/game';

/**
 * VOTING / TIEBREAK_VOTE — audience picks favorite.
 * Two big tappable cards stacked. Tap fires vote, immediate visual confirmation.
 */
export function VoteView() {
  const { state, vote } = useGameState();
  const { t } = useI18n();
  const [voted, setVoted] = useState<Slot | null>(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!state) return null;

  const isTiebreak = state.phase === 'TIEBREAK_VOTE';
  const duration = isTiebreak ? state.durations.tiebreakDurationSec : state.durations.votingDurationSec;

  const handleVote = async (slot: Slot) => {
    if (voted || working) return;
    setWorking(true);
    setError(null);
    setVoted(slot);  // optimistic
    const res = await vote(slot);
    if (!res.ok) {
      setVoted(null);
      setError(t('disconnected'));
    }
    setWorking(false);
  };

  return (
    <main className="min-h-screen flex flex-col bg-surface qdl-safe-top">
      {/* Top: title + countdown */}
      <header className="px-6 pt-4 pb-3 flex items-center justify-between">
        <div>
          <span className="q-label q-label-primary">
            {isTiebreak ? t('suddenDeath') : t('voteHere')}
          </span>
          <h1 className="mt-1 q-h1 text-2xl text-ink">{t('voteHere')}</h1>
        </div>
        <CountdownTimer
          endsAt={state.phaseEndsAt}
          totalSeconds={duration}
          showLabel={false}
        />
      </header>

      {/* Two tappable cards */}
      <section className="flex-1 px-6 py-4 flex flex-col gap-4 overflow-auto">
        {(['A', 'B'] as const).map((slot) => {
          const player = state.players[slot];
          const isVoted = voted === slot;
          const isOther = voted && voted !== slot;
          return (
            <button
              key={slot}
              type="button"
              onClick={() => handleVote(slot)}
              disabled={!!voted || working}
              aria-pressed={isVoted}
              className={cn(
                'q-card-elevated overflow-hidden text-left transition-all',
                isVoted && 'ring-4 ring-primary shadow-cardLg',
                isOther && 'opacity-50',
                !voted && 'active:scale-[0.98] hover:shadow-cardLg',
              )}
            >
              <div className="px-4 py-3 flex items-center justify-between border-b border-border">
                <div className="flex items-center gap-3">
                  <span className="q-display w-9 h-9 rounded-full bg-primary text-white grid place-items-center text-lg">
                    {slot}
                  </span>
                  <span className="font-semibold">{player?.nickname ?? `Player ${slot}`}</span>
                </div>
                {isVoted && <span className="q-pill-primary">{t('voted')}</span>}
              </div>
              {player?.imageUrl ? (
                <img
                  src={player.imageUrl}
                  alt={`${player.nickname} prompt result`}
                  className="w-full aspect-square object-cover"
                />
              ) : (
                <div className="w-full aspect-square q-skeleton" />
              )}
            </button>
          );
        })}

        {error && (
          <p role="alert" className="text-sm text-danger text-center">{error}</p>
        )}
      </section>
    </main>
  );
}
