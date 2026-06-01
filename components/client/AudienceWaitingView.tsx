'use client';

// AudienceWaitingView — izleyici LOBBY/PLAYER_1_JOINED fazında, oyuncular
// READY'e basana kadar gördüğü temalı bekleme ekranı. Önceki davranışta
// MobileShell bu durumda <StageEntry/> (oyuncu nickname formu) render
// ediyordu — izleyici için yanlış UI ve "siyah" gibi okunan boş arayüzdü.
//
// Tasarım dili: audience surface'leri lime aksanlı (WatchClient ile aynı
// kimlik), mor değil. Mascot + sakin pulse + "1/2 oyuncu geldi" göstergesi
// + opsiyonel mini ipucu kartı. Hiç input/form yok: pasif izleme modu.

import { useGameState } from './useGameState';
import { useI18n } from './i18nContext';
import { BgAtmosphere } from '@/components/common/BgAtmosphere';
import { MascotFrame } from '@/components/common/MascotFrame';
import { LangToggle } from './LangToggle';

export function AudienceWaitingView() {
  const { state } = useGameState();
  const { t } = useI18n();

  const aPlayer = state?.players?.A ?? null;
  const bPlayer = state?.players?.B ?? null;
  const joined = (aPlayer ? 1 : 0) + (bPlayer ? 1 : 0);

  const slotPill =
    joined === 0
      ? t('audienceWaitingNonePill')
      : joined === 1
        ? t('audienceWaitingOnePill')
        : t('audienceWaitingBothPill');

  return (
    <>
      <LangToggle />
      <div style={{ minHeight: '100dvh', position: 'relative', overflowX: 'hidden' }}>
        <BgAtmosphere variant="lime" />

        <main
          style={{
            position: 'relative',
            zIndex: 1,
            maxWidth: 560,
            margin: '0 auto',
            padding: '14px 18px 32px',
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
            minHeight: '100dvh',
            boxSizing: 'border-box',
          }}
        >
          <header style={headerStyle}>
            <span style={tagStyle}>
              <span aria-hidden="true" style={tagDotStyle} className="aw-dot" />
              {t('audienceWaitingLabel')}
            </span>
          </header>

          <section style={mascotWrapStyle} aria-hidden="true">
            <MascotFrame size={120} mascotSize={96} variant="lime" />
          </section>

          <section style={headlineWrapStyle}>
            <h1 style={h1Style}>{t('audienceWaitingTitle')}</h1>
            <p style={subStyle}>{t('audienceWaitingSub')}</p>
          </section>

          <section style={slotsStyle} aria-live="polite">
            <span style={slotsLabelStyle}>
              <span aria-hidden="true" style={lblLineStyle} />
              {t('audienceWaitingSlotsLabel')}
            </span>
            <div style={slotsRowStyle}>
              <SlotDot ready={!!aPlayer} letter="A" name={aPlayer?.nickname ?? null} />
              <SlotDot ready={!!bPlayer} letter="B" name={bPlayer?.nickname ?? null} />
            </div>
            <div style={slotsPillStyle}>{slotPill}</div>
          </section>

          <aside style={tipStyle}>
            <span style={tipLabelStyle}>{t('audienceWaitingTipLabel')}</span>
            <p style={tipBodyStyle}>{t('audienceWaitingTip')}</p>
          </aside>
        </main>

        <style>{`
          @keyframes awDot { 0%,100% { opacity: 1 } 50% { opacity: .35 } }
          .aw-dot { animation: awDot 1.6s ease-in-out infinite; }
          @media (prefers-reduced-motion: reduce) {
            .aw-dot { animation: none; }
          }
        `}</style>
      </div>
    </>
  );
}

function SlotDot({ ready, letter, name }: { ready: boolean; letter: 'A' | 'B'; name: string | null }) {
  const accent = letter === 'A' ? 'var(--pc-a)' : 'var(--pc-b)';
  return (
    <div style={{ ...slotDotStyle, borderColor: ready ? accent : 'var(--pc-line)' }}>
      <span
        style={{
          ...slotLetterStyle,
          color: ready ? accent : 'var(--pc-text4)',
          background: ready ? 'rgba(255,255,255,0.04)' : 'transparent',
          borderColor: ready ? accent : 'var(--pc-line)',
        }}
      >
        {letter}
      </span>
      <span style={{ ...slotNameStyle, color: ready ? 'var(--pc-bone)' : 'var(--pc-text3)' }}>
        {ready ? name ?? `Player ${letter}` : '—'}
      </span>
    </div>
  );
}

// ─── styles ─────────────────────────────────────────────────────────────────

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-start',
  paddingTop: 4,
};

const tagStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '4px 11px',
  borderRadius: 999,
  background: 'rgba(174,210,74,0.10)',
  border: '1px solid rgba(174,210,74,0.34)',
  fontFamily: "'Inter Tight', system-ui, sans-serif",
  fontSize: 10.5,
  fontWeight: 700,
  letterSpacing: '0.20em',
  color: '#aed24a',
};

const tagDotStyle: React.CSSProperties = {
  width: 6,
  height: 6,
  borderRadius: '50%',
  background: '#aed24a',
  flex: 'none',
  boxShadow: '0 0 8px rgba(174,210,74,0.5)',
};

const mascotWrapStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  padding: '6px 0 2px',
};

const headlineWrapStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  gap: 8,
  maxWidth: 460,
  marginInline: 'auto',
};

const h1Style: React.CSSProperties = {
  fontFamily: "'Inter Tight', system-ui, sans-serif",
  fontSize: 'clamp(22px, 6vw, 28px)',
  fontWeight: 700,
  color: 'var(--pc-bone)',
  letterSpacing: '-0.005em',
  lineHeight: 1.2,
  margin: 0,
};

const subStyle: React.CSSProperties = {
  fontFamily: "'Inter Tight', system-ui, sans-serif",
  fontSize: 14,
  color: 'var(--pc-text2)',
  lineHeight: 1.5,
  margin: 0,
  maxWidth: '42ch',
};

const slotsStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  padding: '14px 16px',
  background: 'var(--pc-ink2)',
  border: '1px solid var(--pc-ink3)',
  borderRadius: 14,
};

const slotsLabelStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 10,
  fontFamily: "'Inter Tight', system-ui, sans-serif",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: 'var(--pc-text3)',
};

const lblLineStyle: React.CSSProperties = {
  width: 16,
  height: 1,
  background: 'var(--pc-line2)',
  flex: 'none',
};

const slotsRowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 10,
};

const slotDotStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '10px 12px',
  borderRadius: 10,
  border: '1.5px solid var(--pc-line)',
  background: 'var(--pc-ink)',
  transition: 'border-color .25s ease',
  minWidth: 0,
};

const slotLetterStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 28,
  height: 28,
  borderRadius: 6,
  border: '1.5px solid',
  fontFamily: "'Silkscreen', monospace",
  fontSize: 13,
  letterSpacing: '0.02em',
  flex: 'none',
  transition: 'color .25s ease, background .25s ease, border-color .25s ease',
};

const slotNameStyle: React.CSSProperties = {
  fontFamily: "'Inter Tight', system-ui, sans-serif",
  fontSize: 13.5,
  fontWeight: 600,
  letterSpacing: '0.01em',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  minWidth: 0,
  transition: 'color .25s ease',
};

const slotsPillStyle: React.CSSProperties = {
  alignSelf: 'flex-start',
  fontFamily: "'Inter Tight', system-ui, sans-serif",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: 'var(--pc-text2)',
  padding: '4px 10px',
  borderRadius: 999,
  background: 'rgba(174,210,74,0.08)',
  border: '1px solid rgba(174,210,74,0.30)',
};

const tipStyle: React.CSSProperties = {
  marginTop: 'auto',
  padding: '12px 14px',
  borderRadius: 10,
  background: 'rgba(124,77,255,0.06)',
  border: '1px solid rgba(124,77,255,0.22)',
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
};

const tipLabelStyle: React.CSSProperties = {
  fontFamily: "'Inter Tight', system-ui, sans-serif",
  fontSize: 9.5,
  fontWeight: 700,
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: 'var(--pc-accent)',
};

const tipBodyStyle: React.CSSProperties = {
  margin: 0,
  fontFamily: "'Inter Tight', system-ui, sans-serif",
  fontSize: 13,
  lineHeight: 1.5,
  color: 'var(--pc-text2)',
};
