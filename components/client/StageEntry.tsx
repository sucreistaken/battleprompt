'use client';

import { useEffect, useState } from 'react';
import { useGameState } from './useGameState';
import { useI18n } from './i18nContext';
import { useJoin } from './useJoin';
import { C, FONT, PixelText, StageQR, StageFonts, Avatar, Lbl } from '@/components/stage/atmosphere';

/**
 * Root entry (IDLE / PLAYER_1_JOINED) — the broadcast stage's dark + pixel look,
 * but a real responsive layout (not the fixed 1920x1080 scaled canvas), so it
 * fits any device. You can join right here (nickname + Katıl) or scan the QR.
 * Two columns on >=lg (text+form | QR), stacked on phones. Reuses the stage
 * palette (C/FONT), PixelText, StageQR, and StageFonts for the Silkscreen face.
 */
export function StageEntry() {
  const { state } = useGameState();
  const { t } = useI18n();
  const { nickname, setNickname, error, submitting, canSubmit, handleSubmit } = useJoin();

  const [origin, setOrigin] = useState('');
  const [host, setHost] = useState('');
  const [qrSize, setQrSize] = useState(200);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setOrigin(window.location.origin);
    setHost(window.location.host);
    const fit = () => setQrSize(window.innerWidth < 1024 ? 168 : 248);
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  // The entry form is only ever shown to a device that is about to *play*: it
  // renders at IDLE (no players → you become A) or PLAYER_1_JOINED (A taken →
  // you become B). Once both slots fill, the phase advances and late arrivals
  // are routed straight to the spectator views — they never see this screen.
  // So we tell the joiner, unambiguously, that joining = playing, and which
  // slot they will take.
  const joiningSlot: 'A' | 'B' = state?.players.A?.nickname ? 'B' : 'A';
  const opponentName = joiningSlot === 'B' ? state?.players.A?.nickname ?? null : null;
  const slotColor = C.player(joiningSlot);

  const wordmarkSize = { fontSize: 'clamp(34px, 11vw, 100px)', lineHeight: 0.95 } as const;

  return (
    <>
      <StageFonts />
      <main
        style={{ minHeight: '100dvh', background: C.ink, color: C.text, fontFamily: FONT.body }}
        className="flex flex-col"
      >
        <div className="flex-1 w-full max-w-6xl mx-auto px-6 py-10 flex flex-col justify-center gap-10 lg:grid lg:grid-cols-2 lg:items-center lg:gap-16">
          {/* Left — wordmark, tagline, join form */}
          <section className="flex flex-col gap-7">
            <div className="flex flex-col gap-1">
              <PixelText style={wordmarkSize}>PROMPT</PixelText>
              <PixelText color={C.accent} style={wordmarkSize}>
                CLASH
              </PixelText>
            </div>

            <span
              style={{
                fontFamily: FONT.pixel,
                fontSize: 12,
                letterSpacing: '0.22em',
                color: C.text3,
              }}
            >
              {t('scanJoinDuel')}
            </span>

            {/* Role badge — joining here means you PLAY; this is your slot. */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                background: C.ink2,
                border: `1px solid ${C.line}`,
                borderLeft: `3px solid ${slotColor}`,
                borderRadius: 12,
                padding: '12px 14px',
                maxWidth: 448,
              }}
            >
              <Avatar letter={joiningSlot} size={42} player={joiningSlot} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Lbl size={11} color={slotColor as string}>
                  {t('yourSlotPrefix')} {joiningSlot}
                </Lbl>
                <span style={{ fontSize: 14, color: C.text2, lineHeight: 1.4 }}>
                  {opponentName ? (
                    <>
                      <span style={{ color: C.bone, fontWeight: 700 }}>{opponentName}</span>,{' '}
                      {t('joinAsPlayerB')}
                    </>
                  ) : (
                    t('firstPlayerHint')
                  )}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full max-w-md" noValidate>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder={t('nicknamePlaceholder')}
                maxLength={20}
                autoComplete="off"
                autoFocus
                aria-invalid={!!error}
                disabled={submitting}
                style={{
                  width: '100%',
                  height: 56,
                  padding: '0 18px',
                  borderRadius: 14,
                  background: C.ink2,
                  color: C.text,
                  border: `1.5px solid ${error ? C.live : C.line}`,
                  fontSize: 16,
                  fontFamily: FONT.body,
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                disabled={!canSubmit}
                style={{
                  width: '100%',
                  height: 56,
                  borderRadius: 14,
                  border: 'none',
                  background: canSubmit ? C.accent : C.ink3,
                  color: canSubmit ? C.accentInk : C.text4,
                  fontSize: 16,
                  fontWeight: 700,
                  fontFamily: FONT.body,
                  letterSpacing: '0.02em',
                  cursor: canSubmit ? 'pointer' : 'not-allowed',
                  transition: 'background 0.15s ease-out',
                }}
              >
                {submitting ? '…' : t('joinGame')}
              </button>
              {error && (
                <p role="alert" style={{ fontSize: 13, color: C.live }}>
                  {error}
                </p>
              )}
            </form>
          </section>

          {/* Right — QR card. Printed-code semantics: ALWAYS ink-on-white in both
              themes (a theme-flipped card would invert and look broken). Hairline
              edge so the white card still reads on the light/paper surface. */}
          <section className="flex justify-center lg:justify-end">
            <div
              style={{
                background: '#ffffff',
                border: '1px solid rgba(0,0,0,0.10)',
                borderRadius: 16,
                padding: 22,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 14,
              }}
            >
              <span
                style={{
                  fontFamily: FONT.pixel,
                  fontSize: 12,
                  color: '#0e0e10',
                  letterSpacing: '0.08em',
                  alignSelf: 'flex-start',
                }}
              >
                {t('scanToPlay')}
              </span>
              {origin && <StageQR value={origin} size={qrSize} />}
              {host && (
                <span
                  style={{
                    fontFamily: FONT.mono,
                    fontSize: 14,
                    color: '#0e0e10',
                    alignSelf: 'stretch',
                    textAlign: 'center',
                    borderTop: '1px solid #d4d2cc',
                    paddingTop: 12,
                  }}
                >
                  {host}
                </span>
              )}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
