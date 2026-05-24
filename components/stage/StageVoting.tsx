'use client';

import { useGameState } from '@/components/client/useGameState';
import { useI18n } from '@/components/client/i18nContext';
import { StageChrome, LiveBadge, StageMatchMeta } from '@/components/ui/StageChrome';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { PlayerCard } from '@/components/ui/PlayerCard';

/**
 * VOTING / TIEBREAK_VOTE — audience votes via mobile.
 * Stage shows both images + live vote count tick.
 */
export function StageVoting() {
  const { state } = useGameState();
  const { t } = useI18n();

  if (!state) return null;
  const isTiebreak = state.phase === 'TIEBREAK_VOTE';
  const duration = isTiebreak ? state.durations.tiebreakDurationSec : state.durations.votingDurationSec;

  return (
    <StageChrome
      topBar={
        <>
          <div className="flex items-center gap-4">
            <span className="q-display text-2xl text-primary">prompt clash</span>
            <LiveBadge label={t('live')} />
          </div>
          <StageMatchMeta theme={state.theme} matchLabel={`${t('match')} #${state.matchId?.slice(-4) ?? ''}`} />
        </>
      }
    >
      <div className="w-full max-w-7xl">
        {/* Headline + countdown */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <span className="q-label q-label-primary text-base">
              {isTiebreak ? t('suddenDeath') : t('voteHere')}
            </span>
            <h1 className="mt-2 q-display text-display-xl text-ink">
              {isTiebreak ? t('tiebreakHeading') : t('voteHeading')}
            </h1>
          </div>
          <CountdownTimer
            endsAt={state.phaseEndsAt}
            totalSeconds={duration}
            variant="stage"
            label={t('timeLeft')}
          />
        </div>

        <div className="grid grid-cols-2 gap-8">
          {(['A', 'B'] as const).map((slot) => (
            <PlayerCard
              key={slot}
              slot={slot}
              player={state.players[slot]}
              variant="stage"
              state="revealed"
              voteCount={state.votes?.[slot] ?? 0}
            />
          ))}
        </div>
      </div>
    </StageChrome>
  );
}
