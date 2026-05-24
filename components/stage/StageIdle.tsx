'use client';

import { useEffect, useState } from 'react';
import { useGameState } from '@/components/client/useGameState';
import { useI18n } from '@/components/client/i18nContext';
import {
  StageFrame,
  TopBar,
  PixelText,
  Avatar,
  Lbl,
  StageQR,
  C,
  FONT,
} from './atmosphere';

/**
 * IDLE / PLAYER_1_JOINED - wordmark + join helper + per-player slot chips + QR.
 */
export function StageIdle() {
  const { state } = useGameState();
  const { t } = useI18n();
  const [origin, setOrigin] = useState('');
  const [host, setHost] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
      setHost(window.location.host);
    }
  }, []);

  const matchId = state?.matchId ? state.matchId.slice(-4).toUpperCase() : '';

  return (
    <StageFrame>
      <TopBar liveLabel={t('live')} matchId={matchId} theme={state?.theme ?? ''} />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          gridTemplateColumns: '1fr 560px',
          gap: 100,
          alignItems: 'center',
          padding: '160px 110px 120px',
        }}
      >
        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 64 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <PixelText size={220}>PROMPT</PixelText>
            <PixelText size={220} color={C.accent}>
              CLASH
            </PixelText>
          </div>

          <Lbl color="text2" size={18} style={{ letterSpacing: '0.24em' }}>
            {t('scanJoinDuel')}
          </Lbl>

          <div style={{ display: 'flex', gap: 16 }}>
            <SlotChip letter="A" name={state?.players.A?.nickname ?? null} />
            <SlotChip letter="B" name={state?.players.B?.nickname ?? null} />
          </div>
        </div>

        {/* Right - QR card (printed code: always ink on white) */}
        <div
          style={{
            background: C.bone,
            color: C.ink,
            padding: 36,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 22,
          }}
        >
          <span
            style={{
              fontFamily: FONT.pixel,
              fontSize: 16,
              color: C.ink,
              letterSpacing: '0.06em',
              alignSelf: 'flex-start',
            }}
          >
            {t('scanToPlay')}
          </span>
          {origin && <StageQR value={origin} size={380} />}
          <span
            style={{
              fontFamily: FONT.mono,
              fontSize: 19,
              color: C.ink,
              letterSpacing: '0.02em',
              alignSelf: 'stretch',
              textAlign: 'center',
              borderTop: '1px solid #d4d2cc',
              paddingTop: 16,
            }}
          >
            {host}
            {matchId && <span style={{ color: '#9c9aa3' }}>/{matchId}</span>}
          </span>
        </div>
      </div>
    </StageFrame>
  );
}

function SlotChip({ letter, name }: { letter: 'A' | 'B'; name: string | null }) {
  const { t } = useI18n();
  const joined = !!name;
  const color = C.player(letter);
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '18px 22px',
        border: `1px solid ${joined ? color : C.line}`,
        borderLeft: `4px solid ${joined ? color : C.line2}`,
        background: C.ink2,
      }}
    >
      <Avatar letter={letter} size={48} player={joined ? letter : undefined} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Lbl size={11} color={joined ? color : 'text3'}>
          {t('playerLabel')} {letter}
        </Lbl>
        {joined ? (
          <span style={{ fontFamily: FONT.body, fontSize: 24, fontWeight: 700, color: C.bone }}>{name}</span>
        ) : (
          <span style={{ fontFamily: FONT.body, fontSize: 20, fontWeight: 500, color: C.text3, fontStyle: 'italic' }}>
            {t('waitingShort')}
            <span style={{ color, animation: 'pcDotDot 1.4s infinite', marginLeft: 4 }}>.</span>
            <span style={{ color, animation: 'pcDotDot 1.4s infinite 0.2s' }}>.</span>
            <span style={{ color, animation: 'pcDotDot 1.4s infinite 0.4s' }}>.</span>
          </span>
        )}
      </div>
    </div>
  );
}
