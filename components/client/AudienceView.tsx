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

  // Mobile hedef boyutu, kısa ekranlarda (375x667) 180'e düşer.
  const [mHedefSize, setMHedefSize] = useState(200);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const fit = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setMHedefSize(w <= 380 && h <= 700 ? 180 : 200);
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

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
        mHedefSize={mHedefSize}
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
  mHedefSize: number;
}

function AudienceGenerating({ state, t, isScoring, showFallback, mHedefSize }: AudienceGeneratingProps) {
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
      `}</style>
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
            padding: '14px 14px 18px',
            minHeight: '100dvh',
          }}
        >
          <MobileShell {...shellProps} mHedefSize={mHedefSize} />
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
  return (
    <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span
        style={{
          fontFamily: FONT.pixel,
          fontSize: compact ? 11 : 13,
          color: C.bone,
          letterSpacing: '0.08em',
        }}
      >
        {t('brandWordmark').toUpperCase()}
      </span>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
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
        <div
          style={{
            fontFamily: FONT.mono,
            fontSize: compact ? 10 : 11.5,
            lineHeight: compact ? 1.4 : 1.5,
            color: prompt ? C.text2 : C.text4,
            fontStyle: prompt ? 'normal' : 'italic',
            padding: compact ? '7px 9px' : '10px 12px',
            background: SLOT_PROMPT_BG[slot],
            borderLeft: `2px solid ${slotColor}`,
            maxHeight: compact
              ? `calc(${1.4}em * 2 + 14px)`
              : `calc(${1.5}em * 3 + 20px)`,
            overflow: 'hidden',
            WebkitMaskImage: 'linear-gradient(to bottom, #000 78%, transparent 100%)',
            maskImage: 'linear-gradient(to bottom, #000 78%, transparent 100%)',
            wordBreak: 'break-word',
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
}: ShellProps & { mHedefSize: number }) {
  return (
    <>
      <div style={{ width: '100%', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
          <MinimalTopBar t={t} compact />
        </div>
        <HedefCorner src={referenceUrl} alt={t('referenceImage')} label={t('audienceHedefShort')} />
      </div>
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
          marginTop: 18,
          width: '100%',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
          alignItems: 'start',
        }}
      >
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

function HedefCorner({ src, alt, label }: { src: string | null; alt: string; label: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
      <span
        style={{
          fontFamily: FONT.pixel,
          fontSize: 8,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: C.accent,
        }}
      >
        {label}
      </span>
      <div
        style={{
          position: 'relative',
          width: 72,
          height: 72,
          background: '#0f0e14',
          border: `1.5px solid rgba(124,77,255,0.55)`,
          overflow: 'hidden',
        }}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={alt} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div
              className="ac-spinner"
              style={{
                width: 22,
                height: 22,
                border: `2px solid ${C.line}`,
                borderTopColor: C.accent,
                borderRightColor: C.accent,
                borderRadius: '50%',
                animation: 'pcSpin 1.6s linear infinite',
              }}
            />
          </div>
        )}
        {(['tl', 'tr', 'bl', 'br'] as const).map((pos) => {
          const base: CSSProperties = { position: 'absolute', width: 8, height: 8 };
          const s: CSSProperties = { ...base };
          if (pos === 'tl') Object.assign(s, { top: 3, left: 3, borderTop: `1.5px solid ${C.accent}`, borderLeft: `1.5px solid ${C.accent}` });
          if (pos === 'tr') Object.assign(s, { top: 3, right: 3, borderTop: `1.5px solid ${C.accent}`, borderRight: `1.5px solid ${C.accent}` });
          if (pos === 'bl') Object.assign(s, { bottom: 3, left: 3, borderBottom: `1.5px solid ${C.accent}`, borderLeft: `1.5px solid ${C.accent}` });
          if (pos === 'br') Object.assign(s, { bottom: 3, right: 3, borderBottom: `1.5px solid ${C.accent}`, borderRight: `1.5px solid ${C.accent}` });
          return <div key={pos} style={s} />;
        })}
      </div>
    </div>
  );
}
