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
  StageImage,
  CountdownRing,
  useCountdown,
} from '@/components/stage/atmosphere';

/**
 * Spectating view (dark/pixel broadcast language, matches the stage + PromptingView).
 * Handles every non-interactive phase a phone can sit on: VS_INTRO / PROMPTING
 * (watch the two prompts being written, reference on top), GENERATING / SCORING
 * (AI works, shimmer → image), and VOTING / TIEBREAK for players (who watch the
 * audience decide, they can't vote). Responsive single column.
 */
export function AudienceView() {
  const { state, livePrompts } = useGameState();
  const { t } = useI18n();

  // Responsive reference size (ReferenceFrame takes a fixed px size).
  const [refSize, setRefSize] = useState(220);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const fit = () => setRefSize(Math.min(window.innerWidth - 48, 260));
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  const isVotingPhase = state?.phase === 'VOTING' || state?.phase === 'TIEBREAK_VOTE';
  const cd = useCountdown(
    state?.phaseEndsAt ?? null,
    isVotingPhase ? state?.durations.votingDurationSec ?? 20 : state?.durations.promptDurationSec ?? 30,
  );

  if (!state) return null;

  const phase = state.phase;
  const isGenerating = phase === 'GENERATING' || phase === 'SCORING';
  const isPrompting = phase === 'PROMPTING' || phase === 'VS_INTRO';
  const isVoting = phase === 'VOTING' || phase === 'TIEBREAK_VOTE';

  const statusLabel =
    phase === 'GENERATING' ? t('generating') :
    phase === 'SCORING' ? t('aiScoringDots') :
    isVoting ? t('voteHeading') :
    phase === 'PROMPTING' ? t('playersWriting') :
    phase === 'VS_INTRO' ? t('vs') :
    '';

  const showRing = (isPrompting || isVoting) && !!state.phaseEndsAt;

  const strip = (slot: 'A' | 'B') => {
    const p = state.players[slot];
    const color = C.player(slot);
    const live = slot === 'A' ? livePrompts.A : livePrompts.B;
    const submitted = !!p?.submitted;
    const offline = !!p?.disconnected || !!p?.forfeit;
    const metaLabel = isGenerating
      ? phase === 'SCORING'
        ? t('aiScoring')
        : t('aiDrawing')
      : isVoting
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
            <Lbl size={10} color={submitted || isGenerating || isVoting ? 'text3' : (color as string)}>
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
            loadingLabel={phase === 'SCORING' ? t('aiScoringDots') : t('generating')}
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
        style={{ minHeight: '100dvh', background: C.ink, color: C.text, fontFamily: FONT.body }}
        className="flex flex-col"
      >
        <div className="w-full max-w-md mx-auto px-5 pt-5 pb-6 flex-1 flex flex-col gap-4">
          <header className="flex items-center justify-between gap-3">
            <div className="flex flex-col gap-1">
              <Lbl size={11} color="accent">
                {t('audience')}
              </Lbl>
              <span style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 16, color: C.bone }}>
                {statusLabel}
              </span>
              {/* Players land here during VOTING but cannot vote — say so, so the
                  "which is better?" heading doesn't read as a prompt to act. */}
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

          <section className="flex-1 flex flex-col gap-3">
            {strip('A')}
            {strip('B')}
          </section>
        </div>
      </main>
    </>
  );
}
