'use client';

import { useEffect, useState } from 'react';
import { useGameState } from '@/components/client/useGameState';
import { useI18n } from '@/components/client/i18nContext';
import { StageChrome, LiveBadge, StageMatchMeta } from '@/components/ui/StageChrome';
import { QRCard } from '@/components/ui/QRCode';

interface Props {
  showWaiting?: boolean;
}

/**
 * IDLE / PLAYER_1_JOINED stage view.
 * Layout: asymmetric 2-col grid; left = giant editorial headline + meta,
 * right = QR card. Lower-third reserved for player 1 status if joined.
 */
export function StageIdle({ showWaiting }: Props) {
  const { state } = useGameState();
  const { t } = useI18n();
  const [origin, setOrigin] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') setOrigin(window.location.origin);
  }, []);

  const player1 = state?.players.A;

  return (
    <StageChrome
      topBar={
        <>
          <div className="flex items-center gap-4">
            <span className="q-display text-3xl text-primary">prompt clash</span>
            <LiveBadge label={t('live')} />
          </div>
          <StageMatchMeta theme={state?.theme ?? ''} matchLabel={`${t('match')} #${state?.matchId?.slice(-4) ?? '—'}`} />
        </>
      }
    >
      <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-16 items-center">
        {/* Left: headline + meta */}
        <div className="flex flex-col gap-6">
          <span className="q-label q-label-primary text-base">{t('audienceMode')}</span>
          <h1 className="q-display text-display-2xl text-ink">
            {t('stageIdleHero1')}<br />
            <span className="text-primary">{t('stageIdleAccent')}</span> {t('stageIdleHero2')}
          </h1>
          <p className="text-2xl text-ink-variant max-w-xl leading-snug">
            {t('stageIdleSubtitle')}
          </p>

          {showWaiting && player1 && (
            <div className="q-card-soft p-6 mt-4 animate-slideUp inline-flex items-center gap-4 max-w-md">
              <span className="q-display w-12 h-12 rounded-full bg-primary text-white grid place-items-center text-xl">
                A
              </span>
              <div className="flex flex-col">
                <span className="q-label">{t('playerAJoined')}</span>
                <span className="text-xl font-semibold">{player1.nickname}</span>
              </div>
            </div>
          )}
        </div>

        {/* Right: QR card */}
        <div className="flex flex-col items-center gap-6">
          {origin && (
            <QRCard value={origin} size={340} caption={t('scanToJoin')} />
          )}
        </div>
      </div>
    </StageChrome>
  );
}
