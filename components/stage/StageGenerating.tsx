'use client';

import { useEffect, useState } from 'react';
import { useGameState } from '@/components/client/useGameState';
import { useI18n } from '@/components/client/i18nContext';
import {
  StageFrame,
  TopBar,
  PixelText,
  Avatar,
  Lbl,
  StageImage,
  ReferenceFrame,
  C,
  FONT,
} from './atmosphere';
import type { PlayerSnapshot } from '@/types/game';

interface Props {
  scoringMode?: boolean;
}

/**
 * GENERATING / SCORING — redesign (2026-05-29).
 * Header + target sit on one row (left/right) so vertical real estate goes
 * to the player cards — the actual stars of this phase. Each card shows the
 * full produced image (object-fit:contain, no crop) once it lands; while it
 * renders, a "render portal" with a rotating status + 3-step progress lives
 * there instead. The player's actual prompt is squeezed into the footer
 * (line-clamped), labelled "[name] böyle tarif etti".
 */
export function StageGenerating({ scoringMode }: Props) {
  const { state, livePrompts } = useGameState();
  const { t } = useI18n();
  if (!state) return null;

  const matchId = state.matchId ? state.matchId.slice(-4).toUpperCase() : '';
  const players = (['A', 'B'] as const).map((slot) => ({
    slot,
    player: state.players[slot],
    prompt: state.players[slot]?.prompt ?? livePrompts[slot],
    done: !!(scoringMode && state.players[slot]?.imageUrl),
  }));
  const readyCount = players.filter((p) => p.done).length;

  return (
    <StageFrame>
      {/* Bu phase'de kategori/zorluk hedefin yanında gösteriliyor; TopBar'a geçmiyoruz ki tekrar olmasın. */}
      <TopBar liveLabel={t('live')} matchId={matchId} />

      <div
        style={{
          position: 'absolute',
          top: 100,
          left: 60,
          right: 60,
          bottom: 52,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        {/* Header row: title + subtitle + progress on the left, target on the right */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 30 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 18 }}>
              <PixelText size={50}>{t('aiHeadLead')}</PixelText>
              <PixelText size={50} color={C.accent}>
                {scoringMode ? t('aiHeadScoring') : t('aiHeadWorking')}
              </PixelText>
            </div>
            <span style={{ fontFamily: FONT.body, fontSize: 16, color: C.text3 }}>
              {t('aiDrawingSubtitle')}
            </span>
            <div style={{ width: 360, marginTop: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                <Lbl size={11} color="text2">{t('aiProgressLabel')}</Lbl>
                <Lbl size={10} color="text4">{readyCount} / 2 {t('readyWord')}</Lbl>
              </div>
              <div style={{ position: 'relative', height: 6, background: C.line, overflow: 'hidden' }}>
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    width: readyCount === 2 ? '100%' : '34%',
                    background: C.accent,
                    transition: 'width 400ms ease-out',
                    animation: readyCount === 2 ? 'none' : 'pcShimmer 1.6s ease-in-out infinite',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Target */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: 8,
                textAlign: 'right',
              }}
            >
              <div style={{ display: 'flex', gap: 7 }}>
                {state.roundCategoryLabel && (
                  <span
                    style={{
                      fontFamily: FONT.mono,
                      fontSize: 11,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      color: C.text3,
                      border: `1px solid ${C.line}`,
                      padding: '3px 9px',
                    }}
                  >
                    {state.roundCategoryLabel}
                  </span>
                )}
                {state.roundDifficultyLabel && (
                  <span
                    style={{
                      fontFamily: FONT.mono,
                      fontSize: 11,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      background: C.live,
                      color: '#fff',
                      padding: '3px 9px',
                      fontWeight: 700,
                    }}
                  >
                    {state.roundDifficultyLabel}
                  </span>
                )}
              </div>
              <Lbl size={11} color="text2">{t('referenceImage')}</Lbl>
              <span style={{ fontFamily: FONT.body, fontSize: 12, color: C.text4, maxWidth: 230 }}>
                {t('targetCompareCopy')}
              </span>
            </div>
            <ReferenceFrame
              src={state.referenceImageUrl}
              alt={t('referenceImage')}
              size={150}
              loadingLabel={t('loadingText')}
            />
          </div>
        </div>

        {/* Player cards */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, minHeight: 0 }}>
          {players.map(({ slot, player, prompt, done }) => (
            <PlayerCard key={slot} letter={slot} player={player} prompt={prompt} done={done} />
          ))}
        </div>
      </div>
    </StageFrame>
  );
}

function PlayerCard({
  letter,
  player,
  prompt,
  done,
}: {
  letter: 'A' | 'B';
  player: PlayerSnapshot | null;
  prompt: string;
  done: boolean;
}) {
  const { t } = useI18n();
  const color = C.player(letter);
  const name = player?.nickname ?? '-';

  return (
    <div
      style={{
        position: 'relative',
        background: C.ink2,
        border: `1px solid ${C.line}`,
        borderTop: `4px solid ${color}`,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '14px 20px',
          background: C.ink3,
          borderBottom: `1px solid ${C.line}`,
          flex: 'none',
        }}
      >
        <Avatar letter={letter} size={38} player={letter} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Lbl size={10} color="text3">{t('playerLabel')} {letter}</Lbl>
          <span style={{ fontFamily: FONT.body, fontSize: 21, fontWeight: 700, color: C.bone, lineHeight: 1 }}>
            {name}
          </span>
        </div>
        <div style={{ flex: 1 }} />
        <StatusPill done={done} color={color} />
      </div>

      {/* Body: rendered image (contain, no crop) when done — else render portal */}
      {done && player?.imageUrl ? (
        <StageImage
          src={player.imageUrl}
          alt={name}
          accent={color}
          loadingLabel={t('aiDrawing')}
          fill
          objectFit="contain"
        />
      ) : (
        <RenderPortal color={color} />
      )}

      {/* Prompt footer (real user prompt, 2-line clamp) */}
      <div
        style={{
          padding: '13px 20px',
          borderTop: `1px solid ${C.line}`,
          display: 'flex',
          flexDirection: 'column',
          gap: 5,
          flex: 'none',
        }}
      >
        <Lbl size={10} color="text3">{name} {t('askedForLabel')}</Lbl>
        <div
          style={{
            fontFamily: FONT.mono,
            fontSize: 15,
            lineHeight: 1.45,
            color: C.text2,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {prompt || '-'}
        </div>
      </div>
    </div>
  );
}

function StatusPill({ done, color }: { done: boolean; color: string }) {
  const { t } = useI18n();
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 12px',
        border: `1px solid ${done ? color : C.line2}`,
        color: done ? color : C.text2,
        fontFamily: FONT.mono,
        fontSize: 11,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: color,
          animation: done ? 'none' : 'pcLivePulse 1.3s ease-in-out infinite',
        }}
      />
      {done ? t('statusReady') : t('statusPreparing')}
    </span>
  );
}

function RenderPortal({ color }: { color: string }) {
  const { t } = useI18n();
  const labels = [t('portalStep1'), t('portalStep2'), t('portalStep3')];
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % labels.length), 2400);
    return () => clearInterval(id);
  }, [labels.length]);

  return (
    <div
      style={{
        flex: 1,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        background: `radial-gradient(circle at 50% 42%, color-mix(in srgb, ${color} 9%, transparent) 0%, transparent 60%), ${C.ink}`,
        overflow: 'hidden',
        minHeight: 0,
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          width: '34%',
          mixBlendMode: 'screen',
          background: `linear-gradient(90deg, transparent, color-mix(in srgb, ${color} 16%, transparent), transparent)`,
          animation: 'pcShimmer 2.2s linear infinite',
        }}
      />
      <div
        style={{
          width: 84,
          height: 84,
          borderRadius: '50%',
          border: `3px solid ${C.line}`,
          borderTopColor: color,
          borderRightColor: color,
          animation: 'pcSpin 1.15s linear infinite',
        }}
      />
      <span
        style={{
          fontFamily: FONT.mono,
          fontSize: 13,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: C.text2,
          minHeight: '1.2em',
        }}
      >
        {labels[idx]}
      </span>
      <Steps activeIdx={1} color={color} />
    </div>
  );
}

function Steps({ activeIdx, color }: { activeIdx: 0 | 1 | 2; color: string }) {
  const { t } = useI18n();
  const items = [
    { label: t('stepPromptReceived'), state: 0 < activeIdx ? 'done' : activeIdx === 0 ? 'now' : 'idle' },
    { label: t('stepImageRendering'), state: 1 < activeIdx ? 'done' : activeIdx === 1 ? 'now' : 'idle' },
    { label: t('stepReadyToCompare'), state: 2 < activeIdx ? 'done' : activeIdx === 2 ? 'now' : 'idle' },
  ] as const;
  const colorFor = (s: string) => (s === 'now' ? color : s === 'done' ? C.text2 : C.text4);

  return (
    <div style={{ display: 'flex', alignItems: 'center', fontFamily: FONT.mono, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
      {items.map((it, i) => (
        <span key={i} style={{ display: 'inline-flex', alignItems: 'center' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, color: colorFor(it.state) }}>
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                border: '1.5px solid currentColor',
                background: it.state === 'idle' ? 'transparent' : 'currentColor',
              }}
            />
            {it.label}
          </span>
          {i < items.length - 1 && <span style={{ width: 24, height: 1, background: C.line, margin: '0 10px' }} />}
        </span>
      ))}
    </div>
  );
}
