'use client';

import { useEffect, useState } from 'react';
import { useGameState } from './useGameState';
import { useI18n } from './i18nContext';
import { useJoin } from './useJoin';
import { C, FONT, PixelText, StageQR, StageFonts, Avatar } from '@/components/stage/atmosphere';

/**
 * Root entry (IDLE / PLAYER_1_JOINED) — mobile-first join surface in the dark
 * pixel broadcast look. Two distinct states:
 *   • not joined  → wordmark + explainer + big nickname form (QR only on desktop)
 *   • joined      → "locked in" confirmation + waiting/ready meter + keep-open note
 * The QR is never shown on phones (the user is already on this page); on desktop
 * it appears as a secondary "join from phone" panel. The button label reflects
 * intent: empty → "type your nickname", filled → "enter the duel".
 */
export function StageEntry() {
  const { state, mySlot, myNickname } = useGameState();
  const { t } = useI18n();
  const { nickname, setNickname, error, submitting, canSubmit, handleSubmit } = useJoin();

  const [origin, setOrigin] = useState('');
  const [host, setHost] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setOrigin(window.location.origin);
    setHost(window.location.host);
  }, []);

  const wordmarkSize = { fontSize: 'clamp(40px, 13vw, 92px)', lineHeight: 0.96 } as const;

  // ── Joined: locked-in confirmation ─────────────────────────────────────
  if (mySlot) {
    const slotColor = C.player(mySlot);
    const joined = (state?.players.A ? 1 : 0) + (state?.players.B ? 1 : 0);
    const name = myNickname ?? state?.players[mySlot]?.nickname ?? '';
    return (
      <>
        <StageFonts />
        <main
          style={{ minHeight: '100dvh', background: C.ink, color: C.text, fontFamily: FONT.body }}
          className="flex flex-col"
        >
          <MiniBar chip={t('chipLobby')} />
          <div className="flex-1 w-full max-w-md mx-auto px-6 pb-10 flex flex-col items-center justify-center text-center">
            <div
              style={{
                width: 88,
                height: 88,
                borderRadius: 16,
                boxShadow: `0 0 0 1px ${slotColor}80, 0 16px 40px ${slotColor}4d`,
              }}
            >
              <Avatar letter={mySlot} size={88} player={mySlot} />
            </div>

            <PixelText size={30} style={{ marginTop: 24, letterSpacing: 0 }}>
              {name.toUpperCase()}
            </PixelText>
            <p style={{ marginTop: 14, fontSize: 17, fontWeight: 600, color: slotColor }}>
              {t('lockedAs').replace('{slot}', mySlot)}
            </p>

            <div
              className="w-full"
              style={{
                marginTop: 28,
                background: C.ink2,
                border: `1px solid ${C.line}`,
                borderRadius: 14,
                padding: 20,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 14,
              }}
            >
              <span style={{ fontSize: 16, fontWeight: 600, color: C.text }}>{t('waitingPlayer2')}</span>
              <ReadyMeter joined={joined} label={t('readyCount').replace('{n}', String(joined))} />
            </div>

            <div
              className="w-full"
              style={{
                marginTop: 18,
                background: 'rgba(124,77,255,0.08)',
                border: '1px solid rgba(124,77,255,0.22)',
                borderRadius: 14,
                padding: '16px 18px',
              }}
            >
              <p style={{ fontSize: 16, fontWeight: 700, color: C.bone }}>{t('keepScreenTitle')}</p>
              <p style={{ marginTop: 6, fontSize: 14, lineHeight: 1.4, color: C.text2 }}>{t('keepScreenBody')}</p>
            </div>
          </div>
        </main>
      </>
    );
  }

  // ── Not joined: join form (mobile single column, desktop 2-col + QR) ────
  return (
    <>
      <StageFonts />
      <main
        style={{ minHeight: '100dvh', background: C.ink, color: C.text, fontFamily: FONT.body }}
        className="flex flex-col"
      >
        <MiniBar chip={t('chipPlayersNeeded')} />
        <div className="flex-1 w-full max-w-6xl mx-auto px-6 pb-8 flex flex-col lg:grid lg:grid-cols-2 lg:items-center lg:gap-16">
          {/* Left — wordmark, explainer, form (top-weighted on mobile) */}
          <section className="flex flex-col pt-4 lg:pt-0">
            <div className="flex flex-col gap-1.5">
              <PixelText style={wordmarkSize}>PROMPT</PixelText>
              <PixelText color={C.accent} style={wordmarkSize}>
                CLASH
              </PixelText>
            </div>

            <p
              style={{
                marginTop: 18,
                fontSize: 18,
                fontWeight: 500,
                lineHeight: 1.45,
                color: C.text2,
                maxWidth: 360,
              }}
            >
              {t('idleExplain')} <span style={{ color: C.bone, fontWeight: 600 }}>{t('idleExplainAccent')}</span>
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full max-w-md" style={{ marginTop: 28 }} noValidate>
              <label
                htmlFor="nickname"
                style={{
                  fontFamily: FONT.mono,
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: C.text3,
                }}
              >
                {t('nicknamePlaceholder')}
              </label>
              <input
                id="nickname"
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder={t('nicknameExample')}
                maxLength={20}
                autoComplete="off"
                autoFocus
                aria-invalid={!!error}
                disabled={submitting}
                style={{
                  width: '100%',
                  height: 62,
                  padding: '0 18px',
                  borderRadius: 14,
                  background: C.ink2,
                  color: C.text,
                  border: `1.5px solid ${error ? C.live : canSubmit ? C.accent : C.line}`,
                  fontSize: 18,
                  fontWeight: canSubmit ? 600 : 400,
                  fontFamily: FONT.body,
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                disabled={!canSubmit}
                style={{
                  width: '100%',
                  height: 62,
                  borderRadius: 14,
                  fontSize: 19,
                  fontWeight: canSubmit ? 700 : 600,
                  fontFamily: FONT.body,
                  letterSpacing: '0.01em',
                  cursor: canSubmit ? 'pointer' : 'not-allowed',
                  transition: 'background 0.15s ease-out, color 0.15s ease-out',
                  ...(canSubmit
                    ? { background: C.accent, color: C.accentInk, border: 'none', boxShadow: '0 14px 34px rgba(124,77,255,0.34)' }
                    : { background: 'transparent', color: C.text3, border: `1.5px solid ${C.line}` }),
                }}
              >
                {submitting ? '…' : canSubmit ? t('ctaEnterDuel') : t('ctaTypeNickname')}
              </button>
              {error && (
                <p role="alert" style={{ fontSize: 13, color: C.live }}>
                  {error}
                </p>
              )}
              <p style={{ fontSize: 13, color: C.text3, textAlign: 'center', marginTop: 2 }}>{t('joinAutoStart')}</p>
            </form>
          </section>

          {/* Right — secondary QR, DESKTOP ONLY. Printed-code semantics: always
              ink-on-white so scanners read it; never theme-flipped. */}
          <aside className="hidden lg:flex justify-end">
            <div
              style={{
                background: C.ink2,
                border: `1px solid ${C.line}`,
                borderRadius: 16,
                padding: '32px 26px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16,
                width: 280,
              }}
            >
              <span style={{ fontFamily: FONT.pixel, fontSize: 17, color: C.bone, letterSpacing: '0.02em' }}>
                {t('joinFromPhone')}
              </span>
              <div style={{ background: '#fff', padding: 8, borderRadius: 6, lineHeight: 0 }}>
                {origin && <StageQR value={origin} size={186} />}
              </div>
              <span style={{ fontSize: 14, fontWeight: 500, color: C.text2, textAlign: 'center', lineHeight: 1.4 }}>
                {t('scanNickHint')}
              </span>
              {host && <span style={{ fontFamily: FONT.mono, fontSize: 13, color: C.text4 }}>{host}</span>}
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}

// ── Mobile-only mini bar: small wordmark + informative chip ──────────────
function MiniBar({ chip }: { chip: string }) {
  return (
    <div className="lg:hidden flex items-center justify-between px-6 pt-7">
      <span style={{ fontFamily: FONT.pixel, fontSize: 15, letterSpacing: '0.04em', color: C.bone }}>PROMPT CLASH</span>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 7,
          padding: '5px 11px',
          border: `1px solid ${C.line}`,
          borderRadius: 999,
          background: 'rgba(255,255,255,0.02)',
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.bColor }} />
        <span
          style={{
            fontFamily: FONT.mono,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: C.text2,
          }}
        >
          {chip}
        </span>
      </span>
    </div>
  );
}

function ReadyMeter({ joined, label }: { joined: number; label: string }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {[0, 1].map((i) => (
        <span
          key={i}
          style={{
            width: 42,
            height: 8,
            borderRadius: 2,
            background: i < joined ? C.accent : C.ink3,
            border: `1px solid ${i < joined ? C.accent : C.line}`,
          }}
        />
      ))}
      <span style={{ fontFamily: FONT.mono, fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', color: C.text2 }}>
        {label}
      </span>
    </span>
  );
}
