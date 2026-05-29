'use client';

import { useGameState } from './useGameState';
import { useI18n } from './i18nContext';
import { C, FONT, StageFonts, StageKeyframes, Lbl, Avatar, StageImage, ReferenceFrame } from '@/components/stage/atmosphere';

/**
 * RESULT — winner reveal (dark/pixel, matches the stage). Big pixel headline
 * (KAZANAN / BERABERE), winner card ringed in their colour + score/votes, loser
 * dimmed. AI reasoning panel shown when the match was decided by AI score.
 */
export function ResultView() {
  const { state, mySlot } = useGameState();
  const { t } = useI18n();

  if (!state) return null;

  const isTie = state.winner === 'TIE';
  const winnerSlot = state.winner === 'A' ? 'A' : state.winner === 'B' ? 'B' : null;
  const winner = winnerSlot ? state.players[winnerSlot] : null;
  const aiMode = state.winnerMode === 'AI_SCORE';

  const card = (slot: 'A' | 'B') => {
    const p = state.players[slot];
    const color = C.player(slot);
    const isWinner = !isTie && winnerSlot === slot;
    const isLoser = !isTie && !!winnerSlot && winnerSlot !== slot;
    const metric = aiMode ? p?.aiScore ?? null : state.votes ? state.votes[slot] : null;

    return (
      <div
        key={slot}
        style={{
          background: C.ink2,
          border: `2px solid ${isWinner ? color : C.line}`,
          borderRadius: 14,
          overflow: 'hidden',
          opacity: isLoser ? 0.5 : 1,
          filter: isLoser ? 'grayscale(0.45)' : 'none',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '11px 14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar letter={slot} size={34} player={slot} />
            <span style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 15, color: C.bone }}>
              {p?.nickname ?? `Player ${slot}`}
            </span>
          </div>
          {isWinner && <span style={{ fontSize: 18 }}>👑</span>}
        </div>

        <StageImage src={p?.imageUrl ?? null} alt={p?.nickname ?? slot} accent={color} loadingLabel={t('loadingText')} dim={isLoser} objectFit="contain" />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '11px 14px',
            borderTop: `1px solid ${C.line}`,
          }}
        >
          <Lbl size={10}>{aiMode ? t('aiPoints') : t('votesShort')}</Lbl>
          <span
            style={{
              fontFamily: FONT.pixel,
              fontVariantNumeric: 'tabular-nums',
              fontSize: 22,
              color: isWinner ? color : C.text2,
            }}
          >
            {metric ?? '—'}
          </span>
        </div>
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
        <div className="w-full max-w-md mx-auto px-5 pt-6 pb-6 flex-1 flex flex-col gap-4">
          <section className="flex flex-col items-center gap-2 text-center">
            <Lbl size={11} color="accent">
              {aiMode ? t('aiScore') : t('audienceVote')}
            </Lbl>
            <span
              style={{
                fontFamily: FONT.pixel,
                fontSize: 46,
                lineHeight: 1,
                color: isTie ? C.bone : C.accent,
              }}
            >
              {isTie ? t('tie') : t('winner')}
            </span>
            {!isTie && winner && (
              <span style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 22, color: C.bone }}>
                {winner.nickname}
              </span>
            )}
          </section>

          {state.referenceImageUrl && (
            <section className="flex flex-col items-center gap-1.5">
              <ReferenceFrame
                src={state.referenceImageUrl}
                alt={t('referenceImage')}
                size={132}
                loadingLabel={t('loadingText')}
              />
              <Lbl size={10}>{t('referenceImage')}</Lbl>
            </section>
          )}

          {state.targetPrompt && (
            <section
              style={{
                background: C.ink2,
                border: `1px solid ${C.accent}`,
                borderLeft: `3px solid ${C.accent}`,
                borderRadius: 12,
                padding: 14,
              }}
            >
              <Lbl size={10} color="accent">
                {t('truePromptLabel')}
              </Lbl>
              <p style={{ fontFamily: FONT.mono, fontSize: 13, lineHeight: 1.5, color: C.text, marginTop: 8 }}>
                {state.targetPrompt}
              </p>
            </section>
          )}

          <section className="flex-1 flex flex-col gap-3">
            {card('A')}
            {card('B')}

            {aiMode && state.aiReasoning && (
              <div style={{ background: C.ink2, border: `1px solid ${C.line}`, borderRadius: 12, padding: 14 }}>
                <Lbl size={10}>{t('aiEvaluation')}</Lbl>
                <p style={{ fontFamily: FONT.body, fontSize: 13, lineHeight: 1.6, color: C.text2, marginTop: 8 }}>
                  {state.aiReasoning}
                </p>
              </div>
            )}
          </section>

          {/* Players get an explicit re-entry CTA (returning to the join surface
              re-queues them for the next match); the audience just waits. */}
          {mySlot ? (
            <button
              type="button"
              onClick={() => window.location.assign('/')}
              style={{
                width: '100%',
                height: 56,
                borderRadius: 14,
                border: 'none',
                background: C.player(mySlot),
                color: C.playerInk(mySlot),
                fontFamily: FONT.pixel,
                fontSize: 15,
                letterSpacing: '0.06em',
                cursor: 'pointer',
              }}
            >
              {t('playAgain').toUpperCase()}
            </button>
          ) : (
            <p style={{ textAlign: 'center', fontSize: 12, color: C.text4 }}>{t('backToIdle')}</p>
          )}
        </div>
      </main>
    </>
  );
}
