'use client';

// Ready-Check v2 — ported from mockups/ready-check.html (A: waiting / B: you're ready).
// Both players in LOBBY → each marks ready → server fires startMatch.
// Logic preserved: socket emit 'player_ready', auto-timeout in matchLifecycle,
// stale-flag reconcile on socket reattach.

import { useEffect, useState, type CSSProperties } from 'react';
import { useGameState } from './useGameState';
import { useI18n } from './i18nContext';
import { useStageTheme } from '@/components/stage/atmosphere';
import { AppHeader } from '@/components/common/AppHeader';
import { BackLink } from '@/components/common/BackLink';
import { BgAtmosphere } from '@/components/common/BgAtmosphere';

export function ReadyCheckView() {
  const { state, mySlot, socket } = useGameState();
  const { t } = useI18n();
  useStageTheme(state?.stageTheme);
  const [busy, setBusy] = useState(false);

  const youSlot = mySlot || 'A';
  const oppSlot: 'A' | 'B' = youSlot === 'A' ? 'B' : 'A';
  const me = state?.players?.[youSlot] || null;
  const opp = state?.players?.[oppSlot] || null;
  const meReady = !!me?.ready;
  const oppReady = !!opp?.ready;
  const oppNick = opp?.nickname || t('opponent');

  useEffect(() => {
    if (meReady) setBusy(false);
  }, [meReady]);

  function markReady() {
    if (!socket || meReady || busy) return;
    setBusy(true);
    socket.emit('player_ready', {}, (res: { ok?: boolean } | undefined) => {
      if (!res?.ok) setBusy(false);
    });
  }

  return (
    <div style={{ minHeight: '100dvh', position: 'relative', overflowX: 'hidden' }}>
      <BgAtmosphere variant="default" />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 560,
          margin: '0 auto',
          padding: '14px 18px 36px',
        }}
      >
        <AppHeader right={<BackLink href="/" label={t('back')} />} />

        <section style={headStyle}>
          <span style={meReady ? tagReadyStyle : tagWaitStyle}>
            <span aria-hidden="true" style={meReady ? tagReadyDotStyle : tagWaitDotStyle} />
            {meReady ? t('readyTagReady') : t('readyTagWaiting')}
          </span>
          <h1 style={h1Style}>{meReady ? t('readyTitleReady') : t('readyTitleWaiting')}</h1>
          <p style={subStyle}>
            {meReady ? t('readySubReady').replace('{name}', oppNick) : t('readySubWaiting')}
          </p>
        </section>

        <div style={vsStripStyle} aria-label={t('ariaPlayers')}>
          <PlayerCard
            role="me"
            slot={youSlot}
            name={`${me?.nickname || '—'} · ${t('waitingYouLabel')}`}
            ready={meReady}
            t={t}
          />
          <span style={vsMidStyle} aria-hidden="true">VS</span>
          <PlayerCard
            role="opp"
            slot={oppSlot}
            name={opp?.nickname || t('opponent')}
            ready={oppReady}
            t={t}
          />
        </div>

        <div style={readyRowStyle}>
          {meReady ? (
            <button type="button" disabled style={ctaDoneStyle}>
              {t('readyCtaDone')}
            </button>
          ) : (
            <button
              type="button"
              onClick={markReady}
              disabled={busy}
              style={{ ...ctaStyle, opacity: busy ? 0.6 : 1, cursor: busy ? 'wait' : 'pointer' }}
              className="pc-cta"
            >
              {t('readyCta')}
              <span aria-hidden="true" style={ctaArrowStyle}>→</span>
            </button>
          )}
          <a href="/" style={cancelLinkStyle} className="pc-cancel">
            {t('readyCancel')}
          </a>
        </div>
      </div>

      <style>{`
        .pc-cta { transition: transform .1s, box-shadow .16s; }
        .pc-cta:hover:not(:disabled) { box-shadow: 0 14px 36px rgba(124,77,255,.44), inset 0 -2px 0 rgba(0,0,0,.18); }
        .pc-cta:active:not(:disabled) { transform: translateY(1px); }
        .pc-cancel { transition: color .14s, background .14s; }
        .pc-cancel:hover { color: var(--pc-text); background: var(--pc-ink2); }
        @keyframes pc-ready-pulse { 0%,100% { opacity: 1; } 50% { opacity: .4; } }
        .pc-pstate-waiting-pd { animation: pc-ready-pulse 1.4s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .pc-pstate-waiting-pd { animation: none; } }
      `}</style>
    </div>
  );
}

// ─── Player card ──────────────────────────────────────────────────────────────

function PlayerCard({
  role,
  slot,
  name,
  ready,
  t,
}: {
  role: 'me' | 'opp';
  slot: 'A' | 'B';
  name: string;
  ready: boolean;
  t: (k: any) => string;
}) {
  const isMe = role === 'me';
  // Border + shadow regime:
  // - me + (waiting OR ready): solid mor border + accent inset
  // - opp + waiting: dashed lime-line2 border, no shadow
  // - opp + ready: solid lime border + lime inset + light lime tint
  const borderStyle: CSSProperties = isMe
    ? {
        borderColor: 'var(--pc-accent)',
        borderStyle: 'solid',
        boxShadow: 'inset 0 -2px 0 rgba(124,77,255,0.28)',
      }
    : ready
      ? {
          borderColor: '#aed24a',
          borderStyle: 'solid',
          boxShadow: 'inset 0 -2px 0 rgba(174,210,74,0.28)',
          background:
            'linear-gradient(180deg, rgba(174,210,74,0.06) 0%, transparent 70%), var(--pc-ink2)',
        }
      : { borderColor: 'var(--pc-line2)', borderStyle: 'dashed' };
  const avaStyle: CSSProperties = isMe
    ? {
        background: 'var(--pc-accent)',
        color: '#fff',
        boxShadow: 'inset 0 -3px 0 #5a35cc, inset 0 1px 0 rgba(255,255,255,0.18)',
      }
    : {
        background: '#aed24a',
        color: '#0e0e10',
        boxShadow: 'inset 0 -3px 0 #88aa2e, inset 0 1px 0 rgba(255,255,255,0.20)',
      };
  return (
    <div style={{ ...pcardBaseStyle, ...borderStyle }}>
      <span aria-hidden="true" style={{ ...avaBaseStyle, ...avaStyle }}>
        {slot}
      </span>
      <span style={pnameStyle}>{name}</span>
      <span style={ready ? pstateReadyStyle : pstateWaitStyle}>
        <span
          aria-hidden="true"
          className={ready ? undefined : 'pc-pstate-waiting-pd'}
          style={{
            ...pdStyle,
            background: ready ? '#aed24a' : 'var(--pc-text4)',
            boxShadow: ready ? '0 0 7px rgba(174,210,74,0.6)' : undefined,
          }}
        />
        {ready
          ? isMe
            ? t('readyMeReady')
            : t('readyOpponentReady')
          : isMe
            ? t('readyMeWaiting')
            : t('readyOpponentWaiting')}
      </span>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const headStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  padding: '20px 0 14px',
};

const tagBaseStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  alignSelf: 'flex-start',
  gap: 8,
  padding: '4px 10px',
  borderRadius: 999,
  fontFamily: "'Inter Tight', system-ui, sans-serif",
  fontSize: 10.5,
  letterSpacing: '0.10em',
};

const tagWaitStyle: CSSProperties = {
  ...tagBaseStyle,
  background: 'rgba(124,77,255,0.10)',
  border: '1px solid rgba(124,77,255,0.34)',
  color: 'var(--pc-accent)',
};

const tagWaitDotStyle: CSSProperties = {
  width: 6,
  height: 6,
  background: 'var(--pc-accent)',
  flex: 'none',
  boxShadow: '0 0 8px rgba(124,77,255,0.5)',
};

const tagReadyStyle: CSSProperties = {
  ...tagBaseStyle,
  background: 'rgba(174,210,74,0.10)',
  border: '1px solid rgba(174,210,74,0.34)',
  color: '#aed24a',
};

const tagReadyDotStyle: CSSProperties = {
  width: 6,
  height: 6,
  background: '#aed24a',
  flex: 'none',
  boxShadow: '0 0 8px rgba(174,210,74,0.5)',
};

const h1Style: CSSProperties = {
  fontFamily: "'Inter Tight', system-ui, sans-serif",
  fontSize: 'clamp(24px, 6.5vw, 30px)',
  fontWeight: 700,
  color: 'var(--pc-bone)',
  letterSpacing: '-0.005em',
  lineHeight: 1.18,
  margin: 0,
};

const subStyle: CSSProperties = {
  fontFamily: "'Inter Tight', system-ui, sans-serif",
  fontSize: 14,
  color: 'var(--pc-text2)',
  lineHeight: 1.5,
  margin: 0,
  maxWidth: '46ch',
};

// VS strip
const vsStripStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr auto 1fr',
  gap: 10,
  alignItems: 'stretch',
  padding: '12px 0 6px',
};

const vsMidStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: "'Inter Tight', system-ui, sans-serif",
  fontSize: 14,
  letterSpacing: '0.04em',
  color: 'var(--pc-text3)',
  padding: '0 4px',
  flex: 'none',
  minWidth: 28,
  textShadow: '0 0 10px rgba(124,77,255,0.3)',
};

const pcardBaseStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 9,
  padding: '16px 12px',
  background: 'var(--pc-ink2)',
  border: '1.5px solid var(--pc-line)',
  borderRadius: 10,
  minWidth: 0,
};

const avaBaseStyle: CSSProperties = {
  width: 48,
  height: 48,
  flex: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: "'Inter Tight', system-ui, sans-serif",
  fontSize: 18,
  letterSpacing: '0.04em',
  borderRadius: 3,
  imageRendering: 'pixelated',
};

const pnameStyle: CSSProperties = {
  fontFamily: "'Inter Tight', system-ui, sans-serif",
  fontSize: 14,
  fontWeight: 700,
  color: 'var(--pc-bone)',
  textAlign: 'center',
  lineHeight: 1.2,
  maxWidth: '100%',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  width: '100%',
};

const pstateBaseStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  fontFamily: "'Inter Tight', system-ui, sans-serif",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
};

const pstateReadyStyle: CSSProperties = {
  ...pstateBaseStyle,
  color: '#aed24a',
};

const pstateWaitStyle: CSSProperties = {
  ...pstateBaseStyle,
  color: 'var(--pc-text3)',
};

const pdStyle: CSSProperties = {
  width: 5,
  height: 5,
  flex: 'none',
};

// CTAs
const readyRowStyle: CSSProperties = {
  marginTop: 18,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

const ctaStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  minHeight: 60,
  borderRadius: 10,
  background: 'var(--pc-accent)',
  color: '#fff',
  border: 'none',
  fontFamily: "'Inter Tight', system-ui, sans-serif",
  fontSize: 16,
  fontWeight: 800,
  letterSpacing: '0.005em',
  boxShadow: '0 10px 28px rgba(124,77,255,0.32), inset 0 -2px 0 rgba(0,0,0,0.18)',
};

const ctaArrowStyle: CSSProperties = {
  fontFamily: "'Inter Tight', system-ui, sans-serif",
  fontSize: 18,
  lineHeight: 1,
};

const ctaDoneStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  minHeight: 60,
  borderRadius: 10,
  background: 'rgba(174,210,74,0.12)',
  color: '#aed24a',
  border: '1.5px solid #aed24a',
  fontFamily: "'Inter Tight', system-ui, sans-serif",
  fontSize: 16,
  fontWeight: 800,
  letterSpacing: '0.005em',
  cursor: 'default',
  boxShadow: 'inset 0 -2px 0 rgba(174,210,74,0.20)',
};

const cancelLinkStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 44,
  background: 'transparent',
  border: 'none',
  color: 'var(--pc-text3)',
  fontFamily: "'Inter Tight', system-ui, sans-serif",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  textDecoration: 'none',
};
