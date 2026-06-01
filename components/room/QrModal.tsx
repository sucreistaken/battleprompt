'use client';

// QrModal — Story 1.9. Two-tab QR modal (player invite + audience invite).
// QR card stays pure white in both themes per UX-DR12.

import { useState, type CSSProperties } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useI18n } from '@/components/client/i18nContext';

type Props = {
  open: boolean;
  onClose: () => void;
  playerInviteUrl: string;
  audienceInviteUrl: string;
  audienceEnabled?: boolean;
};

export function QrModal({
  open,
  onClose,
  playerInviteUrl,
  audienceInviteUrl,
  audienceEnabled = true
}: Props) {
  const { t } = useI18n();
  const [tab, setTab] = useState<'player' | 'audience'>('player');
  if (!open) return null;
  const activeUrl = tab === 'player' ? playerInviteUrl : audienceInviteUrl;

  const overlay: CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.66)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 20
  };
  const panel: CSSProperties = {
    background: 'var(--pc-ink)',
    border: '1px solid var(--pc-line)',
    borderRadius: 20,
    padding: 28,
    width: '100%',
    maxWidth: 460,
    display: 'flex',
    flexDirection: 'column',
    gap: 20
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('roomQrModalTitle')}
      style={overlay}
      onClick={onClose}
    >
      <div style={panel} onClick={(e) => e.stopPropagation()}>
        <style>{`
          .pc-modal-close:hover { border-color: var(--pc-bone); color: var(--pc-bone); background: var(--pc-ink2); }
          .pc-modal-close:active { transform: translateY(1px); }
          .pc-modal-tab { transition: background .14s, color .14s, box-shadow .14s, transform 80ms ease-out; }
          .pc-modal-tab:not([aria-selected=true]):not(:disabled):hover { background: rgba(124,77,255,.08); color: var(--pc-bone); }
          .pc-modal-tab:not(:disabled):active { transform: translateY(1px); }
        `}</style>
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <h2
            style={{
              fontFamily: "'Inter Tight', system-ui, sans-serif",
              fontSize: 20,
              letterSpacing: '0.04em',
              color: 'var(--pc-bone)',
              fontWeight: 400
            }}
          >
            {t('roomQrModalTitle')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('close')}
            className="pc-modal-close"
            style={{
              background: 'transparent',
              border: '1px solid var(--pc-line)',
              color: 'var(--pc-text2)',
              borderRadius: 999,
              width: 36,
              height: 36,
              cursor: 'pointer',
              fontSize: 14,
              transition: 'border-color .14s, color .14s, background .14s, transform 80ms ease-out',
            }}
          >
            ✕
          </button>
        </header>

        {/* Tab strip */}
        <div
          role="tablist"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 6,
            background: 'var(--pc-ink2)',
            border: '1px solid var(--pc-line)',
            borderRadius: 12,
            padding: 4
          }}
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'player'}
            onClick={() => setTab('player')}
            className="pc-modal-tab"
            style={tabStyle(tab === 'player')}
          >
            {t('roomQrTabPlayer')}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'audience'}
            disabled={!audienceEnabled}
            onClick={() => setTab('audience')}
            className="pc-modal-tab"
            style={{
              ...tabStyle(tab === 'audience'),
              opacity: audienceEnabled ? 1 : 0.4,
              cursor: audienceEnabled ? 'pointer' : 'not-allowed'
            }}
          >
            {t('roomQrTabAudience')}
          </button>
        </div>

        {/* Pure-white QR card (theme-invariant per UX-DR12) */}
        <div
          style={{
            background: '#ffffff',
            color: '#0e0e10',
            border: '1px solid rgba(0,0,0,0.08)',
            padding: 28,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            alignItems: 'center',
            borderRadius: 16
          }}
        >
          <QRCodeSVG value={activeUrl} size={220} level="M" includeMargin={false} />
          <div
            style={{
              fontFamily: "'Inter Tight', system-ui, sans-serif",
              fontSize: 13,
              color: '#0e0e10',
              wordBreak: 'break-all',
              textAlign: 'center'
            }}
          >
            {activeUrl}
          </div>
        </div>
      </div>
    </div>
  );
}

function tabStyle(active: boolean): CSSProperties {
  return {
    background: active ? 'var(--pc-accent)' : 'transparent',
    color: active ? '#fff' : 'var(--pc-text2)',
    border: 'none',
    borderRadius: 8,
    padding: '10px 0',
    fontFamily: 'inherit',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer'
  };
}
