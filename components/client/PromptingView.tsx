'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { useGameState } from './useGameState';
import { useI18n } from './i18nContext';
import {
  C,
  FONT,
  StageFonts,
  StageKeyframes,
  StageImage,
  useCountdown,
  PROMPT_MAX,
} from '@/components/stage/atmosphere';
import type { Slot } from '@/types/game';

/**
 * PROMPTING (player) , oyuncu hedef görseli 60sn içinde tarif ediyor.
 *
 * Üç responsive yüzey, aynı state machine:
 *   • desktop (>= 1024px): iki kolon, hedef görsel sol (ana ağırlık), prompt sağ.
 *   • mobile/tablet      : sticky üst bar (ident + timer), scroll body, sticky alt CTA.
 *
 * State'ler (PROMPTING fazı içinde, match lifecycle ve socket event'lerine dokunmaz):
 *   • empty     , text boş, CTA disabled, koçluk metni.
 *   • typing    , text > 0, focus glow, sayaç aktif, CTA hazır.
 *   • last10    , cd <= 10, timer pulseSoft + live ring + rozet.
 *   • submitted , kullanıcı submit etti, locked card (slot rengi sol border).
 *   • timeout   , süre 0'a indi ve user hiç submit etmedi, locked card (live sol border).
 */
export function PromptingView() {
  const { state, mySlot, submitPrompt, sendTyping } = useGameState();
  const { t } = useI18n();
  const [text, setText] = useState('');
  const [submittedLocal, setSubmittedLocal] = useState(false);
  const [focused, setFocused] = useState(false);

  // Throttle typing broadcast (every 250ms while user types).
  useEffect(() => {
    if (submittedLocal || state?.phase !== 'PROMPTING') return;
    const id = setTimeout(() => sendTyping(text), 250);
    return () => clearTimeout(id);
  }, [text, submittedLocal, sendTyping, state?.phase]);

  const cd = useCountdown(state?.phaseEndsAt ?? null, state?.durations.promptDurationSec ?? 60);

  // Reconnect: server'da kayıtlı prompt varsa ve local text boşsa, textarea'yı doldur.
  useEffect(() => {
    if (!state || !mySlot) return;
    const me = state.players[mySlot];
    if (me?.submitted && me.prompt && text === '') {
      setText(me.prompt);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.players?.A?.prompt, state?.players?.B?.prompt, state?.players?.A?.submitted, state?.players?.B?.submitted, mySlot]);

  if (!state || !mySlot) return null;

  const isWaiting = state.phase === 'VS_INTRO';
  const me = state.players[mySlot];
  const opponentSlot: Slot = mySlot === 'A' ? 'B' : 'A';
  const opponent = state.players[opponentSlot];
  const slotColor = C.player(mySlot);
  const slotInk = C.playerInk(mySlot);
  const slotSoft = mySlot === 'A' ? 'rgba(124,77,255,0.16)' : 'rgba(174,210,74,0.20)';
  const slotShadow = mySlot === 'A' ? 'rgba(124,77,255,0.30)' : 'rgba(174,210,74,0.22)';

  const empty = text.trim().length === 0;
  const userSubmittedLocally = submittedLocal;
  const serverLocked = !!me?.submitted;
  const locked = userSubmittedLocally || serverLocked;
  const timedOut = locked && !userSubmittedLocally && cd.value === 0;
  const isLast10 = cd.value <= 10 && cd.value > 0 && !locked && !isWaiting;
  const counterWarn = text.length >= 250;

  const handleSubmit = () => {
    if (locked || empty || isWaiting) return;
    submitPrompt(text.trim());
    setSubmittedLocal(true);
  };

  // ────────── shared element builders ──────────

  const renderTimer = (size: 56 | 84 | 120) => {
    const stroke = size === 120 ? 6 : size === 84 ? 5 : 4;
    const r = size / 2 - stroke;
    const c = 2 * Math.PI * r;
    const danger = cd.danger || timedOut;
    const ringColor = danger ? C.live : slotColor;
    const numSize = size === 120 ? 46 : size === 84 ? 32 : 22;
    return (
      <div style={{ position: 'relative', width: size, height: size, flex: 'none' }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', display: 'block' }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} style={{ stroke: C.line }} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="butt"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - cd.progress)}
            style={{ stroke: ringColor, transition: 'stroke-dashoffset 250ms linear, stroke 400ms ease-out' }}
          />
        </svg>
        <div
          role="timer"
          aria-live="polite"
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: FONT.pixel,
            fontVariantNumeric: 'tabular-nums',
            fontSize: numSize,
            color: danger ? C.live : C.bone,
            animation: danger ? 'pcPulseSoft 1.4s ease-in-out infinite' : 'none',
          }}
        >
          {cd.value}
        </div>
      </div>
    );
  };

  const identBlock = (compact: boolean) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: compact ? 10 : 12, minWidth: 0 }}>
      <div
        style={{
          width: compact ? 32 : 36,
          height: compact ? 32 : 36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: slotColor,
          color: slotInk,
          fontFamily: FONT.pixel,
          fontSize: compact ? 15 : 17,
          borderRadius: 3,
          flex: 'none',
        }}
      >
        {mySlot}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <span
          style={{
            fontFamily: FONT.pixel,
            fontSize: compact ? 11 : 12,
            letterSpacing: '0.14em',
            color: slotColor,
          }}
        >
          {(compact ? t('youAreSlotMobile') : t('youAreSlotDesktop')).replace('{slot}', mySlot)}
        </span>
        <span
          style={{
            fontFamily: FONT.mono,
            fontSize: compact ? 12 : 13,
            color: C.text2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: compact ? 160 : 240,
          }}
        >
          {t('opponentLabel')}: <span style={{ color: C.bone, fontWeight: 600 }}>{opponent?.nickname ?? '...'}</span>
        </span>
      </div>
    </div>
  );

  const miniLabelEl = (label: string) => (
    <span
      style={{
        fontFamily: FONT.pixel,
        fontSize: 11,
        letterSpacing: '0.18em',
        color: C.text3,
        textTransform: 'uppercase',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
      }}
    >
      {label}
      <span style={{ display: 'inline-block', width: 28, height: 1, background: C.line }} />
    </span>
  );

  const hintChips = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {miniLabelEl(t('hintHeading'))}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {[t('hintMainObject'), t('hintEnvironment'), t('hintLight'), t('hintColors'), t('hintStyle')].map((chip) => (
          <span
            key={chip}
            style={{
              fontFamily: FONT.mono,
              fontSize: 11,
              color: C.text3,
              padding: '5px 10px',
              border: `1px solid ${C.line}`,
              letterSpacing: '0.04em',
              background: 'transparent',
              cursor: 'default',
              pointerEvents: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              borderRadius: 2,
            }}
          >
            <span
              style={{
                width: 3,
                height: 3,
                borderRadius: '50%',
                background: C.text4,
                display: 'inline-block',
                flex: 'none',
              }}
            />
            {chip}
          </span>
        ))}
      </div>
    </div>
  );

  const targetImage = (maxSize: number) => {
    const crop = (s: CSSProperties): CSSProperties => ({ position: 'absolute', width: 18, height: 18, ...s });
    return (
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: maxSize,
          overflow: 'hidden',
          border: `1px solid ${C.line2}`,
          alignSelf: 'flex-start',
        }}
      >
        <StageImage
          src={state.referenceImageUrl}
          alt={t('referenceImage')}
          accent={slotColor}
          loadingLabel={t('loadingText')}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: '40%',
            background: 'linear-gradient(180deg, rgba(14,14,16,0) 0%, rgba(14,14,16,0.55) 100%)',
            pointerEvents: 'none',
          }}
        />
        <div style={crop({ top: 7, left: 7, borderTop: `2px solid ${slotColor}`, borderLeft: `2px solid ${slotColor}` })} />
        <div style={crop({ top: 7, right: 7, borderTop: `2px solid ${slotColor}`, borderRight: `2px solid ${slotColor}` })} />
        <div style={crop({ bottom: 7, left: 7, borderBottom: `2px solid ${slotColor}`, borderLeft: `2px solid ${slotColor}` })} />
        <div style={crop({ bottom: 7, right: 7, borderBottom: `2px solid ${slotColor}`, borderRight: `2px solid ${slotColor}` })} />
      </div>
    );
  };

  const textArea = (variant: 'desktop' | 'mobile') => {
    const minH = variant === 'desktop' ? 200 : 140;
    const maxH = variant === 'mobile' ? 200 : undefined;
    return (
      <textarea
        rows={5}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={t('promptPlaceholder')}
        maxLength={PROMPT_MAX}
        disabled={locked || isWaiting}
        style={{
          width: '100%',
          minHeight: minH,
          maxHeight: maxH,
          padding: variant === 'mobile' ? '14px 16px' : '18px 20px',
          borderRadius: 12,
          background: C.ink2,
          color: locked ? C.text2 : C.bone,
          border: `1.5px solid ${locked ? C.line : focused ? slotColor : C.line}`,
          boxShadow: !locked && focused ? `0 0 0 4px ${slotSoft}` : 'none',
          fontFamily: FONT.mono,
          fontSize: 16,
          lineHeight: 1.55,
          resize: 'none',
          outline: 'none',
          opacity: isWaiting ? 0.7 : locked ? 0.75 : 1,
          transition: 'border-color 160ms ease-out, box-shadow 200ms ease-out',
        }}
      />
    );
  };

  const counterRow = (variant: 'desktop' | 'mobile') => (
    <div
      style={{
        display: 'flex',
        justifyContent: variant === 'mobile' ? 'flex-end' : 'space-between',
        alignItems: 'center',
        marginTop: 6,
      }}
    >
      <span
        style={{
          fontFamily: FONT.mono,
          fontSize: 13,
          color: counterWarn ? C.live : C.text2,
          fontWeight: counterWarn ? 700 : 400,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {text.length} / {PROMPT_MAX}
      </span>
      {variant === 'desktop' && empty && !locked && (
        <span style={{ fontFamily: FONT.mono, fontSize: 11, color: C.text4, letterSpacing: '0.04em' }}>
          {t('hintAsideHint')}
        </span>
      )}
    </div>
  );

  const ctaButton = (variant: 'desktop' | 'mobile') => {
    const height = variant === 'desktop' ? 60 : 52;
    const fontSize = variant === 'desktop' ? 15 : 14;
    const marginTop = variant === 'desktop' ? 14 : 0;
    return (
      <button
        type="button"
        onClick={handleSubmit}
        disabled={empty || isWaiting}
        style={{
          width: '100%',
          height,
          marginTop,
          borderRadius: 12,
          border: empty ? `1.5px solid ${C.line}` : 'none',
          background: empty ? 'transparent' : slotColor,
          color: empty ? C.text3 : slotInk,
          boxShadow: empty ? 'none' : `0 14px 34px ${slotShadow}`,
          fontFamily: FONT.pixel,
          fontSize,
          letterSpacing: '0.06em',
          cursor: empty ? 'not-allowed' : 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          transition: 'transform 120ms ease-out, background 160ms ease-out, color 160ms ease-out',
        }}
      >
        {empty ? t('ctaEmpty').toUpperCase() : t('ctaSubmit').toUpperCase()}
      </button>
    );
  };

  const lockedCard = (variant: 'desktop' | 'mobile') => (
    <div
      style={{
        marginTop: variant === 'desktop' ? 14 : 0,
        background: C.ink2,
        border: `1px solid ${C.line}`,
        borderLeft: `3px solid ${timedOut ? C.live : slotColor}`,
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 10,
          fontFamily: FONT.pixel,
          fontSize: variant === 'desktop' ? 14 : 13,
          letterSpacing: '0.08em',
          color: timedOut ? C.live : slotColor,
        }}
      >
        {timedOut ? (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
            <circle cx="8" cy="8" r="6" strokeWidth="1.6" fill="none" style={{ stroke: C.live }} />
            <path
              d="M8 4 V8 L11 10"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ stroke: C.live }}
            />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path
              d="M3 8 L7 12 L13 4"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ stroke: slotColor }}
            />
          </svg>
        )}
        {(timedOut ? t('timeoutTitle') : t('lockedTitle')).toUpperCase()}
      </div>
      <div style={{ fontFamily: FONT.body, fontSize: 13, color: C.text2, lineHeight: 1.5 }}>
        {timedOut ? t('timeoutBody') : t('lockedBody')}
      </div>
    </div>
  );

  const notesBlock = () => (
    <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 13, color: C.text2, lineHeight: 1.45 }}>{t('confidentNote')}</span>
      <span style={{ fontSize: 12, color: C.text3, lineHeight: 1.45 }}>{t('resultVisibilityNote')}</span>
    </div>
  );

  // ────────── desktop branch (>= lg) ──────────
  const desktopBranch = (
    <div
      className="hidden lg:flex"
      style={{
        flexDirection: 'column',
        minHeight: '100dvh',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 1180,
          margin: '0 auto',
          padding: '48px 56px',
          display: 'grid',
          gridTemplateColumns: 'minmax(620px, 1fr) 400px',
          gap: 48,
          flex: 1,
        }}
      >
        {/* sol kolon , hedef görsel ana ağırlık */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 18, minWidth: 0 }}>
          {miniLabelEl(t('referenceImage'))}
          {targetImage(620)}
          <div style={{ fontSize: 15, color: C.text2, lineHeight: 1.4, maxWidth: 540 }}>
            {t('referenceCaption')}
          </div>
          {hintChips()}
        </section>

        {/* sağ kolon , oyuncu + timer + prompt */}
        <section style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20 }}>
            {identBlock(false)}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
              {renderTimer(120)}
              {isLast10 && (
                <span
                  style={{
                    background: C.live,
                    color: '#fff',
                    fontFamily: FONT.pixel,
                    fontSize: 11,
                    letterSpacing: '0.12em',
                    padding: '3px 10px',
                    borderRadius: 2,
                  }}
                >
                  {t('last10').toUpperCase()}
                </span>
              )}
            </div>
          </div>
          <div
            style={{
              marginTop: 10,
              fontFamily: FONT.mono,
              fontSize: 11,
              letterSpacing: '0.1em',
              color: C.text3,
              textAlign: 'right',
            }}
          >
            {timedOut ? t('timerNoteDone') : t('timerHint')}
          </div>

          <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span
              style={{
                fontFamily: FONT.pixel,
                fontSize: 12,
                letterSpacing: '0.18em',
                color: slotColor,
              }}
            >
              {t('yourPrompt').toUpperCase()}
            </span>
            {textArea('desktop')}
            {counterRow('desktop')}
            {locked ? lockedCard('desktop') : ctaButton('desktop')}
          </div>

          {!locked && notesBlock()}
        </section>
      </div>
    </div>
  );

  // ────────── mobile/tablet branch (< lg) ──────────
  const mobileBranch = (
    <div
      className="flex lg:hidden"
      style={{
        flexDirection: 'column',
        minHeight: '100dvh',
        background: C.ink,
      }}
    >
      {/* üst bar */}
      <header
        style={{
          flex: 'none',
          background: C.ink,
          borderBottom: `1px solid ${C.line}`,
          padding: '14px 20px',
          paddingTop: `calc(14px + env(safe-area-inset-top))`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        {identBlock(true)}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          {renderTimer(56)}
          {isLast10 && (
            <span
              style={{
                background: C.live,
                color: '#fff',
                fontFamily: FONT.pixel,
                fontSize: 9,
                letterSpacing: '0.1em',
                padding: '2px 7px',
                borderRadius: 2,
              }}
            >
              {t('last10').toUpperCase()}
            </span>
          )}
        </div>
      </header>

      {/* body — natural flow, iOS klavyesi textarea'yı kendi scroll'lar */}
      <div
        style={{
          flex: 1,
          padding: '16px 20px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        {miniLabelEl(t('referenceImage'))}
        <div style={{ alignSelf: 'center', width: '100%', maxWidth: 260 }}>
          {targetImage(260)}
        </div>
        <div style={{ fontSize: 14, color: C.text2, textAlign: 'center', lineHeight: 1.4 }}>
          {t('promptingSubtitleShort')}
        </div>
        {hintChips()}

        <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span
            style={{
              fontFamily: FONT.pixel,
              fontSize: 11,
              letterSpacing: '0.18em',
              color: slotColor,
            }}
          >
            {t('yourPrompt').toUpperCase()}
          </span>
          {textArea('mobile')}
          {counterRow('mobile')}
        </div>
      </div>

      {/* alt bar , CTA veya locked card */}
      <div
        style={{
          flex: 'none',
          background: C.ink,
          borderTop: `1px solid ${C.line}`,
          padding: '12px 20px',
          paddingBottom: `max(env(safe-area-inset-bottom), 14px)`,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {locked ? (
          lockedCard('mobile')
        ) : (
          <>
            {ctaButton('mobile')}
            <span style={{ fontSize: 11, color: C.text3, textAlign: 'center' }}>{t('confidentNoteShort')}</span>
          </>
        )}
      </div>
    </div>
  );

  return (
    <>
      <StageFonts />
      <StageKeyframes />
      <style>{`
        @keyframes pcPulseSoft {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%      { transform: scale(1.04); opacity: 0.92; }
        }
      `}</style>
      <main
        style={{
          background: C.ink,
          color: C.text,
          fontFamily: FONT.body,
        }}
      >
        {desktopBranch}
        {mobileBranch}
      </main>
    </>
  );
}
