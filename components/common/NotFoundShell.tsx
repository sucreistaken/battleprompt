'use client';

// NotFoundShell v2 — ported from mockups/room-not-found.html.
// Shared 404 / room-missing surface reused by all not-found.tsx routes
// (app/, app/rooms/[roomId]/, app/join/[roomCode]/, app/watch/[roomCode]/).
//
// Visual signature: danger-tinted atmosphere (live-red glow + grid), dim "uyuyor"
// mascot (opacity .62, grayscale + saturate, slow idleFloat), pixel err-code pill,
// pixel h1 (deliberate exception to the body-font rule — empty-states keep character).

import { I18nProvider, useI18n } from '@/components/client/i18nContext';
import { AppHeader } from '@/components/common/AppHeader';
import { BgAtmosphere } from '@/components/common/BgAtmosphere';
import { MascotFrame } from '@/components/common/MascotFrame';
import type { CSSProperties } from 'react';

type Props = {
  /** Optional override copy. Defaults to the room-not-found microcopy bundle. */
  code?: string;
  title?: string;
  description?: string;
};

export function NotFoundShell(props: Props) {
  return (
    <I18nProvider>
      <NotFoundBody {...props} />
    </I18nProvider>
  );
}

function NotFoundBody({ code, title, description }: Props) {
  const { t } = useI18n();
  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflowX: 'hidden',
      }}
    >
      <BgAtmosphere variant="danger" />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 560,
          margin: '0 auto',
          padding: '14px 18px',
          width: '100%',
        }}
      >
        <AppHeader />
      </div>

      <section style={emptyStyle}>
        <div style={emptyInnerStyle}>
          <MascotFrame size={120} mascotSize={96} variant="dim" />

          <span style={errCodePillStyle}>
            <span aria-hidden="true" style={errCodeDotStyle} />
            {code || t('notFoundCode')}
          </span>

          <h1 style={h1Style}>{title || t('notFoundTitle')}</h1>
          <p style={descStyle}>{description || t('notFoundDesc')}</p>

          <div style={actionsStyle}>
            <a href="/" style={ctaStyle} className="pc-cta">
              <span>{t('notFoundHome')}</span>
              <span aria-hidden="true" style={ctaArrowStyle}>→</span>
            </a>
            <a href="/create-room" style={ctaSecondaryStyle} className="pc-cta-sec">
              {t('notFoundCreate')}
            </a>
          </div>
        </div>
      </section>

      <footer style={footStyle}>
        <span style={{ color: '#aed24a', letterSpacing: '0.06em', marginRight: 6 }}>▣</span>
        PROMPT CLASH · 2026
      </footer>

      <style>{`
        .pc-cta { transition: transform .1s, box-shadow .16s; text-decoration: none; }
        .pc-cta:hover { box-shadow: 0 14px 34px rgba(124,77,255,.42), inset 0 -2px 0 rgba(0,0,0,.18); }
        .pc-cta:active { transform: translateY(1px); }
        .pc-cta-sec { transition: border-color .14s, color .14s, background .14s; text-decoration: none; }
        .pc-cta-sec:hover { border-color: var(--pc-line2); color: var(--pc-bone); background: var(--pc-ink2); }
      `}</style>
    </div>
  );
}

const emptyStyle: CSSProperties = {
  flex: 1,
  position: 'relative',
  zIndex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '32px 18px',
};

const emptyInnerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  gap: 18,
  maxWidth: 420,
  width: '100%',
};

const errCodePillStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 9,
  padding: '4px 11px',
  borderRadius: 999,
  background: 'rgba(255,92,92,0.10)',
  border: '1px solid rgba(255,92,92,0.34)',
  fontFamily: "'Inter Tight', system-ui, sans-serif",
  fontSize: 10.5,
  letterSpacing: '0.10em',
  color: 'var(--pc-live)',
  textTransform: 'uppercase',
};

const errCodeDotStyle: CSSProperties = {
  width: 6,
  height: 6,
  background: 'var(--pc-live)',
  flex: 'none',
  boxShadow: '0 0 8px rgba(255,92,92,0.5)',
};

const h1Style: CSSProperties = {
  // 404 sayfasının pixel kimliği (mockup'tan).
  fontFamily: "'Silkscreen', monospace",
  fontSize: 'clamp(24px, 6.5vw, 30px)',
  color: 'var(--pc-bone)',
  letterSpacing: '0.04em',
  fontWeight: 400,
  lineHeight: 1.2,
  margin: 0,
};

const descStyle: CSSProperties = {
  fontFamily: "'Inter Tight', system-ui, sans-serif",
  fontSize: 14.5,
  color: 'var(--pc-text2)',
  lineHeight: 1.55,
  margin: 0,
  maxWidth: '40ch',
};

const actionsStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 9,
  width: '100%',
  marginTop: 4,
};

const ctaStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  minHeight: 56,
  borderRadius: 10,
  background: 'var(--pc-accent)',
  color: '#fff',
  border: 'none',
  fontFamily: "'Inter Tight', system-ui, sans-serif",
  fontSize: 15,
  fontWeight: 800,
  cursor: 'pointer',
  boxShadow: '0 10px 26px rgba(124,77,255,0.30), inset 0 -2px 0 rgba(0,0,0,0.18)',
};

const ctaArrowStyle: CSSProperties = {
  fontFamily: "'Inter Tight', system-ui, sans-serif",
  fontSize: 17,
  lineHeight: 1,
};

const ctaSecondaryStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  minHeight: 46,
  borderRadius: 10,
  background: 'transparent',
  border: '1.5px solid var(--pc-line)',
  color: 'var(--pc-text)',
  fontFamily: "'Inter Tight', system-ui, sans-serif",
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
};

const footStyle: CSSProperties = {
  padding: '14px 18px',
  textAlign: 'center',
  fontFamily: "'Inter Tight', system-ui, sans-serif",
  fontSize: 10,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'var(--pc-text4)',
  position: 'relative',
  zIndex: 1,
};
