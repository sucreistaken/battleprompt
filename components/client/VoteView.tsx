'use client';

import { useState } from 'react';
import { useGameState } from './useGameState';
import { CountdownTimer } from './CountdownTimer';
import type { Slot } from '@/types/game';

export function VoteView() {
  const { state, vote } = useGameState();
  const [voted, setVoted] = useState<Slot | null>(null);
  const [busy, setBusy] = useState(false);
  if (!state || !state.players.A || !state.players.B) return null;
  const matchNo = state.matchId?.slice(-3).toUpperCase() || '142';
  const isTiebreak = state.phase === 'TIEBREAK_VOTE';

  async function cast(slot: Slot) {
    if (busy || voted) return;
    setBusy(true);
    const r = await vote(slot);
    setBusy(false);
    if (r.ok) setVoted(slot);
  }

  return (
    <main className="min-h-screen bg-cream text-navy flex flex-col">
      <header className="bg-navy text-cream px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-sans font-bold text-[10px] tracking-widest2 uppercase">
          <span className="live-dot" />
          {isTiebreak ? 'SUDDEN DEATH' : 'AUDIENCE VOTE'}
        </div>
        <div className="flex items-baseline gap-2">
          <CountdownTimer
            endsAt={state.phaseEndsAt}
            className="font-display italic font-black text-2xl tabular-nums text-tangerine"
          />
          <span className="font-sans font-bold text-[10px] tracking-widest2 uppercase text-cream/60">
            sec
          </span>
        </div>
      </header>

      <section className="px-4 pt-5">
        <h1 className="font-display italic font-black text-3xl text-navy leading-tight">
          Who tells it better?
        </h1>
        <div className="font-sans font-bold text-[10px] tracking-widest2 uppercase text-navy/50 mt-1">
          MATCH #{matchNo} · tap your favourite
        </div>
      </section>

      <div className="px-4 mt-5 flex flex-col gap-4 pb-8">
        {(['A', 'B'] as Slot[]).map((slot) => {
          const p = state.players[slot]!;
          const isMine = voted === slot;
          const isOther = voted && voted !== slot;
          const accent = slot === 'A' ? 'tangerine' : 'navy';
          const slotNum = slot === 'A' ? '01' : '02';
          return (
            <button
              key={slot}
              onClick={() => cast(slot)}
              disabled={!!voted || busy}
              className={`relative w-full text-left transition ${
                isOther ? 'opacity-30' : 'active:translate-x-1 active:translate-y-1'
              }`}
            >
              <div className={`absolute inset-0 translate-x-2 translate-y-2 ${accent === 'tangerine' ? 'bg-tangerine' : 'bg-navy'}`} />
              <div className="relative bg-cream border-2 border-navy">
                <div className="aspect-square w-full overflow-hidden bg-cream-deep">
                  {p.imageUrl && (
                    <img src={p.imageUrl} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="px-4 py-3 flex items-baseline justify-between">
                  <span className={`font-sans font-bold text-xs tracking-widest2 uppercase ${accent === 'tangerine' ? 'text-tangerine' : 'text-navy'}`}>
                    {slotNum} · {p.nickname}
                  </span>
                  <span className={`font-display italic font-bold text-sm ${accent === 'tangerine' ? 'text-tangerine' : 'text-navy'}`}>
                    {isMine ? '✓ VOTED' : 'TAP →'}
                  </span>
                </div>
              </div>
              {isMine && (
                <div className="absolute -top-3 -right-3 bg-tangerine text-navy px-3 py-1 font-sans font-bold text-[10px] tracking-widest2 uppercase shadow-offsetNavy">
                  Your Pick
                </div>
              )}
            </button>
          );
        })}
      </div>
    </main>
  );
}
