'use client';

import { useState } from 'react';
import { useGameState } from './useGameState';
import { useI18n } from './i18nContext';
import {
  C,
  FONT,
  StageFonts,
  StageKeyframes,
  Lbl,
  Avatar,
  StageImage,
  CountdownRing,
  useCountdown,
} from '@/components/stage/atmosphere';
import type { Slot } from '@/types/game';

/**
 * VOTING / TIEBREAK_VOTE — audience picks favourite (dark/pixel, matches stage).
 * Two big tappable image cards stacked. Tap fires the vote and locks in with an
 * accent ring; the other card dims. Behaviour unchanged (optimistic + rollback).
 */
export function VoteView() {
  const { state, vote } = useGameState();
  const { t } = useI18n();
  const [voted, setVoted] = useState<Slot | null>(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isTiebreak = state?.phase === 'TIEBREAK_VOTE';
  const duration = isTiebreak
    ? state?.durations.tiebreakDurationSec ?? 10
    : state?.durations.votingDurationSec ?? 20;
  const cd = useCountdown(state?.phaseEndsAt ?? null, duration);

  if (!state) return null;

  const handleVote = async (slot: Slot) => {
    if (voted || working) return;
    setWorking(true);
    setError(null);
    setVoted(slot); // optimistic
    const res = await vote(slot);
    if (!res.ok) {
      setVoted(null);
      setError(t('disconnected'));
    }
    setWorking(false);
  };

  const card = (slot: Slot) => {
    const p = state.players[slot];
    const color = C.player(slot);
    const isVoted = voted === slot;
    const isOther = !!voted && voted !== slot;
    const offline = !!p?.disconnected || !!p?.forfeit;
    return (
      <button
        key={slot}
        type="button"
        onClick={() => handleVote(slot)}
        disabled={!!voted || working}
        aria-pressed={isVoted}
        style={{
          display: 'block',
          width: '100%',
          padding: 0,
          textAlign: 'left',
          background: C.ink2,
          border: `2px solid ${isVoted ? color : C.line}`,
          borderRadius: 14,
          overflow: 'hidden',
          cursor: voted || working ? 'default' : 'pointer',
          opacity: isOther ? 0.42 : 1,
          filter: isOther ? 'grayscale(0.5)' : 'none',
          transition: 'opacity 160ms ease-out, border-color 160ms ease-out, filter 160ms ease-out',
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
          {offline ? (
            <Lbl size={11} color={C.live as string}>
              {p?.forfeit ? t('forfeit') : t('disconnected')}
            </Lbl>
          ) : isVoted ? (
            <span
              style={{
                fontFamily: FONT.pixel,
                fontSize: 11,
                letterSpacing: '0.04em',
                color,
                padding: '4px 9px',
                border: `1px solid ${color}`,
                borderRadius: 4,
              }}
            >
              {t('voted')}
            </span>
          ) : (
            <Lbl size={11} color={color as string}>
              {t('tapPrefix')}
            </Lbl>
          )}
        </div>
        <StageImage src={p?.imageUrl ?? null} alt={p?.nickname ?? slot} accent={color} loadingLabel={t('loadingText')} />
      </button>
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
              <Lbl size={11} color={isTiebreak ? (C.live as string) : 'accent'}>
                {isTiebreak ? t('suddenDeath') : t('audience')}
              </Lbl>
              <span style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 19, color: C.bone }}>
                {t('voteHeading')}
              </span>
            </div>
            <CountdownRing size={56} progress={cd.progress} value={cd.value} danger={cd.danger} stroke={5} />
          </header>

          <section className="flex-1 flex flex-col gap-3">
            {card('A')}
            {card('B')}
            {error && (
              <p role="alert" style={{ color: C.live, textAlign: 'center', fontSize: 13 }}>
                {error}
              </p>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
