'use client';

import { motion } from 'framer-motion';
import { useGameState } from '@/components/client/useGameState';
import { useI18n } from '@/components/client/i18nContext';
import {
  StageFrame,
  TopBar,
  PixelText,
  LetterCascade,
  Avatar,
  Lbl,
  StageImage,
  C,
  FONT,
} from './atmosphere';
import type { PlayerSnapshot } from '@/types/game';

const EASE_BACK: [number, number, number, number] = [0.34, 1.56, 0.64, 1];

/**
 * RESULT - winner reveal headline + WON BY callout, both images and prompts
 * visible so the room can compare. Loser card is dimmed, not hidden. Falls
 * back to a TIE headline. Score source follows the winner mode (AI vs votes).
 */
export function StageResult() {
  const { state, livePrompts } = useGameState();
  const { t } = useI18n();
  if (!state) return null;

  const aiMode = state.winnerMode === 'AI_SCORE';
  const matchId = state.matchId ? state.matchId.slice(-4).toUpperCase() : '';
  const isTie = state.winner === 'TIE';
  const winnerLetter: 'A' | 'B' | null = state.winner === 'A' ? 'A' : state.winner === 'B' ? 'B' : null;

  const metric = (letter: 'A' | 'B') =>
    aiMode ? state.players[letter]?.aiScore ?? 0 : state.votes?.[letter] ?? 0;
  const mA = metric('A');
  const mB = metric('B');
  const total = mA + mB;
  const pA = total > 0 ? Math.round((mA / total) * 100) : 0;
  const pB = total > 0 ? 100 - pA : 0;
  const margin = Math.abs(pA - pB);

  const winColor = winnerLetter ? C.player(winnerLetter) : C.accent;
  const winInk = winnerLetter ? C.playerInk(winnerLetter) : C.accentInk;
  const winName = (winnerLetter ? state.players[winnerLetter]?.nickname ?? '' : '').toUpperCase();

  return (
    <StageFrame>
      <TopBar liveLabel={t('live')} matchId={matchId} theme={state.theme} />

      {/* Headline band */}
      <div
        style={{
          position: 'absolute',
          top: 140,
          left: 60,
          right: 60,
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          gap: 60,
          alignItems: 'flex-end',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {isTie ? (
            <LetterCascade text={t('tie').toUpperCase()} size={140} />
          ) : (
            <>
              <LetterCascade text={t('winner').toUpperCase()} size={140} color={winColor} />
              {winName && <LetterCascade text={winName} size={88} baseDelay={0.4} />}
            </>
          )}
        </div>

        {!isTie && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.36, ease: EASE_BACK, delay: 0.7 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: 14,
              padding: '22px 32px',
              background: winColor,
              color: winInk,
            }}
          >
            <span style={{ fontFamily: FONT.pixel, fontSize: 14, letterSpacing: '0.12em' }}>
              {t('wonByLabel').toUpperCase()}
            </span>
            <span style={{ fontFamily: FONT.pixel, fontSize: 120, lineHeight: 0.9 }}>
              +{margin}
              <span style={{ fontSize: 60 }}>%</span>
            </span>
            <span style={{ fontFamily: FONT.mono, fontSize: 14, letterSpacing: '0.1em' }}>
              {aiMode ? `${mA} - ${mB}` : `${mA} - ${mB} ${t('votesWord')}`}
            </span>
          </motion.div>
        )}
      </div>

      {/* Card grid */}
      <div
        style={{
          position: 'absolute',
          top: 470,
          bottom: 70,
          left: 60,
          right: 60,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 50,
          alignItems: 'stretch',
        }}
      >
        <ResultCard
          letter="A"
          player={state.players.A}
          prompt={state.players.A?.prompt ?? livePrompts.A}
          metric={mA}
          percent={pA}
          metricLabel={aiMode ? t('aiPoints') : t('finalVotesLabel')}
          winner={!isTie && winnerLetter === 'A'}
          neutral={isTie}
        />
        <ResultCard
          letter="B"
          player={state.players.B}
          prompt={state.players.B?.prompt ?? livePrompts.B}
          metric={mB}
          percent={pB}
          metricLabel={aiMode ? t('aiPoints') : t('finalVotesLabel')}
          winner={!isTie && winnerLetter === 'B'}
          neutral={isTie}
        />
      </div>

      {/* AI reasoning strip */}
      {aiMode && state.aiReasoning && (
        <div
          style={{
            position: 'absolute',
            bottom: 18,
            left: 60,
            right: 60,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <Lbl size={10} color="text3">
            {t('aiEvaluation')}
          </Lbl>
          <div
            style={{
              fontFamily: FONT.mono,
              fontSize: 14,
              color: C.text2,
              lineHeight: 1.4,
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {state.aiReasoning}
          </div>
        </div>
      )}
    </StageFrame>
  );
}

function ResultCard({
  letter,
  player,
  prompt,
  metric,
  percent,
  metricLabel,
  winner,
  neutral,
}: {
  letter: 'A' | 'B';
  player: PlayerSnapshot | null;
  prompt: string;
  metric: number;
  percent: number;
  metricLabel: string;
  winner: boolean;
  neutral: boolean;
}) {
  const { t } = useI18n();
  const color = C.player(letter);
  const ink = C.playerInk(letter);
  const name = player?.nickname ?? '-';
  const dim = !winner && !neutral;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', border: winner ? `2px solid ${color}` : `1px solid ${C.line}`, background: C.ink2, minHeight: 0 }}>
      {/* Jersey stripe */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 22px',
          background: color,
          color: ink,
          opacity: dim ? 0.55 : 1,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Avatar letter={letter} size={36} player={letter} />
          <span style={{ fontFamily: FONT.body, fontSize: 22, fontWeight: 700, color: ink }}>{name}</span>
        </div>
        {winner && <span style={{ fontFamily: FONT.pixel, fontSize: 18, letterSpacing: '0.08em' }}>★ {t('winner')}</span>}
      </div>

      <StageImage src={player?.imageUrl ?? null} alt={name} accent={color} loadingLabel={t('loadingText')} dim={dim} fill />

      {/* Prompt */}
      <div style={{ padding: '14px 22px', background: C.ink3, borderTop: `1px solid ${C.line}`, display: 'flex', flexDirection: 'column', gap: 6, opacity: dim ? 0.72 : 1 }}>
        <Lbl size={10} color="text3">
          {t('promptLabel')}
        </Lbl>
        <div
          style={{
            fontFamily: FONT.mono,
            fontSize: 15,
            lineHeight: 1.45,
            color: winner ? C.text : C.text2,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {prompt || '-'}
        </div>
      </div>

      {/* Score band */}
      <div style={{ padding: '20px 24px 22px', display: 'grid', gridTemplateColumns: '1fr auto', gap: 4, borderTop: `1px solid ${C.line}` }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Lbl size={11}>{metricLabel}</Lbl>
          <PixelText size={76} color={winner || neutral ? color : C.text2}>
            {metric}
          </PixelText>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <Lbl size={11}>{t('shareLabel')}</Lbl>
          <div style={{ fontFamily: FONT.pixel, fontSize: 48, color: winner || neutral ? color : C.text3, lineHeight: 1 }}>
            {percent}
            <span style={{ fontSize: 22, color: C.text3 }}>%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
