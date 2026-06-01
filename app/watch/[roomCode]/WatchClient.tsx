'use client';

// Watch Entry v2 — ported from mockups/watch-entry.html + watch-entry-mobile.html.
// Audience onboarding: confirm room identity, optional nickname, single primary
// "İzleyici olarak katıl" CTA, conditional info-row when audience voting is off.
//
// Logic preserved: nick state, audienceEnabled gate (DisabledScreen), sessionStorage
// pending-nick handoff, router.replace to /rooms/:roomId/lobby on join.
// Lime accent identifies audience surface (vs purple host/player surfaces).

import { useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { I18nProvider, useI18n } from '@/components/client/i18nContext';
import { AppHeader } from '@/components/common/AppHeader';
import { BackLink } from '@/components/common/BackLink';
import { BgAtmosphere } from '@/components/common/BgAtmosphere';
import { MascotFrame } from '@/components/common/MascotFrame';
import { EmptyState } from '@/components/common/EmptyState';
import { ButtonLink } from '@/components/common/Buttons';

type Props = {
  roomId: string;
  roomCode: string;
  roomName: string;
  audienceEnabled: boolean;
  audienceVotingEnabled: boolean;
};

export function WatchClient(props: Props) {
  return (
    <I18nProvider>
      <WatchBody {...props} />
    </I18nProvider>
  );
}

function WatchBody({ roomId, roomCode, roomName, audienceEnabled, audienceVotingEnabled }: Props) {
  const { t } = useI18n();
  const router = useRouter();
  const [nick, setNick] = useState('');
  const [busy, setBusy] = useState(false);

  if (!audienceEnabled) {
    return <DisabledScreen roomCode={roomCode} />;
  }

  async function join() {
    setBusy(true);
    const trimmed = nick.trim();
    if (trimmed) {
      try {
        sessionStorage.setItem(`pc_pending_nick:${roomId}`, trimmed);
      } catch {
        /* ignore */
      }
    }
    router.replace(`/rooms/${roomId}/lobby`);
  }

  return (
    <div style={{ minHeight: '100dvh', position: 'relative', overflowX: 'hidden' }}>
      <BgAtmosphere variant="lime" />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 560,
          margin: '0 auto',
          padding: '14px 18px 36px',
        }}
      >
        <AppHeader right={<BackLink href="/" label={t('backHome')} />} />

        <section style={headStyle}>
          <span style={tagStyle}>
            <span aria-hidden="true" style={tagDotStyle} />
            {t('watchTagV3')}
          </span>
          <h1 style={h1Style}>
            {t('watchHeadlineV3')}
            <br />
            <span style={{ color: '#aed24a' }}>{t('watchHeadlineV3Em')}</span>
          </h1>
          <p style={subStyle}>{t('watchPitchV3')}</p>
        </section>

        <section style={mascotHostStyle} aria-label={t('ariaMascot')}>
          <MascotFrame size={104} mascotSize={84} variant="lime" />
        </section>

        <div style={roomStripStyle}>
          <span style={roomStripLblStyle}>{t('watchRoomMetaLabel')}</span>
          <span style={roomStripCodeStyle}>{roomCode}</span>
          {roomName ? (
            <>
              <span aria-hidden="true" style={roomStripSepStyle}>·</span>
              <span style={roomStripNameStyle}>{roomName}</span>
            </>
          ) : null}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!busy) join();
          }}
          noValidate
          style={formStyle}
        >
          <div style={fieldStyle}>
            <div style={fieldHStyle}>
              <label htmlFor="aud-nick" style={lblStyle}>
                <span aria-hidden="true" style={lblLineStyle} />
                {t('watchNicknameOptional')}
              </label>
              <span style={optStyle}>{t('watchNicknameOptionalTag')}</span>
            </div>
            <input
              id="aud-nick"
              type="text"
              value={nick}
              onChange={(e) => setNick(e.target.value)}
              placeholder={t('watchNicknamePlaceholder')}
              maxLength={20}
              inputMode="text"
              autoCorrect="off"
              autoCapitalize="words"
              className="pc-input"
              style={{
                ...inputStyle,
                borderColor: nick ? 'var(--pc-line2)' : 'var(--pc-line)',
                fontWeight: nick ? 600 : 400,
                color: nick ? 'var(--pc-bone)' : 'var(--pc-text)',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={busy}
            style={{ ...ctaStyle, opacity: busy ? 0.65 : 1, cursor: busy ? 'wait' : 'pointer' }}
            className="pc-cta"
          >
            <ShareGlyph />
            {busy ? t('joining') : t('watchCta').replace(/\s*→\s*$/, '')}
            {!busy && (
              <span aria-hidden="true" style={ctaArrowStyle}>→</span>
            )}
          </button>

          {!audienceVotingEnabled && (
            <div role="note" style={infoRowStyle} aria-live="polite">
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                style={{ flex: 'none', color: 'var(--pc-accent)' }}
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 8v4" />
                <path d="M12 16h.01" />
              </svg>
              <span style={infoRowTextStyle}>{t('watchInfoOff')}</span>
            </div>
          )}
        </form>
      </div>

      <style>{`
        .pc-input { transition: border-color .16s, box-shadow .16s; }
        .pc-input:focus { border-color: var(--pc-accent) !important; box-shadow: 0 0 0 3px rgba(124,77,255,.18); outline: none; }
        .pc-cta { transition: transform .1s, box-shadow .16s, opacity .12s; }
        .pc-cta:hover:not(:disabled) { box-shadow: 0 14px 36px rgba(124,77,255,.44), inset 0 -2px 0 rgba(0,0,0,.18); }
        .pc-cta:active:not(:disabled) { transform: translateY(1px); }
      `}</style>
    </div>
  );
}

function DisabledScreen({ roomCode }: { roomCode: string }) {
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
      <BgAtmosphere variant="lime" />
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
        <AppHeader right={<BackLink href="/" label={t('backHome')} />} />
      </div>
      <EmptyState
        code={`${t('watchDisabledLabel')} · ${roomCode}`}
        title={t('watchDisabledTitle')}
        description={t('watchDisabledDesc')}
        actions={
          <ButtonLink href="/" tone="primary" size="md">
            {t('backHome')}
          </ButtonLink>
        }
      />
    </div>
  );
}

function ShareGlyph() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flex: 'none' }}
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const headStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  padding: '18px 0 12px',
};

const tagStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  alignSelf: 'flex-start',
  gap: 8,
  padding: '4px 10px',
  borderRadius: 999,
  background: 'rgba(174,210,74,0.10)',
  border: '1px solid rgba(174,210,74,0.34)',
  fontFamily: "'Inter Tight', system-ui, sans-serif",
  fontSize: 10.5,
  letterSpacing: '0.10em',
  color: '#aed24a',
};

const tagDotStyle: CSSProperties = {
  width: 6,
  height: 6,
  background: '#aed24a',
  flex: 'none',
  boxShadow: '0 0 8px rgba(174,210,74,0.5)',
};

const h1Style: CSSProperties = {
  fontFamily: "'Inter Tight', system-ui, sans-serif",
  fontSize: 'clamp(26px, 7vw, 30px)',
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

const mascotHostStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 9,
  padding: '10px 0 16px',
  position: 'relative',
};

// Room strip
const roomStripStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  flexWrap: 'wrap',
  padding: '11px 14px',
  background: 'var(--pc-ink2)',
  border: '1px solid var(--pc-ink3)',
  borderRadius: 10,
};

const roomStripLblStyle: CSSProperties = {
  fontFamily: "'Inter Tight', system-ui, sans-serif",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: 'var(--pc-text3)',
  flex: 'none',
};

const roomStripCodeStyle: CSSProperties = {
  fontFamily: "'Inter Tight', system-ui, sans-serif",
  fontSize: 18,
  color: 'var(--pc-bone)',
  letterSpacing: '0.08em',
  lineHeight: 1,
  flex: 'none',
};

const roomStripSepStyle: CSSProperties = {
  color: 'var(--pc-text4)',
};

const roomStripNameStyle: CSSProperties = {
  fontFamily: "'Inter Tight', system-ui, sans-serif",
  fontSize: 13.5,
  color: 'var(--pc-text2)',
  lineHeight: 1.3,
  flex: 1,
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

// Form
const formStyle: CSSProperties = {
  marginTop: 16,
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
};

const fieldStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 7,
};

const fieldHStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  gap: 10,
};

const lblStyle: CSSProperties = {
  fontFamily: "'Inter Tight', system-ui, sans-serif",
  fontSize: 10.5,
  fontWeight: 700,
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: 'var(--pc-text3)',
  paddingLeft: 2,
  display: 'flex',
  alignItems: 'center',
  gap: 10,
};

const lblLineStyle: CSSProperties = {
  width: 16,
  height: 1,
  background: 'var(--pc-line2)',
  flex: 'none',
};

const optStyle: CSSProperties = {
  fontFamily: "'Inter Tight', system-ui, sans-serif",
  fontSize: 9.5,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'var(--pc-text4)',
  fontWeight: 600,
};

const inputStyle: CSSProperties = {
  height: 52,
  borderRadius: 10,
  background: 'var(--pc-ink2)',
  border: '1.5px solid var(--pc-line)',
  padding: '0 16px',
  fontFamily: "'Inter Tight', system-ui, sans-serif",
  fontSize: 15,
  width: '100%',
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
  marginTop: 4,
  boxShadow: '0 10px 28px rgba(124,77,255,0.32), inset 0 -2px 0 rgba(0,0,0,0.18)',
};

const ctaArrowStyle: CSSProperties = {
  fontFamily: "'Inter Tight', system-ui, sans-serif",
  fontSize: 18,
  lineHeight: 1,
};

const infoRowStyle: CSSProperties = {
  marginTop: 4,
  padding: '11px 14px',
  borderRadius: 10,
  background: 'rgba(124,77,255,0.06)',
  border: '1px solid rgba(124,77,255,0.25)',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
};

const infoRowTextStyle: CSSProperties = {
  fontFamily: "'Inter Tight', system-ui, sans-serif",
  fontSize: 13,
  color: 'var(--pc-text2)',
  lineHeight: 1.45,
};
