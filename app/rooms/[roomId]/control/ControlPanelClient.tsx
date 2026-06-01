'use client';

// ControlPanelClient v2 — ported from mockups/room-control.html + room-control-mobile.html.
// Logic preserved: roomId/roomCode/roomName/audienceEnabled props from server,
// closeRoom POST + redirect, QR modal toggle.
//
// Visual changes vs v1:
// - Removed dual "oda paneli/Header h1" — now uses single head with "HOST" pill,
//   "Odan hazır." h1 and sub copy.
// - Inline room-strip (label + big pixel code + copy icon + QR button) replaces
//   the old Header's code-less wordmark.
// - InviteLinksCard kept for the link list (compact list, no panel chrome).
// - Standalone "Sahneyi yeni sekmede aç" primary CTA between invites and zones.
// - 3-zone → 2-zone grid: live (wide) + controls (narrow). History link below.
// - Live zone replaces ⏳ emoji with axolotl mascot + lime live-state pill +
//   player/audience counters.
// - Disabled controls dashed border; danger control kept; hint mono caps.

import { useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { I18nProvider, useI18n } from '@/components/client/i18nContext';
import { AppHeader } from '@/components/common/AppHeader';
import { BgAtmosphere } from '@/components/common/BgAtmosphere';
import { RolePill } from '@/components/common/RolePill';
import { MascotFrame } from '@/components/common/MascotFrame';
import { InviteLinksCard } from '@/components/room/InviteLinksCard';
import { QrModal } from '@/components/room/QrModal';

type Props = {
  roomId: string;
  roomCode: string;
  roomName: string;
  audienceEnabled: boolean;
  origin: string;
};

export function ControlPanelClient(props: Props) {
  return (
    <I18nProvider>
      <PanelBody {...props} />
    </I18nProvider>
  );
}

function PanelBody({ roomId, roomCode, roomName, audienceEnabled, origin }: Props) {
  const { t } = useI18n();
  const router = useRouter();
  const [qrOpen, setQrOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [closeErr, setCloseErr] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const playerInvite = `${origin}/join/${roomCode}`;
  const audienceInvite = `${origin}/watch/${roomCode}`;

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

  async function closeRoom() {
    if (!confirm(t('roomCloseConfirm'))) return;
    setClosing(true);
    setCloseErr(null);
    try {
      const res = await fetch(`/api/rooms/${roomId}/close`, { method: 'POST' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.ok) {
        setCloseErr(t('roomCloseFailed'));
        setClosing(false);
        return;
      }
      router.replace('/create-room');
    } catch {
      setCloseErr(t('roomCloseFailed'));
      setClosing(false);
    }
  }

  function openStage() {
    if (typeof window !== 'undefined') {
      window.open(`/rooms/${roomId}/stage`, '_blank', 'noopener');
    }
  }

  // Host kendi odasında oyuncu olarak da yarışabilsin. /join/{code} oyuncu
  // join akışına gider; yeni sekmede açılır ki control panel kaybolmasın.
  function joinAsPlayer() {
    if (typeof window !== 'undefined') {
      window.open(`/join/${roomCode}`, '_blank', 'noopener');
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
          padding: '16px 20px 40px',
        }}
      >
        <AppHeader right={<RolePill kind="host" label={t('roomRoleHost')} />} />

        {/* HEAD */}
        <section style={headStyle}>
          <h1 style={h1Style}>
            {t('roomReadyH1')} <span style={{ color: '#aed24a' }}>{t('roomReadyAc')}</span>
            {roomName ? <span style={roomNameInlineStyle}> · {roomName}</span> : null}
          </h1>
          <p style={subStyle}>{t('roomReadySub')}</p>

          {/* Room strip — label + pixel code + copy + QR */}
          <div style={roomStripStyle}>
            <span style={roomStripLblStyle}>
              <span aria-hidden="true" style={lblLineStyle} />
              {t('roomCodeLabel')}
            </span>
            <span style={roomStripCodeStyle}>{roomCode}</span>
            <div style={roomStripActionsStyle}>
              <button
                type="button"
                onClick={copyCode}
                aria-label={t('ariaCopyCode')}
                title={t('ariaCopyCode')}
                style={iconBtnStyle}
                className={copiedCode ? 'pc-copy pc-copy--ok' : 'pc-copy'}
              >
                <CopyGlyph />
              </button>
              <button
                type="button"
                onClick={() => setQrOpen(true)}
                style={qrBtnStyle}
                className="pc-qr-btn"
              >
                <QrGlyph />
                {t('roomQrShort')}
              </button>
            </div>
          </div>
        </section>

        {/* INVITE LIST — existing component preserved (its visual is acceptable; new outer chrome makes it feel coherent) */}
        <div style={sectionLabStyle}>
          <span aria-hidden="true" style={lblLineStyle} />
          {t('roomInvitesLabel')}
        </div>
        <InviteLinksCard
          roomCode={roomCode}
          roomId={roomId}
          origin={origin}
          onShowQr={() => setQrOpen(true)}
        />

        {/* PRIMARY ACTIONS — stage open + opsiyonel "ben de oynayım" */}
        <div className="pc-primary-actions" style={primaryActionsStyle}>
          <button type="button" onClick={openStage} style={stageCtaStyle} className="pc-stage-cta">
            <OpenExtGlyph />
            {t('roomStageCta')}
          </button>
          <button
            type="button"
            onClick={joinAsPlayer}
            style={joinAsPlayerCtaStyle}
            className="pc-join-self"
            title={t('roomJoinAsPlayerHint')}
          >
            <JoinSelfGlyph />
            {t('roomJoinAsPlayer')}
          </button>
        </div>

        {/* 2-ZONE: LIVE + CONTROLS */}
        <div className="pc-zones" style={zonesStyle}>
          <div>
            <div style={sectionLabStyle}>
              <span aria-hidden="true" style={lblLineStyle} />
              {t('roomZoneLive')}
            </div>
            <LiveZone />
          </div>

          <div>
            <div style={sectionLabStyle}>
              <span aria-hidden="true" style={lblLineStyle} />
              {t('roomZoneControls')}
            </div>
            <div style={ctrlsStyle}>
              <CtrlBtn label={t('roomCtrlStart')} hint={t('roomCtrlHintStart')} disabled />
              <CtrlBtn label={t('roomCtrlPause')} hint={t('roomCtrlHintMatch')} disabled />
              <CtrlBtn label={t('roomCtrlExtend')} hint={t('roomCtrlHintExtend')} disabled />
              <CtrlBtn label={t('roomCtrlRetryGen')} hint={t('roomCtrlHintRetry')} disabled />
              <CtrlBtn
                label={closing ? t('roomClosing') : t('roomCtrlClose')}
                hint={t('roomCtrlHintClose')}
                danger
                onClick={closeRoom}
                disabled={closing}
              />
            </div>
            {closeErr && (
              <div role="alert" style={errBoxStyle}>
                {closeErr}
              </div>
            )}
          </div>
        </div>

        {/* HISTORY LINK */}
        <button type="button" style={historyLinkStyle} className="pc-history">
          {t('roomHistoryLink')}{' '}
          <b
            style={{
              color: 'var(--pc-accent)',
              fontFamily: "'Inter Tight', system-ui, sans-serif",
              fontWeight: 400,
              letterSpacing: '0.04em',
            }}
          >
            · 0
          </b>
        </button>
      </div>

      <QrModal
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        playerInviteUrl={playerInvite}
        audienceInviteUrl={audienceInvite}
        audienceEnabled={audienceEnabled}
      />

      <style>{`
        .pc-copy { transition: border-color .14s, color .14s, background .14s, transform 80ms ease-out; }
        .pc-copy:hover { border-color: var(--pc-accent); color: var(--pc-bone); background: rgba(124,77,255,.10); }
        .pc-copy:active { transform: translateY(1px); }
        .pc-copy--ok { border-color: #aed24a; color: #aed24a; background: rgba(174,210,74,.10); }
        .pc-qr-btn { transition: border-color .14s, color .14s, transform 80ms ease-out; }
        .pc-qr-btn:hover { border-color: var(--pc-bone); color: var(--pc-bone); }
        .pc-qr-btn:active { transform: translateY(1px); }
        .pc-stage-cta { transition: transform .1s, box-shadow .16s; }
        .pc-stage-cta:hover { box-shadow: 0 14px 34px rgba(124,77,255,.42), inset 0 -2px 0 rgba(0,0,0,.18); }
        .pc-stage-cta:active { transform: translateY(1px); }
        .pc-join-self { transition: border-color .14s, color .14s, background .14s, transform 80ms ease-out; }
        .pc-join-self:hover { border-color: var(--pc-accent); background: rgba(124,77,255,.10); }
        .pc-join-self:active { transform: translateY(1px); }
        @media (min-width: 720px) {
          .pc-primary-actions { grid-template-columns: 1.4fr 1fr !important; }
        }
        .pc-history { transition: color .14s, border-color .14s, background .14s, transform 80ms ease-out; }
        .pc-history:hover { color: var(--pc-text); border-color: var(--pc-line); background: var(--pc-ink2); }
        .pc-history:active { transform: translateY(1px); }

        @media (min-width: 900px) {
          .pc-zones { grid-template-columns: 1.2fr .8fr !important; gap: 24px !important; }
        }
      `}</style>
    </div>
  );
}

// ─── Live zone (mascot + state pill + counters) ──────────────────────────────

function LiveZone() {
  const { t } = useI18n();
  return (
    <div style={liveStyle}>
      <MascotFrame size={104} mascotSize={84} variant="default" />
      <div style={liveStateStyle}>
        <span aria-hidden="true" style={liveStateDotStyle} />
        {t('roomLiveStateWait')}
      </div>
      <div style={liveHintStyle}>{t('roomLivePlaceholder')}</div>
      <div style={liveCountsStyle} aria-label={t('ariaCounters')}>
        <span style={liveCountStyle}>
          {t('roomLivePlayerLabel')} <b style={liveCountValStyle}>0/2</b>
        </span>
        <span style={liveCountStyle}>
          {t('roomLiveAudienceLabel')} <b style={liveCountValStyle}>0</b>
        </span>
      </div>
    </div>
  );
}

// ─── Control button ───────────────────────────────────────────────────────────

function CtrlBtn({
  label,
  hint,
  disabled,
  danger,
  onClick,
}: {
  label: string;
  hint?: string;
  disabled?: boolean;
  danger?: boolean;
  onClick?: () => void;
}) {
  const baseStyle: CSSProperties = {
    padding: '13px 14px',
    borderRadius: 10,
    background: 'var(--pc-ink2)',
    border: '1.5px solid var(--pc-line)',
    color: 'var(--pc-text)',
    textAlign: 'left',
    cursor: 'pointer',
    fontFamily: "'Inter Tight', system-ui, sans-serif",
    fontSize: 14,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    transition: 'border-color .14s, background .14s, color .14s',
  };
  const finalStyle: CSSProperties = disabled
    ? {
        ...baseStyle,
        color: 'var(--pc-text4)',
        background: 'transparent',
        cursor: 'not-allowed',
        borderColor: 'var(--pc-ink3)',
        borderStyle: 'dashed',
      }
    : danger
      ? {
          ...baseStyle,
          borderColor: 'rgba(255,92,92,0.35)',
          color: 'var(--pc-live)',
          background: 'rgba(255,92,92,0.04)',
        }
      : baseStyle;
  return (
    <button type="button" onClick={onClick} disabled={disabled} style={finalStyle}>
      <span>{label}</span>
      {hint ? (
        <span
          style={{
            fontFamily: "'Inter Tight', system-ui, sans-serif",
            fontSize: 9.5,
            fontWeight: 700,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--pc-text4)',
          }}
        >
          {hint}
        </span>
      ) : null}
    </button>
  );
}

// ─── Glyphs ───────────────────────────────────────────────────────────────────

function CopyGlyph() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function QrGlyph() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}

function OpenExtGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 17l10-10" />
      <path d="M17 7H7M17 7v10" />
    </svg>
  );
}

function JoinSelfGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M19 8v6M22 11h-6" />
    </svg>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const headStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  padding: '18px 0 14px',
};

const h1Style: CSSProperties = {
  fontFamily: "'Inter Tight', system-ui, sans-serif",
  fontSize: 'clamp(22px, 5vw, 26px)',
  fontWeight: 700,
  color: 'var(--pc-bone)',
  lineHeight: 1.2,
  margin: 0,
};

const roomNameInlineStyle: CSSProperties = {
  fontFamily: "'Inter Tight', system-ui, sans-serif",
  fontSize: '0.7em',
  fontWeight: 500,
  color: 'var(--pc-text3)',
  letterSpacing: 0,
};

const subStyle: CSSProperties = {
  fontFamily: "'Inter Tight', system-ui, sans-serif",
  fontSize: 14,
  color: 'var(--pc-text2)',
  lineHeight: 1.5,
  margin: 0,
  maxWidth: '54ch',
};

// Room strip
const roomStripStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  flexWrap: 'wrap',
  marginTop: 6,
  padding: '14px 16px',
  background: 'var(--pc-ink2)',
  border: '1.5px solid var(--pc-line)',
  borderRadius: 10,
};

const roomStripLblStyle: CSSProperties = {
  fontFamily: "'Inter Tight', system-ui, sans-serif",
  fontSize: 10.5,
  fontWeight: 700,
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: 'var(--pc-text3)',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  flex: 'none',
};

const lblLineStyle: CSSProperties = {
  width: 14,
  height: 1,
  background: 'var(--pc-line2)',
  flex: 'none',
};

const roomStripCodeStyle: CSSProperties = {
  fontFamily: "'Inter Tight', system-ui, sans-serif",
  fontSize: 'clamp(28px, 6.5vw, 36px)',
  color: 'var(--pc-bone)',
  letterSpacing: '0.10em',
  lineHeight: 1,
  flex: 1,
  minWidth: 0,
};

const roomStripActionsStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  flex: 'none',
};

const iconBtnStyle: CSSProperties = {
  width: 42,
  height: 42,
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

const qrBtnStyle: CSSProperties = {
  height: 42,
  padding: '0 14px',
  background: 'transparent',
  border: '1.5px solid var(--pc-line)',
  borderRadius: 8,
  color: 'var(--pc-text2)',
  cursor: 'pointer',
  fontFamily: "'Inter Tight', system-ui, sans-serif",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 7,
};

// Section label
const sectionLabStyle: CSSProperties = {
  fontFamily: "'Inter Tight', system-ui, sans-serif",
  fontSize: 10.5,
  fontWeight: 700,
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: 'var(--pc-text3)',
  padding: '0 2px',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  margin: '18px 0 8px',
};

// Primary actions row — stage cta + opsiyonel "ben de oynayım" (host kendi
// odasında oyuncu olarak da girebilir). ≥720px yan yana, daha darda alt alta.
const primaryActionsStyle: CSSProperties = {
  marginTop: 10,
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: 10,
};

// Stage CTA
const stageCtaStyle: CSSProperties = {
  width: '100%',
  minHeight: 58,
  borderRadius: 10,
  border: 'none',
  cursor: 'pointer',
  background: 'var(--pc-accent)',
  color: '#fff',
  fontFamily: "'Inter Tight', system-ui, sans-serif",
  fontSize: 15.5,
  fontWeight: 800,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  boxShadow: '0 10px 26px rgba(124,77,255,0.30), inset 0 -2px 0 rgba(0,0,0,0.18)',
};

// Secondary CTA — host'un kendi odasına oyuncu olarak girmesi için. Tonlama:
// outlined accent (ana CTA dolgun mor; bu hafif). Lime kullanmıyorum çünkü
// audience tonu lime, oyuncu girişi mor/accent.
const joinAsPlayerCtaStyle: CSSProperties = {
  width: '100%',
  minHeight: 54,
  borderRadius: 10,
  cursor: 'pointer',
  background: 'transparent',
  color: 'var(--pc-bone)',
  border: '1.5px solid rgba(124,77,255,0.55)',
  fontFamily: "'Inter Tight', system-ui, sans-serif",
  fontSize: 14.5,
  fontWeight: 700,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  letterSpacing: '0.01em',
};

// Zones (default 1 col; desktop 2 col via media query)
const zonesStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: 16,
  marginTop: 22,
};

// Live zone
const liveStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  minHeight: 280,
  padding: '24px 18px',
  gap: 12,
  background: 'var(--pc-ink2)',
  border: '1.5px solid var(--pc-line)',
  borderRadius: 10,
  position: 'relative',
  overflow: 'hidden',
};

const liveStateStyle: CSSProperties = {
  fontFamily: "'Inter Tight', system-ui, sans-serif",
  fontSize: 14,
  letterSpacing: '0.06em',
  color: 'var(--pc-bone)',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
};

const liveStateDotStyle: CSSProperties = {
  width: 6,
  height: 6,
  background: '#aed24a',
  boxShadow: '0 0 8px rgba(174,210,74,0.7)',
  display: 'inline-block',
};

const liveHintStyle: CSSProperties = {
  fontFamily: "'Inter Tight', system-ui, sans-serif",
  fontSize: 13,
  color: 'var(--pc-text3)',
  lineHeight: 1.5,
  maxWidth: '36ch',
};

const liveCountsStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  marginTop: 4,
  fontFamily: "'Inter Tight', system-ui, sans-serif",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--pc-text3)',
};

const liveCountStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '5px 10px',
  border: '1px solid var(--pc-ink3)',
  borderRadius: 6,
};

const liveCountValStyle: CSSProperties = {
  fontFamily: "'Inter Tight', system-ui, sans-serif",
  fontSize: 12,
  color: 'var(--pc-bone)',
  fontWeight: 400,
  letterSpacing: '0.04em',
};

// Controls
const ctrlsStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
};

const errBoxStyle: CSSProperties = {
  marginTop: 12,
  padding: '10px 14px',
  background: 'rgba(255,92,92,0.12)',
  border: '1px solid rgba(255,92,92,0.4)',
  borderRadius: 8,
  color: '#ffb0b0',
  fontSize: 13,
  fontFamily: "'Inter Tight', system-ui, sans-serif",
};

// History link
const historyLinkStyle: CSSProperties = {
  marginTop: 16,
  width: '100%',
  padding: '12px 14px',
  textAlign: 'center',
  fontFamily: "'Inter Tight', system-ui, sans-serif",
  fontSize: 10.5,
  fontWeight: 700,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'var(--pc-text3)',
  background: 'transparent',
  border: '1px dashed var(--pc-ink3)',
  borderRadius: 8,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
};
