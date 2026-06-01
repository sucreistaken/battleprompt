'use client';

// StageWaiting — Story 1.10. Fixed 1920×1080 phase board for the
// "Waiting for players" room state. Lives inside StageFrame's StageScaler so
// it fits any projector viewport. Body text ≥ 24px in canvas coords (UX-DR17).
// QR card is pure white in both themes (UX-DR12).

import { QRCodeSVG } from 'qrcode.react';
import { C, STAGE_W, STAGE_H } from './atmosphere';
import { useI18n } from '@/components/client/i18nContext';

type Props = {
  roomCode: string;
  joinUrl: string;
};

export function StageWaiting({ roomCode, joinUrl }: Props) {
  const { t } = useI18n();

  return (
    <div
      style={{
        position: 'relative',
        width: STAGE_W,
        height: STAGE_H,
        background: C.ink,
        color: C.text,
        fontFamily: "'Inter Tight', system-ui, sans-serif",
        overflow: 'hidden',
        isolation: 'isolate'
      }}
    >
      {/* Background atmosphere — restrained accent bloom + faint pixel grid */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          zIndex: 0,
          pointerEvents: 'none',
          width: 1100,
          height: 1100,
          left: -200,
          top: -300,
          background:
            'radial-gradient(circle at center, rgba(124,77,255,0.12) 0%, rgba(124,77,255,0.03) 36%, transparent 60%)',
          filter: 'blur(8px)'
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          backgroundImage:
            'linear-gradient(rgba(124,77,255,0.028) 1px, transparent 1px), linear-gradient(90deg, rgba(124,77,255,0.028) 1px, transparent 1px)',
          backgroundSize: '54px 54px',
          maskImage:
            'radial-gradient(ellipse 62% 60% at 32% 42%, #000 28%, transparent 76%)'
        }}
      />

      {/* Top bar — wordmark + room chip */}
      <div
        style={{
          position: 'absolute',
          top: 56,
          left: 60,
          right: 60,
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div
          style={{
            // Stage'in projektör branding'i — Silkscreen pixel.
            fontFamily: "'Silkscreen', monospace",
            fontSize: 24,
            letterSpacing: '0.04em',
            color: C.bone
          }}
        >
          PROMPT CLASH
        </div>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            padding: '6px 14px',
            border: `1px solid ${C.line2}`,
            background: 'rgba(255,255,255,0.02)',
            borderRadius: 4
          }}
        >
          <span
            style={{
              fontFamily: "'Inter Tight', system-ui, sans-serif",
              fontSize: 13,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: C.text3
            }}
          >
            {t('stageRoomChipLabel')}
          </span>
          <span
            style={{
              fontFamily: "'Inter Tight', system-ui, sans-serif",
              fontSize: 18,
              color: C.bone,
              letterSpacing: '0.06em'
            }}
          >
            {roomCode}
          </span>
        </div>
        <div
          style={{
            fontFamily: "'Inter Tight', system-ui, sans-serif",
            fontSize: 13,
            color: C.text2,
            letterSpacing: '0.1em'
          }}
        >
          {t('stageFullscreenHint')}
        </div>
      </div>

      {/* Main grid — hero left, QR card right */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 10,
          display: 'grid',
          gridTemplateColumns: '1fr 560px',
          gap: 100,
          alignItems: 'center',
          padding: '140px 110px 100px'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <h1
            style={{
              // Projektör hero başlığı — Silkscreen pixel (120px arcade).
              fontFamily: "'Silkscreen', monospace",
              fontSize: 120,
              lineHeight: 0.96,
              color: C.bone,
              letterSpacing: '0.02em',
              fontWeight: 400,
              margin: 0
            }}
          >
            {t('stageWaitingHero1')}{' '}
            <span style={{ color: C.accent }}>{t('stageWaitingAccent')}</span>
            <br />
            {t('stageWaitingHero2')}
          </h1>
          <p
            style={{
              fontFamily: 'inherit',
              fontSize: 30,
              fontWeight: 500,
              lineHeight: 1.35,
              color: C.text2,
              maxWidth: 920,
              margin: 0
            }}
          >
            {t('stageWaitingLead')}
          </p>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: 24,
              marginTop: 8
            }}
          >
            <div
              style={{
                fontFamily: "'Inter Tight', system-ui, sans-serif",
                fontSize: 18,
                letterSpacing: '0.24em',
                textTransform: 'uppercase',
                color: C.text3,
                paddingBottom: 10
              }}
            >
              {t('stageRoomChipLabel')}
            </div>
            <div
              style={{
                fontFamily: "'Inter Tight', system-ui, sans-serif",
                fontSize: 140,
                color: C.accent,
                lineHeight: 1,
                letterSpacing: '0.04em'
              }}
            >
              {roomCode}
            </div>
          </div>
        </div>

        {/* QR card — pure white both themes per UX-DR12 */}
        <div
          style={{
            background: '#ffffff',
            color: '#0e0e10',
            border: '1px solid rgba(0,0,0,0.10)',
            padding: 34,
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            width: 520,
            alignSelf: 'center',
            justifySelf: 'end'
          }}
        >
          <div
            style={{
              fontFamily: "'Inter Tight', system-ui, sans-serif",
              fontSize: 18,
              letterSpacing: '0.06em',
              color: '#0e0e10'
            }}
          >
            {t('stageQrTitle')}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <QRCodeSVG value={joinUrl} size={360} level="M" includeMargin={false} />
          </div>
          <div
            style={{
              fontFamily: "'Inter Tight', system-ui, sans-serif",
              fontSize: 22,
              letterSpacing: '0.02em',
              textAlign: 'center',
              color: '#0e0e10',
              wordBreak: 'break-all'
            }}
          >
            {joinUrl}
          </div>
          <div
            style={{
              fontFamily: 'inherit',
              fontSize: 20,
              fontWeight: 600,
              color: '#3b3640',
              textAlign: 'center'
            }}
          >
            {t('stageQrInstruction')}
          </div>
        </div>
      </div>

      {/* Bottom strip — info line + announcement (visible) */}
      <div
        style={{
          position: 'absolute',
          left: 60,
          right: 60,
          bottom: 48,
          zIndex: 20,
          display: 'flex',
          justifyContent: 'space-between',
          fontFamily: "'Inter Tight', system-ui, sans-serif",
          fontSize: 16,
          color: C.text3,
          letterSpacing: '0.1em'
        }}
      >
        <span>v1 · 1920×1080 · StageScaler refit on resize</span>
        <span style={{ color: C.text }}>{t('stageAnnounceRoomReady')}</span>
      </div>
    </div>
  );
}
