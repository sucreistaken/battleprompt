'use client';

import { useGameState } from '@/components/client/useGameState';
import { useI18n } from '@/components/client/i18nContext';
import {
  StageFrame,
  TopBar,
  PixelText,
  Lbl,
  StageImage,
  CountdownRing,
  useCountdown,
  C,
  FONT,
} from './atmosphere';
import type { PlayerSnapshot } from '@/types/game';

/**
 * VOTING / TIEBREAK_VOTE - audience taps on their phones; the stage shows both
 * images, the prompt each player wrote, and the live vote tally per jersey.
 */
export function StageVoting() {
  const { state, livePrompts } = useGameState();
  const { t } = useI18n();
  const isTiebreak = state?.phase === 'TIEBREAK_VOTE';
  const duration = isTiebreak
    ? state?.durations.tiebreakDurationSec ?? 15
    : state?.durations.votingDurationSec ?? 20;
  const cd = useCountdown(state?.phaseEndsAt ?? null, duration);

  if (!state) return null;
  const matchId = state.matchId ? state.matchId.slice(-4).toUpperCase() : '';
  const votesA = state.votes?.A ?? 0;
  const votesB = state.votes?.B ?? 0;
  const total = votesA + votesB;
  const pA = total > 0 ? Math.round((votesA / total) * 100) : 0;
  const pB = total > 0 ? 100 - pA : 0;

  return (
    <StageFrame>
      <TopBar liveLabel={t('live')} matchId={matchId} theme={state.theme} />

      <div
        style={{
          position: 'absolute',
          top: 140,
          left: 60,
          right: 60,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 22 }}>
          <PixelText size={100}>{t('whichLead')}</PixelText>
          <PixelText size={100} color={C.accent}>
            {t('whichTail')}
          </PixelText>
        </div>
        <CountdownRing size={130} progress={cd.progress} value={cd.value} danger={cd.danger} stroke={5} />
      </div>

      <div
        style={{
          position: 'absolute',
          top: 320,
          bottom: 70,
          left: 60,
          right: 60,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 50,
        }}
      >
        <VoteCard letter="A" player={state.players.A} prompt={state.players.A?.prompt ?? livePrompts.A} votes={votesA} percent={pA} />
        <VoteCard letter="B" player={state.players.B} prompt={state.players.B?.prompt ?? livePrompts.B} votes={votesB} percent={pB} />
      </div>
    </StageFrame>
  );
}

function VoteCard({
  letter,
  player,
  prompt,
  votes,
  percent,
}: {
  letter: 'A' | 'B';
  player: PlayerSnapshot | null;
  prompt: string;
  votes: number;
  percent: number;
}) {
  const { t } = useI18n();
  const color = C.player(letter);
  const ink = C.playerInk(letter);
  const name = player?.nickname ?? '-';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', background: C.ink2, border: `1px solid ${color}`, minHeight: 0 }}>
      {/* Jersey header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 22px', background: color, color: ink }}>
        <div
          style={{
            background: ink,
            color,
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: FONT.pixel,
            fontSize: 20,
          }}
        >
          {letter}
        </div>
        <span style={{ fontFamily: FONT.body, fontSize: 22, fontWeight: 700 }}>{name}</span>
        <div style={{ flex: 1 }} />
        <span style={{ fontFamily: FONT.pixel, fontSize: 14, letterSpacing: '0.14em' }}>
          {t('tapPrefix').toUpperCase()} {letter}
        </span>
      </div>

      <StageImage src={player?.imageUrl ?? null} alt={name} accent={color} loadingLabel={t('loadingText')} fill />

      {/* Prompt strip */}
      <div style={{ padding: '14px 22px', background: C.ink3, borderTop: `1px solid ${C.line}`, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Lbl size={10} color="text3">
          {t('promptLabel')}
        </Lbl>
        <div
          style={{
            fontFamily: FONT.mono,
            fontSize: 15,
            lineHeight: 1.45,
            color: C.text,
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', padding: '20px 22px 22px', gap: 8, borderTop: `1px solid ${C.line}` }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Lbl size={11}>{t('votesShort')}</Lbl>
          <PixelText size={88} color={color}>
            {votes}
          </PixelText>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <Lbl size={11}>{t('shareLabel')}</Lbl>
          <div style={{ fontFamily: FONT.pixel, fontSize: 56, color, lineHeight: 1 }}>
            {percent}
            <span style={{ fontSize: 26, color: C.text3 }}>%</span>
          </div>
        </div>
        <div style={{ gridColumn: '1 / -1', marginTop: 10, position: 'relative', height: 6, background: C.line }}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              left: 0,
              width: `${percent}%`,
              background: color,
              transition: 'width 300ms ease-out',
            }}
          />
        </div>
      </div>
    </div>
  );
}
