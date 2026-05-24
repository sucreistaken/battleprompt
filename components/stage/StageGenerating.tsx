'use client';

import { useGameState } from '@/components/client/useGameState';
import { useI18n } from '@/components/client/i18nContext';
import { StageChrome, LiveBadge, StageMatchMeta } from '@/components/ui/StageChrome';
import { PlayerCard } from '@/components/ui/PlayerCard';

interface Props {
  scoringMode?: boolean;
}

/**
 * GENERATING / SCORING — two skeleton placeholders, primary glow spin.
 * Headline conveys "AI is drawing" or "AI is scoring".
 */
export function StageGenerating({ scoringMode }: Props) {
  const { state } = useGameState();
  const { t } = useI18n();

  if (!state) return null;

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
        <div className="text-center mb-10">
          <span className="q-label q-label-primary text-base">{scoringMode ? 'AI puanlıyor' : 'AI çiziyor'}</span>
          <h1 className="mt-2 q-display text-display-xl text-ink">
            {scoringMode ? 'Sonuçlar hesaplanıyor.' : 'AI promptları görseliyor.'}
          </h1>
        </div>

        <div className="grid grid-cols-2 gap-8">
          {(['A', 'B'] as const).map((slot) => (
            <PlayerCard
              key={slot}
              slot={slot}
              player={state.players[slot]}
              variant="stage"
              state={scoringMode ? 'revealed' : 'generating'}
              imageUrl={scoringMode ? state.players[slot]?.imageUrl : null}
            />
          ))}
        </div>
      </div>
    </StageChrome>
  );
}
