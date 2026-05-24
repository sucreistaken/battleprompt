'use client';

import { useGameState } from '@/components/client/useGameState';
import { useI18n } from '@/components/client/i18nContext';
import { StageChrome, LiveBadge, StageMatchMeta } from '@/components/ui/StageChrome';

/**
 * VS_INTRO — both players joined, "Player A vs Player B" reveal.
 * Asymmetric layout: A on left, big VS in center, B on right.
 */
export function StageVS() {
  const { state } = useGameState();
  const { t } = useI18n();

  if (!state) return null;
  const a = state.players.A;
  const b = state.players.B;

  return (
    <StageChrome
      topBar={
        <>
          <div className="flex items-center gap-4">
            <span className="q-display text-3xl text-primary">prompt clash</span>
            <LiveBadge />
          </div>
          <StageMatchMeta theme={state.theme} matchLabel={`${t('match')} #${state.matchId?.slice(-4) ?? ''}`} />
        </>
      }
    >
      <div className="w-full max-w-7xl">
        <div className="grid grid-cols-[1fr_auto_1fr] gap-12 items-center animate-slideUp">
          {/* Player A */}
          <div className="text-right flex flex-col items-end gap-4">
            <span className="q-display w-24 h-24 rounded-full bg-primary text-white grid place-items-center text-5xl shadow-cardLg">
              A
            </span>
            <span className="q-label">Player A</span>
            <h2 className="q-display text-display-xl text-ink break-words max-w-md">
              {a?.nickname ?? '—'}
            </h2>
          </div>

          {/* VS */}
          <div className="flex flex-col items-center gap-3">
            <span className="q-display text-display-2xl text-primary leading-none tabular-nums">
              VS
            </span>
            <span className="q-label">{state.theme}</span>
          </div>

          {/* Player B */}
          <div className="text-left flex flex-col items-start gap-4">
            <span className="q-display w-24 h-24 rounded-full bg-primary text-white grid place-items-center text-5xl shadow-cardLg">
              B
            </span>
            <span className="q-label">Player B</span>
            <h2 className="q-display text-display-xl text-ink break-words max-w-md">
              {b?.nickname ?? '—'}
            </h2>
          </div>
        </div>
      </div>
    </StageChrome>
  );
}
