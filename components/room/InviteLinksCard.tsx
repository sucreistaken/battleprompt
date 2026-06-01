'use client';

// InviteLinksCard — Story 1.9. "Your Room is Ready" success area with 4
// clipboard rows (player invite / audience invite / stage link / open stage
// in new tab). QR modal trigger lives in the parent panel. Design tokens
// consumed via the same CSS variables atmosphere.tsx uses.

import { useState, type CSSProperties } from 'react';
import { useI18n } from '@/components/client/i18nContext';

type Props = {
  roomCode: string;
  origin: string;
  roomId: string;
  onShowQr?: () => void;
};

export function InviteLinksCard({ roomCode, origin, roomId, onShowQr }: Props) {
  const { t } = useI18n();
  const playerInvite = `${origin}/join/${roomCode}`;
  const audienceInvite = `${origin}/watch/${roomCode}`;
  const stageUrl = `${origin}/rooms/${roomId}/stage`;

  const row: CSSProperties = {
    background: 'var(--pc-ink2)',
    border: '1px solid var(--pc-line)',
    borderRadius: 14,
    padding: '14px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    minWidth: 0
  };
  const lblStyle: CSSProperties = {
    fontFamily: "'Inter Tight', system-ui, sans-serif",
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: 'var(--pc-text3)'
  };
  const urlStyle: CSSProperties = {
    fontFamily: "'Inter Tight', system-ui, sans-serif",
    fontSize: 13,
    color: 'var(--pc-text)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <style>{`
        .pc-invite-qr:hover { opacity: .92; }
        .pc-invite-qr:active { transform: translateY(1px); }
        .pc-invite-copy:hover { border-color: var(--pc-accent) !important; color: var(--pc-bone) !important; background: rgba(124,77,255,.08) !important; }
        .pc-invite-copy:active { transform: translateY(1px); }
        .pc-invite-open:hover { border-color: var(--pc-bone); color: var(--pc-bone); background: var(--pc-ink2); }
        .pc-invite-open:active { transform: translateY(1px); }
      `}</style>
      <div
        style={{
          background:
            'linear-gradient(180deg, rgba(124,77,255,0.10), rgba(124,77,255,0))',
          border: '1px solid var(--pc-accent)',
          borderRadius: 20,
          padding: '24px 28px',
          display: 'grid',
          gridTemplateColumns: 'auto 1fr auto',
          gap: 28,
          alignItems: 'center'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={lblStyle}>{t('roomCodeLabel')}</span>
          <span
            style={{
              fontFamily: "'Inter Tight', system-ui, sans-serif",
              fontSize: 48,
              color: 'var(--pc-bone)',
              letterSpacing: '0.04em',
              lineHeight: 1
            }}
          >
            {roomCode}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--pc-bone)' }}>
            {t('roomReadyTtl')}
          </span>
          <span style={{ fontSize: 13, color: 'var(--pc-text2)', lineHeight: 1.5 }}>
            {t('roomReadyDesc')}
          </span>
        </div>
        {onShowQr ? (
          <button
            type="button"
            onClick={onShowQr}
            className="pc-invite-qr"
            style={{
              padding: '12px 20px',
              background: 'var(--pc-bone)',
              color: 'var(--pc-ink)',
              border: 'none',
              borderRadius: 14,
              fontFamily: 'inherit',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              transition: 'transform 80ms ease-out, opacity .14s',
            }}
          >
            📱 {t('roomShowQr')}
          </button>
        ) : null}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        <CopyRow
          label={t('roomInvitePlayer')}
          url={playerInvite}
          rowStyle={row}
          lblStyle={lblStyle}
          urlStyle={urlStyle}
        />
        <CopyRow
          label={t('roomInviteAudience')}
          url={audienceInvite}
          rowStyle={row}
          lblStyle={lblStyle}
          urlStyle={urlStyle}
        />
        <CopyRow
          label={t('roomInviteStage')}
          url={stageUrl}
          rowStyle={row}
          lblStyle={lblStyle}
          urlStyle={urlStyle}
        />
        <OpenRow
          label={t('roomOpenStage')}
          url={stageUrl}
          rowStyle={row}
          lblStyle={lblStyle}
          urlStyle={urlStyle}
        />
      </div>
    </div>
  );
}

function CopyRow({
  label,
  url,
  rowStyle,
  lblStyle,
  urlStyle
}: {
  label: string;
  url: string;
  rowStyle: CSSProperties;
  lblStyle: CSSProperties;
  urlStyle: CSSProperties;
}) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Fallback: select-into-textarea path is overkill for the Phase-1 host
      // panel (always served over HTTPS in prod). Silent no-op.
    }
  }
  return (
    <div style={rowStyle}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
        <span style={lblStyle}>{label}</span>
        <span style={urlStyle}>{url}</span>
      </div>
      <button
        type="button"
        onClick={copy}
        className="pc-invite-copy"
        style={{
          padding: '8px 14px',
          border: `1px solid ${copied ? 'var(--pc-accent)' : 'var(--pc-line2)'}`,
          background: 'transparent',
          color: copied ? 'var(--pc-accent)' : 'var(--pc-text)',
          borderRadius: 10,
          fontFamily: "'Inter Tight', system-ui, sans-serif",
          fontSize: 11,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'border-color .14s, color .14s, background .14s, transform 80ms ease-out',
          minHeight: 36,
        }}
      >
        {copied ? `${t('roomCopied')} ✓` : t('roomCopy')}
      </button>
    </div>
  );
}

function OpenRow({
  label,
  url,
  rowStyle,
  lblStyle,
  urlStyle
}: {
  label: string;
  url: string;
  rowStyle: CSSProperties;
  lblStyle: CSSProperties;
  urlStyle: CSSProperties;
}) {
  const { t } = useI18n();
  return (
    <div style={rowStyle}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
        <span style={lblStyle}>{label}</span>
        <span style={{ ...urlStyle, color: 'var(--pc-text3)' }}>{t('roomOpenStageDesc')}</span>
      </div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="pc-invite-open"
        style={{
          padding: '8px 14px',
          border: '1px solid var(--pc-line2)',
          background: 'transparent',
          color: 'var(--pc-text)',
          borderRadius: 10,
          fontFamily: "'Inter Tight', system-ui, sans-serif",
          fontSize: 11,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          fontWeight: 600,
          textDecoration: 'none',
          transition: 'border-color .14s, color .14s, background .14s, transform 80ms ease-out',
          minHeight: 36,
          display: 'inline-flex',
          alignItems: 'center',
        }}
      >
        ↗ {t('roomOpenStageBtn')}
      </a>
    </div>
  );
}

