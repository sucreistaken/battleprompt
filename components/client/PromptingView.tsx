'use client';

import { useEffect, useState } from 'react';
import { useGameState } from './useGameState';
import { useI18n } from './i18nContext';
import {
  C,
  FONT,
  StageFonts,
  StageKeyframes,
  Lbl,
  Avatar,
  ReferenceFrame,
  CountdownRing,
  useCountdown,
  PROMPT_MAX,
} from '@/components/stage/atmosphere';

/**
 * PROMPTING (player phone) — same dark/pixel broadcast language as the stage:
 * you write your prompt here and, because everyone (audience + opponent) sees it
 * live on the big screen, the screen wears that "on air" look. Responsive single
 * column. Behaviour unchanged: throttled live typing broadcast + submit.
 */
export function PromptingView() {
  const { state, mySlot, submitPrompt, sendTyping } = useGameState();
  const { t } = useI18n();
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Throttle typing broadcast (every 250ms while user types)
  useEffect(() => {
    if (submitted || state?.phase !== 'PROMPTING') return;
    const id = setTimeout(() => sendTyping(text), 250);
    return () => clearTimeout(id);
  }, [text, submitted, sendTyping, state?.phase]);

  const cd = useCountdown(state?.phaseEndsAt ?? null, state?.durations.promptDurationSec ?? 30);

  // Responsive reference size (ReferenceFrame takes a fixed px size).
  const [refSize, setRefSize] = useState(280);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const fit = () => setRefSize(Math.min(window.innerWidth - 48, 320));
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  if (!state || !mySlot) return null;

  const isWaiting = state.phase === 'VS_INTRO';
  const me = state.players[mySlot];
  const opponentSlot = mySlot === 'A' ? 'B' : 'A';
  const opponent = state.players[opponentSlot];
  const color = C.player(mySlot);
  const ink = C.playerInk(mySlot);
  const locked = submitted || !!me?.submitted;

  const handleSubmit = () => {
    if (locked || !text.trim()) return;
    submitPrompt(text.trim());
    setSubmitted(true);
  };

  return (
    <>
      <StageFonts />
      <StageKeyframes />
      <main
        style={{ minHeight: '100dvh', background: C.ink, color: C.text, fontFamily: FONT.body }}
        className="flex flex-col"
      >
        <div className="w-full max-w-md mx-auto px-5 pt-5 pb-6 flex-1 flex flex-col gap-4">
          {/* Header: your slot + countdown */}
          <header className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Avatar letter={mySlot} size={44} player={mySlot} />
              <div className="flex flex-col gap-0.5">
                <span style={{ fontFamily: FONT.pixel, fontSize: 12, letterSpacing: '0.1em', color }}>
                  {t('yourSlotPrefix')} {mySlot}
                </span>
                <span style={{ fontSize: 13, color: C.text2 }}>
                  {t('opponent')}:{' '}
                  <span style={{ color: C.bone, fontWeight: 700 }}>{opponent?.nickname ?? '—'}</span>
                </span>
              </div>
            </div>
            {!isWaiting && (
              <CountdownRing size={64} progress={cd.progress} value={cd.value} danger={cd.danger} stroke={5} />
            )}
          </header>

          {/* Reference image */}
          <section className="flex flex-col items-center gap-2 pt-1">
            <Lbl size={11}>{t('referenceImage')}</Lbl>
            <ReferenceFrame
              src={state.referenceImageUrl}
              alt={t('referenceImage')}
              size={refSize}
              loadingLabel={t('loadingText')}
            />
            <div
              style={{
                fontFamily: FONT.body,
                fontSize: 14,
                color: C.text2,
                fontStyle: 'italic',
                textAlign: 'center',
                lineHeight: 1.4,
                maxWidth: refSize,
              }}
            >
              &ldquo;{state.theme}&rdquo;
            </div>
          </section>

          {/* Prompt input */}
          <section className="flex-1 flex flex-col gap-2 pt-1">
            <div className="flex items-center justify-between">
              <Lbl size={11} color={color as string}>
                {t('yourPrompt')}
              </Lbl>
              {/* Live/public indicator — everyone sees what you type, in real time */}
              {state.showLivePrompts && !locked && !isWaiting && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontFamily: FONT.mono,
                    fontSize: 11,
                    letterSpacing: '0.04em',
                    color: C.text3,
                  }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: C.live,
                      animation: 'pcLivePulse 1.4s ease-in-out infinite',
                    }}
                  />
                  {t('everyoneSeesLive')}
                </span>
              )}
            </div>

            <textarea
              rows={5}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t('typeYourPrompt')}
              maxLength={PROMPT_MAX}
              disabled={locked || isWaiting}
              autoFocus={!isWaiting}
              style={{
                flex: 1,
                minHeight: 150,
                maxHeight: '46vh',
                width: '100%',
                padding: '14px 16px',
                borderRadius: 12,
                background: C.ink2,
                color: locked ? C.text2 : C.bone,
                border: `1.5px solid ${locked ? C.line : color}`,
                fontFamily: FONT.mono,
                fontSize: 16,
                lineHeight: 1.5,
                resize: 'none',
                outline: 'none',
                opacity: isWaiting ? 0.6 : 1,
              }}
            />
            <div className="flex justify-end">
              <span style={{ fontFamily: FONT.mono, fontSize: 12, color: C.text3 }}>
                {text.length}/{PROMPT_MAX}
              </span>
            </div>
          </section>

          {/* Submit */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={locked || !text.trim() || isWaiting}
            style={{
              width: '100%',
              height: 56,
              borderRadius: 14,
              border: 'none',
              background: locked ? C.ink3 : !text.trim() || isWaiting ? C.ink3 : color,
              color: locked ? C.text2 : !text.trim() || isWaiting ? C.text4 : ink,
              fontFamily: FONT.pixel,
              fontSize: 15,
              letterSpacing: '0.06em',
              cursor: locked || !text.trim() || isWaiting ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
            }}
          >
            {locked ? (
              <>
                <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
                  <path
                    d="M2 7 L6 11 L12 3"
                    strokeWidth="2.5"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ stroke: C.text2 }}
                  />
                </svg>
                {t('lockedLabel')}
              </>
            ) : (
              t('submit').toUpperCase()
            )}
          </button>
        </div>
      </main>
    </>
  );
}
