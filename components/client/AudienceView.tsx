'use client';

import { useEffect, useState, type CSSProperties } from 'react';
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
  StageImage,
  CountdownRing,
  useCountdown,
} from '@/components/stage/atmosphere';
import type { Slot } from '@/types/game';
import type { DictKey } from '@/i18n/dict';

/**
 * AudienceView, izleyici ve oyuncuların kendi cihazından gördüğü ekran.
 *
 * Faza göre dallanır:
 *   GENERATING / SCORING  : v4 polish (broadcast hedef + arena layout)
 *   PROMPTING / VS_INTRO  : mevcut layout (live prompts streaming)
 *   VOTING / TIEBREAK     : mevcut layout (audience watching)
 *
 * Match state machine, socket events, timer logic ve provider logic'e dokunulmaz.
 */
export function AudienceView() {
  const { state, livePrompts } = useGameState();
  const { t } = useI18n();

  // PROMPTING için reference frame boyutu (mevcut davranış korunur).
  const [refSize, setRefSize] = useState(220);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const fit = () => setRefSize(Math.min(window.innerWidth - 48, 260));
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  // (Mobile hedef boyutu — eski HedefCorner içindi, artık ReferenceStrip sabit
  // 52px thumb kullanıyor; ölçüm state'i kaldırıldı.)

  // GENERATING fazında geçen saniye, 20+ ise fallback subtitle aktif.
  const [genElapsed, setGenElapsed] = useState(0);
  useEffect(() => {
    if (state?.phase !== 'GENERATING') {
      setGenElapsed(0);
      return;
    }
    const start = Date.now();
    const id = setInterval(() => {
      setGenElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [state?.phase]);

  // Mevcut countdown (VOTING fazı için), davranış korunur.
  const isVotingPhase = state?.phase === 'VOTING' || state?.phase === 'TIEBREAK_VOTE';
  const cd = useCountdown(
    state?.phaseEndsAt ?? null,
    isVotingPhase ? state?.durations.votingDurationSec ?? 20 : state?.durations.promptDurationSec ?? 30,
  );

  if (!state) return null;

  const phase = state.phase;

  // ── Yeni redesign yalnızca GENERATING ve SCORING için ────────────────
  if (phase === 'GENERATING' || phase === 'SCORING') {
    return (
      <AudienceGenerating
        state={state}
        t={t}
        isScoring={phase === 'SCORING'}
        showFallback={phase === 'GENERATING' && genElapsed >= 20}
      />
    );
  }

  // ── Mevcut layout, PROMPTING / VS_INTRO / VOTING / TIEBREAK ──────────
  const isPrompting = phase === 'PROMPTING' || phase === 'VS_INTRO';
  const isVoting = phase === 'VOTING' || phase === 'TIEBREAK_VOTE';

  const statusLabel =
    isVoting
      ? t('voteHeading')
      : phase === 'PROMPTING'
        ? t('playersWriting')
        : phase === 'VS_INTRO'
          ? t('vs')
          : '';

  const showRing = (isPrompting || isVoting) && !!state.phaseEndsAt;

  const strip = (slot: Slot) => {
    const p = state.players[slot];
    const color = C.player(slot);
    const live = slot === 'A' ? livePrompts.A : livePrompts.B;
    const submitted = !!p?.submitted;
    const offline = !!p?.disconnected || !!p?.forfeit;
    const metaLabel = isVoting
      ? t('submittedShort')
      : submitted
        ? t('submittedShort')
        : t('typingShort');

    return (
      <div
        key={slot}
        style={{ background: C.ink2, border: `1px solid ${C.line}`, borderRadius: 14, overflow: 'hidden' }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '11px 14px',
            borderBottom: `1px solid ${C.line}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar letter={slot} size={34} player={slot} />
            <span style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 15, color: C.bone }}>
              {p?.nickname ?? `Player ${slot}`}
            </span>
          </div>
          {offline ? (
            <Lbl size={10} color={C.live as string}>
              {p?.forfeit ? t('forfeit') : t('disconnected')}
            </Lbl>
          ) : (
            <Lbl size={10} color={submitted || isVoting ? 'text3' : (color as string)}>
              {metaLabel}
            </Lbl>
          )}
        </div>

        {isPrompting ? (
          <div style={{ padding: '12px 14px', minHeight: 70 }}>
            {state.showLivePrompts ? (
              <span
                style={{
                  fontFamily: FONT.mono,
                  fontSize: 13,
                  lineHeight: 1.55,
                  color: live ? C.text : C.text3,
                }}
              >
                {live || t('typing')}
              </span>
            ) : (
              <Lbl size={11}>{t('promptHidden')}</Lbl>
            )}
          </div>
        ) : (
          <StageImage
            src={p?.imageUrl ?? null}
            alt={p?.nickname ?? slot}
            accent={color}
            loadingLabel={t('generating')}
          />
        )}
      </div>
    );
  };

  return (
    <>
      <StageFonts />
      <StageKeyframes />
      <main
        style={{
          minHeight: '100dvh',
          background: C.ink,
          color: C.text,
          fontFamily: FONT.body,
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
        className="flex flex-col"
      >
        <div className="w-full max-w-md md:max-w-4xl mx-auto px-5 pt-5 pb-6 flex-1 flex flex-col gap-4">
          <header className="flex items-center justify-between gap-3">
            <div className="flex flex-col gap-1">
              <Lbl size={11} color="accent">
                {t('audience')}
              </Lbl>
              <span style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 16, color: C.bone }}>
                {statusLabel}
              </span>
              {isVoting && (
                <span style={{ fontFamily: FONT.body, fontSize: 13, color: C.text3 }}>
                  {t('audienceDeciding')}
                </span>
              )}
            </div>
            {showRing && (
              <CountdownRing size={56} progress={cd.progress} value={cd.value} danger={cd.danger} stroke={5} />
            )}
          </header>

          {isPrompting && (
            <section className="flex flex-col items-center gap-2">
              <ReferenceFrame
                src={state.referenceImageUrl}
                alt={t('referenceImage')}
                size={refSize}
                loadingLabel={t('loadingText')}
              />
              <Lbl size={10}>{t('referenceImage')}</Lbl>
            </section>
          )}

          <section className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 content-start">
            {strip('A')}
            {strip('B')}
          </section>
        </div>
      </main>
    </>
  );
}

// ─── AudienceGenerating, v4 polish, GENERATING + SCORING ────────────────

interface AudienceGeneratingProps {
  state: NonNullable<ReturnType<typeof useGameState>['state']>;
  t: (key: DictKey) => string;
  isScoring: boolean;
  showFallback: boolean;
}

function AudienceGenerating({ state, t, isScoring, showFallback }: AudienceGeneratingProps) {
  const aPlayer = state.players.A;
  const bPlayer = state.players.B;
  const aReady = !!aPlayer?.imageUrl;
  const bReady = !!bPlayer?.imageUrl;
  const readyCount = (aReady ? 1 : 0) + (bReady ? 1 : 0);
  const isAsym = !isScoring && readyCount === 1;
  const aReadyFlag = aReady || isScoring;
  const bReadyFlag = bReady || isScoring;

  const headline = isScoring ? t('audienceScoringTitle') : t('audienceGeneratingTitle');
  const subtitle = isScoring
    ? t('audienceScoringSubtitle')
    : showFallback
      ? t('fallbackLongWait')
      : t('audienceGeneratingSubtitle');

  const shellProps: ShellProps = {
    t,
    headline,
    subtitle,
    asym: isAsym,
    readyCount,
    referenceUrl: state.referenceImageUrl,
    isScoring,
    aPlayer,
    bPlayer,
    aReadyFlag,
    bReadyFlag,
  };

  return (
    <>
      <StageFonts />
      <StageKeyframes />
      <style>{`
        @keyframes acLiveDot { 0%, 100% { opacity: 1 } 50% { opacity: .4 } }
        @media (prefers-reduced-motion: reduce) {
          .ac-spinner, .ac-live-dot { animation: none !important; }
        }
        /* Player-card grid:
           - default (≥360px wide): compact 2-column for side-by-side compare;
           - <360px (e.g. iPhone SE 320×568): stack so each card keeps width;
           Desktop has its own grid in DesktopShell, this class only ships with
           the mobile <main> branch (hidden lg:hidden in JSX). */
        .ac-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          align-items: start;
        }
        @media (max-width: 359px) {
          .ac-grid { grid-template-columns: 1fr; gap: 14px; }
        }
      `}</style>
      <main
        style={{
          minHeight: '100dvh',
          background: C.ink,
          color: C.text,
          fontFamily: FONT.body,
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          // Floating LangToggle is suppressed for these phases (MobileShell.tsx)
          // and `MinimalTopBar` carries the inline chip — but make sure no
          // descendant width pushes the page sideways either.
          overflowX: 'hidden',
        }}
        className="flex flex-col"
      >
        <div
          className="hidden lg:flex flex-col items-center"
          style={{
            width: '100%',
            maxWidth: 1180,
            margin: '0 auto',
            padding: '28px 56px 32px',
            minHeight: '100dvh',
          }}
        >
          <DesktopShell {...shellProps} />
        </div>

        <div
          className="flex lg:hidden flex-col items-center"
          style={{
            width: '100%',
            // Side padding respects iPhone landscape safe area. `clamp` keeps
            // 14px on portrait phones, but never collapses below the notch.
            paddingTop: 14,
            paddingBottom: 18,
            paddingLeft: 'max(14px, env(safe-area-inset-left))',
            paddingRight: 'max(14px, env(safe-area-inset-right))',
            minHeight: '100dvh',
            boxSizing: 'border-box',
          }}
        >
          <MobileShell {...shellProps} />
        </div>
      </main>
    </>
  );
}

// ─── reusable parts ─────────────────────────────────────────────────────

const SLOT_DIM = { A: 'rgba(124,77,255,0.32)', B: 'rgba(174,210,74,0.28)' } as const;
const SLOT_LIVE = { A: '#7c4dff', B: '#aed24a' } as const;
const SLOT_PROMPT_BG = { A: 'rgba(124,77,255,0.05)', B: 'rgba(174,210,74,0.05)' } as const;

function MinimalTopBar({ t, compact = false }: { t: (key: DictKey) => string; compact?: boolean }) {
  // Header is a two-cell flex row: brand wordmark left, [LIVE + lang] right.
  // `min-width:0` + `flex-shrink` on the brand prevents it pushing the right
  // cluster off-screen on 320px viewports; `flex-wrap` is a safety net for
  // extremely narrow widths so LIVE/TR-EN never tuck under the right edge.
  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        flexWrap: 'wrap',
      }}
    >
      <span
        style={{
          fontFamily: FONT.pixel,
          fontSize: compact ? 11 : 13,
          color: C.bone,
          letterSpacing: '0.08em',
          minWidth: 0,
          flex: '0 1 auto',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {t('brandWordmark').toUpperCase()}
      </span>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: compact ? 8 : 10,
          flex: '0 0 auto',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: FONT.mono,
            fontSize: compact ? 9 : 10,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: C.text2,
          }}
        >
          <span
            className="ac-live-dot"
            style={{
              width: compact ? 5 : 6,
              height: compact ? 5 : 6,
              borderRadius: '50%',
              background: C.live,
              animation: 'acLiveDot 1.6s ease-in-out infinite',
              display: 'inline-block',
            }}
          />
          {t('live')}
        </span>
        <InlineLangChip compact={compact} />
      </div>
    </div>
  );
}

// Header-inline TR|EN chip. The floating `client/LangToggle` is fixed at
// top-right and overlaps the audience-generating header (and the mobile
// reference thumb that used to live there), so for the GENERATING/SCORING
// surface we mount this inline chip instead. Same i18nContext, no
// localStorage divergence.
function InlineLangChip({ compact = false }: { compact?: boolean }) {
  const { lang, setLang } = useI18n();
  const padY = compact ? 2 : 3;
  const padX = compact ? 4 : 5;
  const chipPadY = compact ? 2 : 3;
  const chipPadX = compact ? 7 : 8;
  return (
    <div
      aria-label="language"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0,
        padding: `${padY}px ${padX}px`,
        background: 'color-mix(in srgb, var(--pc-ink) 75%, transparent)',
        border: `1px solid ${C.line}`,
        borderRadius: 999,
        fontFamily: FONT.mono,
        fontSize: compact ? 9 : 10,
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        userSelect: 'none',
      }}
    >
      {(['tr', 'en'] as const).map((code, i) => (
        <span key={code} style={{ display: 'inline-flex', alignItems: 'center' }}>
          {i === 1 && <span style={{ width: 1, height: 10, background: C.line, opacity: 0.6 }} />}
          <button
            type="button"
            onClick={() => setLang(code)}
            aria-pressed={lang === code}
            style={{
              appearance: 'none',
              border: 'none',
              background: 'transparent',
              padding: `${chipPadY}px ${chipPadX}px`,
              color: lang === code ? C.accent : C.text3,
              fontFamily: 'inherit',
              fontSize: 'inherit',
              letterSpacing: 'inherit',
              textTransform: 'inherit',
              cursor: lang === code ? 'default' : 'pointer',
              fontWeight: lang === code ? 600 : 400,
              // 28px minimum touch target on compact (covers a11y without bloating header).
              minWidth: compact ? 28 : 30,
              minHeight: compact ? 26 : 28,
              lineHeight: 1,
            }}
          >
            {code.toUpperCase()}
          </button>
        </span>
      ))}
    </div>
  );
}

// Mobile-only mini reference strip — replaces the cornered HedefCorner thumb
// that collided with the floating lang toggle. A horizontal pill: small
// thumbnail + REFERANS label, centred under the headline so it reads as a
// dedicated anchor, not header chrome.
function ReferenceStrip({
  src,
  alt,
  label,
  loadingLabel,
}: {
  src: string | null;
  alt: string;
  label: string;
  loadingLabel: string;
}) {
  const thumb = 52;
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 12,
        padding: '8px 14px 8px 8px',
        background: 'rgba(124,77,255,0.06)',
        border: `1px solid rgba(124,77,255,0.32)`,
        maxWidth: '100%',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: thumb,
          height: thumb,
          flex: '0 0 auto',
          background: '#0f0e14',
          border: `1px solid rgba(124,77,255,0.45)`,
          overflow: 'hidden',
        }}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
            <div
              className="ac-spinner"
              aria-label={loadingLabel}
              style={{
                width: 18,
                height: 18,
                border: `2px solid ${C.line}`,
                borderTopColor: C.accent,
                borderRightColor: C.accent,
                borderRadius: '50%',
                animation: 'pcSpin 1.6s linear infinite',
              }}
            />
          </div>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
        <span
          style={{
            fontFamily: FONT.pixel,
            fontSize: 10,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: C.accent,
            lineHeight: 1,
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontFamily: FONT.mono,
            fontSize: 10,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: C.text3,
            lineHeight: 1.2,
          }}
        >
          {alt}
        </span>
      </div>
    </div>
  );
}

function Headline({
  title,
  subtitle,
  badge,
  compact = false,
}: {
  title: string;
  subtitle: string;
  badge?: string;
  compact?: boolean;
}) {
  return (
    <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: compact ? 6 : 8 }}>
      <div
        style={{
          fontFamily: FONT.pixel,
          fontSize: compact ? 15 : 24,
          color: C.bone,
          letterSpacing: '0.04em',
          lineHeight: 1.1,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: compact ? 11.5 : 13,
          color: C.text2,
          lineHeight: 1.4,
        }}
      >
        {subtitle}
      </div>
      {badge && (
        <div
          style={{
            fontFamily: FONT.mono,
            fontSize: compact ? 9 : 10,
            letterSpacing: '0.20em',
            textTransform: 'uppercase',
            color: C.text3,
            padding: compact ? '3px 8px' : '4px 10px',
            border: `1px solid ${C.line}`,
          }}
        >
          <b style={{ color: C.bone, fontWeight: 600 }}>{badge.split(' ')[0]}</b> {badge.split(' ').slice(1).join(' ')}
        </div>
      )}
    </div>
  );
}

function HedefBlock({
  src,
  alt,
  label,
  size,
  compact = false,
}: {
  src: string | null;
  alt: string;
  label: string;
  size: number;
  compact?: boolean;
}) {
  const cornerStyle = (s: CSSProperties): CSSProperties => ({
    position: 'absolute',
    width: 16,
    height: 16,
    ...s,
  });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: compact ? 8 : 12 }}>
      <span
        style={{
          fontFamily: FONT.pixel,
          fontSize: compact ? 9 : 11,
          letterSpacing: compact ? '0.22em' : '0.20em',
          textTransform: 'uppercase',
          color: C.accent,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        {!compact && (
          <span style={{ display: 'inline-block', width: 18, height: 1, background: C.accent, opacity: 0.5 }} />
        )}
        {label}
        {!compact && (
          <span style={{ display: 'inline-block', width: 18, height: 1, background: C.accent, opacity: 0.5 }} />
        )}
      </span>
      <div
        style={{
          position: 'relative',
          width: size,
          height: size,
          overflow: 'hidden',
          background: '#0f0e14',
          border: `1.5px solid rgba(124,77,255,0.42)`,
          boxShadow: 'inset 0 0 32px rgba(124,77,255,0.10), 0 12px 40px rgba(124,77,255,0.06)',
        }}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              className="ac-spinner"
              style={{
                width: 40,
                height: 40,
                border: `2px solid ${C.line}`,
                borderTopColor: C.accent,
                borderRightColor: C.accent,
                borderRadius: '50%',
                animation: 'pcSpin 1.6s linear infinite',
              }}
            />
          </div>
        )}
        <div
          style={cornerStyle({ top: 6, left: 6, borderTop: `2px solid ${C.accent}`, borderLeft: `2px solid ${C.accent}` })}
        />
        <div
          style={cornerStyle({ top: 6, right: 6, borderTop: `2px solid ${C.accent}`, borderRight: `2px solid ${C.accent}` })}
        />
        <div
          style={cornerStyle({
            bottom: 6,
            left: 6,
            borderBottom: `2px solid ${C.accent}`,
            borderLeft: `2px solid ${C.accent}`,
          })}
        />
        <div
          style={cornerStyle({
            bottom: 6,
            right: 6,
            borderBottom: `2px solid ${C.accent}`,
            borderRight: `2px solid ${C.accent}`,
          })}
        />
      </div>
    </div>
  );
}

function PlayerCard({
  slot,
  nick,
  imageUrl,
  ready,
  isScoring,
  t,
  compact = false,
  prompt,
}: {
  slot: Slot;
  nick: string;
  imageUrl: string | null;
  ready: boolean;
  isScoring: boolean;
  t: (key: DictKey) => string;
  compact?: boolean;
  prompt: string | null;
}) {
  const slotColor = C.player(slot);
  const borderColor = ready ? SLOT_LIVE[slot] : SLOT_DIM[slot];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? 8 : 12, minWidth: 0 }}>
      <span
        style={{
          fontFamily: FONT.pixel,
          fontSize: compact ? 11 : 13,
          letterSpacing: '0.06em',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span style={{ color: slotColor, fontSize: compact ? 12 : 14 }}>{slot}</span>
        <span style={{ color: C.text4, fontSize: compact ? 10 : 11 }}>·</span>
        <span
          style={{
            color: C.bone,
            letterSpacing: '0.04em',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: compact ? 110 : 200,
            display: 'inline-block',
          }}
        >
          {nick.toUpperCase()}
        </span>
      </span>
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '1 / 1',
          background: '#15141b',
          overflow: 'hidden',
          border: `1.5px solid ${borderColor}`,
          transition: 'border-color 320ms ease',
        }}
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={nick}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              className="ac-spinner"
              style={{
                width: compact ? 32 : 48,
                height: compact ? 32 : 48,
                border: `2px solid ${C.line}`,
                borderTopColor: slotColor,
                borderRightColor: slotColor,
                borderRadius: '50%',
                animation: 'pcSpin 1.6s linear infinite',
              }}
            />
          </div>
        )}
      </div>
      {!isScoring && (
        <span
          style={{
            fontFamily: FONT.mono,
            fontSize: compact ? 9 : 10,
            letterSpacing: compact ? '0.18em' : '0.22em',
            textTransform: 'uppercase',
            color: ready ? slotColor : C.text3,
          }}
        >
          {ready ? t('statusReady') : t('statusDrawing')}
        </span>
      )}
      {prompt !== null && (
        // Prompt box: previously hard-clipped to 2/3 lines with a mask gradient,
        // so longer prompts (which is the norm) lost half their content. Now we
        // give it a comfortable min-height (so short prompts don't collapse the
        // card), let it grow up to a tall cap, and only then scroll inside the
        // card. Mask removed — fade-on-overflow read as "we cut your prompt".
        <div
          style={{
            fontFamily: FONT.mono,
            fontSize: compact ? 11 : 12.5,
            lineHeight: compact ? 1.5 : 1.55,
            color: prompt ? C.text2 : C.text4,
            fontStyle: prompt ? 'normal' : 'italic',
            padding: compact ? '10px 12px' : '12px 14px',
            background: SLOT_PROMPT_BG[slot],
            borderLeft: `2px solid ${slotColor}`,
            minHeight: compact ? 56 : 78,
            maxHeight: compact ? 160 : 220,
            overflowY: 'auto',
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap',
          }}
        >
          {prompt || t('typing')}
        </div>
      )}
    </div>
  );
}

// ─── desktop shell ──────────────────────────────────────────────────────

interface ShellProps {
  t: (key: DictKey) => string;
  headline: string;
  subtitle: string;
  asym: boolean;
  readyCount: number;
  referenceUrl: string | null;
  isScoring: boolean;
  aPlayer: ReturnType<typeof useGameState>['state'] extends infer S
    ? S extends { players: { A: infer P } }
      ? P
      : never
    : never;
  bPlayer: ReturnType<typeof useGameState>['state'] extends infer S
    ? S extends { players: { B: infer P } }
      ? P
      : never
    : never;
  aReadyFlag: boolean;
  bReadyFlag: boolean;
}

function DesktopShell({
  t,
  headline,
  subtitle,
  asym,
  readyCount,
  referenceUrl,
  isScoring,
  aPlayer,
  bPlayer,
  aReadyFlag,
  bReadyFlag,
}: ShellProps) {
  const badgeText = asym ? `${readyCount} ${t('audienceReadyOfTwoSuffix')}` : undefined;

  return (
    <>
      <MinimalTopBar t={t} />
      <div style={{ marginTop: 18 }}>
        <Headline title={headline} subtitle={subtitle} badge={badgeText} />
      </div>
      <div
        style={{
          marginTop: 30,
          width: '100%',
          maxWidth: 1060,
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          gap: 36,
          alignItems: 'start',
          justifyContent: 'center',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '100%', maxWidth: 300 }}>
            <PlayerCard
              slot="A"
              nick={aPlayer?.nickname ?? 'Player A'}
              imageUrl={aPlayer?.imageUrl ?? null}
              ready={aReadyFlag}
              isScoring={isScoring}
              t={t}
              prompt={aPlayer?.prompt ?? null}
            />
          </div>
        </div>
        <div style={{ paddingTop: 12 }}>
          <HedefBlock
            src={referenceUrl}
            alt={t('referenceImage')}
            label={t('audienceHedefShort')}
            size={280}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <div style={{ width: '100%', maxWidth: 300 }}>
            <PlayerCard
              slot="B"
              nick={bPlayer?.nickname ?? 'Player B'}
              imageUrl={bPlayer?.imageUrl ?? null}
              ready={bReadyFlag}
              isScoring={isScoring}
              t={t}
              prompt={bPlayer?.prompt ?? null}
            />
          </div>
        </div>
      </div>
      {isScoring && (
        <div
          style={{
            marginTop: 24,
            fontSize: 13,
            color: C.text3,
            textAlign: 'center',
            lineHeight: 1.4,
          }}
        >
          {t('audienceScoringFooter')}
        </div>
      )}
    </>
  );
}

// ─── mobile shell ───────────────────────────────────────────────────────

function MobileShell({
  t,
  headline,
  subtitle,
  asym,
  readyCount,
  referenceUrl,
  isScoring,
  aPlayer,
  bPlayer,
  aReadyFlag,
  bReadyFlag,
}: ShellProps) {
  // Mobile layout now reads top→bottom: header (brand + LIVE/lang), reference
  // strip, headline, then player grid. Reference no longer occupies the right
  // edge of the header row, where it both fought the lang chip for space and
  // pushed the brand pixel into a tight column. Below ~360px the player grid
  // stacks vertically (.ac-grid responsive class) so each card keeps a usable
  // width instead of squishing into a desktop-shrunk thumbnail.
  return (
    <>
      <MinimalTopBar t={t} compact />
      <div style={{ marginTop: 14, width: '100%' }}>
        <Headline
          title={headline}
          subtitle={subtitle}
          badge={asym ? `${readyCount} ${t('audienceReadyOfTwoSuffix')}` : undefined}
          compact
        />
      </div>
      <div
        style={{
          marginTop: 14,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <ReferenceStrip
          src={referenceUrl}
          alt={t('referenceImage')}
          label={t('audienceHedefShort')}
          loadingLabel={t('loadingText')}
        />
      </div>
      <div className="ac-grid" style={{ marginTop: 16, width: '100%' }}>
        <PlayerCard
          slot="A"
          nick={aPlayer?.nickname ?? 'Player A'}
          imageUrl={aPlayer?.imageUrl ?? null}
          ready={aReadyFlag}
          isScoring={isScoring}
          t={t}
          compact
          prompt={aPlayer?.prompt ?? null}
        />
        <PlayerCard
          slot="B"
          nick={bPlayer?.nickname ?? 'Player B'}
          imageUrl={bPlayer?.imageUrl ?? null}
          ready={bReadyFlag}
          isScoring={isScoring}
          t={t}
          compact
          prompt={bPlayer?.prompt ?? null}
        />
      </div>
      {isScoring && (
        <div
          style={{
            marginTop: 14,
            fontSize: 12,
            color: C.text3,
            textAlign: 'center',
            lineHeight: 1.4,
          }}
        >
          {t('audienceScoringFooter')}
        </div>
      )}
    </>
  );
}

// `HedefCorner` (sağ üst köşe referans thumbu) Epic 6 mobil header'ında fixed
// LangToggle ile çakışıyordu — yerine ReferenceStrip eklendi, bu component
// kullanım dışı kaldığı için kaldırıldı.
