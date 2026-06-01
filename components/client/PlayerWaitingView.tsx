'use client';

// Player Lobby v2 — ported from mockups/player-waiting.html + player-waiting-mobile.html.
// Shown to player A while phase is PLAYER_1_JOINED (room exists, you're solo).
//
// Layout: head + AI Hakem mascot stage + Me/VS/Opp slots + code-field + share CTA
// + inline QR + audience link. On desktop ≥900px flips to 2-col grid: action stack
// on the left, big mascot on the right (landing-v2 rhythm).
//
// Logic preserved: roomCode + joinUrl derivation, copyCode/copyLink/shareInvite/
// shareAudience handlers, useGameState binding, useStageTheme sync.

import { useEffect, useState, type CSSProperties } from 'react';
import { useGameState } from './useGameState';
import { useI18n } from './i18nContext';
import { useStageTheme } from '@/components/stage/atmosphere';
import { AppHeader } from '@/components/common/AppHeader';
import { BackLink } from '@/components/common/BackLink';
import { BgAtmosphere } from '@/components/common/BgAtmosphere';
import { MascotFrame } from '@/components/common/MascotFrame';
import { QRCodeBlock } from '@/components/common/QRCodeBlock';

export function PlayerWaitingView() {
  const { state, mySlot } = useGameState();
  const { t } = useI18n();
  useStageTheme(state?.stageTheme);
  const [origin, setOrigin] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') setOrigin(window.location.origin);
  }, []);

  const roomCode = state?.roomCode || '';
  const joinUrl = origin && roomCode ? `${origin}/join/${roomCode}` : '';
  const watchUrl = origin && roomCode ? `${origin}/watch/${roomCode}` : '';
  const youSlot = mySlot || 'A';
  const youNick = state?.players?.[youSlot]?.nickname || '—';
  const oppSlot: 'A' | 'B' = youSlot === 'A' ? 'B' : 'A';
  const oppNick = state?.players?.[oppSlot]?.nickname;
  const oppJoined = !!oppNick;

  async function copyCode() {
    if (!roomCode) return;
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 1400);
    } catch {
      /* ignore */
    }
  }

  async function shareInvite() {
    if (!joinUrl) return;
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({
          url: joinUrl,
          title: 'Prompt Clash',
          text: t('waitingShareInvite'),
        });
        return;
      } catch {
        /* fall through to clipboard */
      }
    }
    try {
      await navigator.clipboard.writeText(joinUrl);
    } catch {
      /* ignore */
    }
  }

  async function shareAudience() {
    if (!watchUrl) return;
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({ url: watchUrl, title: 'Prompt Clash' });
        return;
      } catch {
        /* fall through */
      }
    }
    try {
      await navigator.clipboard.writeText(watchUrl);
    } catch {
      /* ignore */
    }
  }

  return (
    <div style={{ minHeight: '100dvh', position: 'relative', overflowX: 'hidden' }}>
      <BgAtmosphere variant="default" />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 1100,
          margin: '0 auto',
          padding: '14px 18px 32px',
        }}
      >
        <AppHeader right={<BackLink href="/" label={t('back')} />} />

        <div className="pc-lobby-stage" style={stageStyle}>
          <section className="pc-lobby-head" style={headStyle}>
            <span style={tagStyle}>
              <span aria-hidden="true" style={tagDotStyle} />
              {t('waitingTag')}
            </span>
            <h1 style={h1Style}>{t('waitingTitle')}</h1>
            <p style={subStyle}>{t('waitingSub')}</p>
          </section>

          <section className="pc-lobby-mascot" style={mascotHostStyle} aria-label={t('ariaMascot')}>
            <MascotFrame
              size={120}
              variant="default"
              particles
              label={t('waitingMascotLabel')}
              sub={t('waitingMascotSub')}
            />
          </section>

          <section className="pc-lobby-slots" style={slotsStyle} aria-label={t('ariaPlayers')}>
            <SlotCard role="me" label={t('waitingYouLabel')} slot={youSlot} name={youNick} />
            <div style={vsStyle} aria-hidden="true">{t('waitingVs')}</div>
            <SlotCard
              role="opp"
              label={t('waitingOpponentLabel')}
              slot={oppSlot}
              name={oppJoined ? oppNick! : null}
              waitingLabel={t('waitingOpponentWait')}
              joined={oppJoined}
            />
          </section>

          <section className="pc-lobby-invite" style={inviteSectionStyle} aria-label={t('ariaInvite')}>
            {/* Code with copy + toast */}
            <div style={codeBlockStyle}>
              <label htmlFor="pc-room-code" style={codeLabelStyle}>
                <span aria-hidden="true" style={codeLabelLineStyle} />
                {t('waitingCodeLabel')}
              </label>
              <div style={codeFieldStyle}>
                <span id="pc-room-code" style={codeValueStyle}>
                  {roomCode || '——————'}
                </span>
                <div style={copySlotStyle}>
                  <button
                    type="button"
                    onClick={copyCode}
                    disabled={!roomCode}
                    aria-label={t('waitingCodeCopyAria')}
                    style={copyBtnStyle}
                    className={copiedCode ? 'pc-copy pc-copy--ok' : 'pc-copy'}
                  >
                    <CopyGlyph />
                  </button>
                  <span
                    role="status"
                    aria-live="polite"
                    style={{ ...copyToastStyle, ...(copiedCode ? copyToastVisibleStyle : null) }}
                  >
                    {t('waitingShareCopied')}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={shareInvite}
              disabled={!joinUrl}
              aria-label={t('waitingShareInviteAria')}
              style={shareCtaStyle}
              className="pc-share-cta"
            >
              <ShareGlyph />
              {t('waitingShareInvite')}
            </button>

            <div style={qrRowStyle}>
              {joinUrl ? (
                <QRCodeBlock value={joinUrl} size={92} />
              ) : (
                <div style={{ width: 92, height: 92, background: 'var(--pc-ink2)' }} />
              )}
              <div style={qrMetaStyle}>
                <span style={qrHStyle}>
                  <span aria-hidden="true" style={codeLabelLineStyle} />
                  {t('waitingQrH')}
                </span>
                <span style={qrHostStyle}>{joinUrl || '—'}</span>
              </div>
            </div>
          </section>

          <section className="pc-lobby-audience" style={audSecStyle}>
            <button
              type="button"
              onClick={shareAudience}
              disabled={!watchUrl}
              aria-label={t('waitingAudShareAria')}
              style={audLinkStyle}
              className="pc-aud-link"
            >
              <EyeGlyph />
              {t('waitingAudShare')}
            </button>
          </section>
        </div>
      </div>

      <style>{`
        .pc-copy { transition: border-color .14s, color .14s, background .14s; }
        .pc-copy:hover { border-color: var(--pc-accent); color: var(--pc-bone); background: rgba(124,77,255,.10); }
        .pc-copy--ok { border-color: #aed24a; color: #aed24a; background: rgba(174,210,74,.10); }
        .pc-share-cta { transition: transform .1s, box-shadow .16s; }
        .pc-share-cta:hover { box-shadow: 0 14px 36px rgba(124,77,255,.44), inset 0 -2px 0 rgba(0,0,0,.18); }
        .pc-share-cta:active { transform: translateY(1px); }
        .pc-aud-link { transition: color .14s, background .14s; }
        .pc-aud-link:hover { color: var(--pc-text); background: var(--pc-ink2); }
        @media(prefers-reduced-motion:reduce){ .pc-share-cta, .pc-copy { transition: none; } }

        /* Desktop ≥900px: 2-col grid, mascot on the right column */
        @media (min-width: 900px) {
          .pc-lobby-stage {
            display: grid !important;
            grid-template-columns: 1fr .85fr !important;
            grid-template-rows: auto auto auto auto !important;
            column-gap: 56px !important;
            row-gap: 0 !important;
            align-items: start !important;
          }
          .pc-lobby-head { grid-column: 1 !important; grid-row: 1 !important; padding: 14px 0 12px !important; }
          .pc-lobby-slots { grid-column: 1 !important; grid-row: 2 !important; }
          .pc-lobby-invite { grid-column: 1 !important; grid-row: 3 !important; margin-top: 18px !important; }
          .pc-lobby-audience { grid-column: 1 !important; grid-row: 4 !important; justify-content: flex-start !important; margin-top: 14px !important; padding-top: 12px !important; }
          .pc-lobby-mascot { grid-column: 2 !important; grid-row: 1 / 5 !important; align-self: center !important; padding: 0 !important; min-height: 480px !important; }
        }
      `}</style>
    </div>
  );
}

// ─── Slot card ────────────────────────────────────────────────────────────────

function SlotCard({
  role,
  label,
  slot,
  name,
  waitingLabel,
  joined = false,
}: {
  role: 'me' | 'opp';
  label: string;
  slot: 'A' | 'B';
  name: string | null;
  waitingLabel?: string;
  joined?: boolean;
}) {
  const isMe = role === 'me';
  const opStyle: CSSProperties = isMe
    ? { borderColor: 'var(--pc-accent)', boxShadow: 'inset 0 -2px 0 rgba(124,77,255,0.28)' }
    : joined
      ? {
          borderColor: '#aed24a',
          borderStyle: 'solid',
          boxShadow: 'inset 0 -2px 0 rgba(174,210,74,0.28)',
        }
      : { borderColor: 'var(--pc-line2)', borderStyle: 'dashed' };
  return (
    <div style={{ ...slotBaseStyle, ...opStyle }}>
      <span
        aria-hidden="true"
        style={{
          ...avaBaseStyle,
          background: isMe ? 'var(--pc-accent)' : 'var(--pc-ink3)',
          color: isMe ? '#fff' : 'var(--pc-text3)',
          border: isMe ? undefined : '1px solid var(--pc-line)',
          boxShadow: isMe
            ? 'inset 0 -3px 0 #5a35cc, inset 0 1px 0 rgba(255,255,255,0.18)'
            : 'inset 0 -3px 0 rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.04)',
        }}
      >
        {isMe || joined ? slot : '?'}
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <span style={{ ...slotLabelStyle, color: isMe ? 'var(--pc-accent)' : '#aed24a' }}>
          {label}
        </span>
        {name ? (
          <span style={slotNameStyle}>{name}</span>
        ) : (
          <span style={slotWaitStyle} aria-live="polite">
            {waitingLabel ?? ''}
            <span style={dotsStyle} aria-hidden="true">…</span>
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Glyphs ───────────────────────────────────────────────────────────────────

function ShareGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 12v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8" />
      <path d="M16 6l-4-4-4 4" />
      <path d="M12 2v14" />
    </svg>
  );
}

function CopyGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function EyeGlyph() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ opacity: 0.85 }}>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const stageStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
};

const headStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 9,
  padding: '18px 0 12px',
};

const tagStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  alignSelf: 'flex-start',
  gap: 8,
  padding: '4px 10px',
  borderRadius: 999,
  background: 'rgba(174,210,74,0.08)',
  border: '1px solid rgba(174,210,74,0.30)',
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
  lineHeight: 1.15,
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
  padding: '12px 0 18px',
  position: 'relative',
};

// Slots
const slotsStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr auto 1fr',
  gap: 8,
  alignItems: 'stretch',
};

const slotBaseStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '11px 12px',
  background: 'var(--pc-ink2)',
  border: '1.5px solid var(--pc-line)',
  borderRadius: 10,
  minWidth: 0,
  position: 'relative',
};

const avaBaseStyle: CSSProperties = {
  width: 38,
  height: 38,
  flex: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: "'Inter Tight', system-ui, sans-serif",
  fontSize: 16,
  letterSpacing: '0.04em',
  borderRadius: 3,
  imageRendering: 'pixelated',
};

const slotLabelStyle: CSSProperties = {
  fontFamily: "'Inter Tight', system-ui, sans-serif",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
};

const slotNameStyle: CSSProperties = {
  fontFamily: "'Inter Tight', system-ui, sans-serif",
  fontSize: 14,
  fontWeight: 700,
  color: 'var(--pc-bone)',
  lineHeight: 1.2,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const slotWaitStyle: CSSProperties = {
  fontFamily: "'Inter Tight', system-ui, sans-serif",
  fontSize: 11.5,
  color: 'var(--pc-text3)',
  lineHeight: 1.2,
  letterSpacing: '0.06em',
};

const dotsStyle: CSSProperties = {
  display: 'inline-block',
  width: 14,
  marginLeft: 1,
};

const vsStyle: CSSProperties = {
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

// Invite section
const inviteSectionStyle: CSSProperties = {
  marginTop: 16,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};

const codeBlockStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

const codeLabelStyle: CSSProperties = {
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

const codeLabelLineStyle: CSSProperties = {
  width: 16,
  height: 1,
  background: 'var(--pc-line2)',
  flex: 'none',
};

const codeFieldStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  padding: '14px 16px',
  background: 'var(--pc-ink2)',
  border: '1.5px solid var(--pc-line)',
  borderRadius: 10,
};

const codeValueStyle: CSSProperties = {
  fontFamily: "'Inter Tight', system-ui, sans-serif",
  fontSize: 'clamp(32px, 9vw, 40px)',
  color: 'var(--pc-bone)',
  letterSpacing: '0.10em',
  lineHeight: 1,
  minWidth: 0,
};

const copySlotStyle: CSSProperties = {
  position: 'relative',
  flex: 'none',
};

const copyBtnStyle: CSSProperties = {
  width: 44,
  height: 44,
  padding: 0,
  background: 'transparent',
  border: '1.5px solid var(--pc-line)',
  borderRadius: 8,
  color: 'var(--pc-text2)',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const copyToastStyle: CSSProperties = {
  position: 'absolute',
  right: 0,
  bottom: 'calc(100% + 8px)',
  padding: '5px 9px',
  borderRadius: 4,
  background: '#aed24a',
  color: '#0e0e10',
  fontFamily: "'Inter Tight', system-ui, sans-serif",
  fontSize: 10,
  letterSpacing: '0.08em',
  whiteSpace: 'nowrap',
  pointerEvents: 'none',
  opacity: 0,
  transform: 'translateY(4px)',
  transition: 'opacity .16s ease-out, transform .16s ease-out',
  boxShadow: '0 6px 18px rgba(174,210,74,0.30)',
};

const copyToastVisibleStyle: CSSProperties = {
  opacity: 1,
  transform: 'translateY(0)',
};

// Primary share CTA
const shareCtaStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  width: '100%',
  minHeight: 60,
  borderRadius: 10,
  background: 'var(--pc-accent)',
  color: '#fff',
  border: 'none',
  fontFamily: "'Inter Tight', system-ui, sans-serif",
  fontSize: 15.5,
  fontWeight: 800,
  letterSpacing: '0.005em',
  cursor: 'pointer',
  boxShadow: '0 10px 26px rgba(124,77,255,0.30), inset 0 -2px 0 rgba(0,0,0,0.18)',
};

// QR row (inline, no panel)
const qrRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  padding: '6px 2px 0',
};

const qrMetaStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 5,
  minWidth: 0,
  flex: 1,
};

const qrHStyle: CSSProperties = {
  fontFamily: "'Inter Tight', system-ui, sans-serif",
  fontSize: 10.5,
  fontWeight: 700,
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: 'var(--pc-text3)',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
};

const qrHostStyle: CSSProperties = {
  fontFamily: "'Inter Tight', system-ui, sans-serif",
  fontSize: 12,
  color: 'var(--pc-text2)',
  wordBreak: 'break-all',
  lineHeight: 1.4,
};

// Audience link
const audSecStyle: CSSProperties = {
  marginTop: 18,
  paddingTop: 14,
  borderTop: '1px dashed var(--pc-ink3)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const audLinkStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 12px',
  borderRadius: 6,
  background: 'transparent',
  border: 'none',
  color: 'var(--pc-text3)',
  fontFamily: "'Inter Tight', system-ui, sans-serif",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  cursor: 'pointer',
};
