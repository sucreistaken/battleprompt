'use client';

import { useGameState } from './useGameState';

export function ResultView() {
  const { state } = useGameState();
  if (!state || !state.players.A || !state.players.B) return null;
  const matchNo = state.matchId?.slice(-3).toUpperCase() || '142';
  const { A, B } = state.players;
  const pct = computePct(state);
  const winnerName =
    state.winner === 'TIE' ? 'DRAW' : state.winner === 'A' ? A!.nickname : B!.nickname;
  const winnerColor =
    state.winner === 'A' ? 'tangerine' : state.winner === 'B' ? 'navy' : 'navy';

  return (
    <main className="min-h-screen bg-cream text-navy flex flex-col">
      <header className="bg-navy text-cream px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-sans font-bold text-[10px] tracking-widest2 uppercase">
          <span className="live-dot" />
          OFFICIAL RESULT
        </div>
        <span className="font-sans font-bold text-[10px] tracking-widest2 uppercase text-cream/60">
          MATCH #{matchNo}
        </span>
      </header>

      <section className="px-5 pt-8 pb-4 text-center">
        <div className="font-sans font-bold text-xs tracking-widest3 uppercase text-tangerine">
          ★ WINNER ★
        </div>
        <h1
          className={`mt-2 font-display italic font-black leading-[0.85] tracking-tight ${
            winnerColor === 'tangerine' ? 'text-tangerine' : 'text-navy'
          }`}
          style={{ fontSize: 'clamp(3rem, 18vw, 7rem)' }}
        >
          {winnerName}
        </h1>
        <div className="mt-4 font-display italic font-black text-4xl tabular-nums">
          <span className={state.winner === 'A' ? 'text-tangerine' : 'text-navy/40'}>
            {pct.A}%
          </span>
          <span className="text-navy/30 mx-3 text-2xl">vs</span>
          <span className={state.winner === 'B' ? 'text-navy' : 'text-navy/40'}>
            {pct.B}%
          </span>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 px-5 pb-5">
        {(['A', 'B'] as const).map((slot) => {
          const p = state.players[slot]!;
          const isWinner = state.winner === slot;
          const accent = slot === 'A' ? 'tangerine' : 'navy';
          return (
            <div key={slot} className="relative">
              <div
                className={`absolute inset-0 ${isWinner ? 'translate-x-1.5 translate-y-1.5' : 'translate-x-0.5 translate-y-0.5'} ${accent === 'tangerine' ? 'bg-tangerine' : 'bg-navy'}`}
              />
              <div className="relative bg-cream border-2 border-navy">
                <div className="aspect-square bg-cream-deep overflow-hidden">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-navy/30 text-2xl font-display italic">
                      {p.forfeit ? '×' : '—'}
                    </div>
                  )}
                </div>
                <div className="px-2 py-2 text-center">
                  <div
                    className={`font-sans font-bold text-[10px] tracking-widest2 uppercase ${accent === 'tangerine' ? 'text-tangerine' : 'text-navy'}`}
                  >
                    {slot} · {p.nickname}
                  </div>
                  <div className="font-display italic font-black text-xl text-navy tabular-nums mt-1">
                    {pct[slot]}%
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {state.aiReasoning && (
        <blockquote className="px-5 pb-6 font-display italic text-sm text-navy/70 text-center leading-snug">
          "{state.aiReasoning}"
          <div className="mt-2 font-sans font-bold text-[9px] tracking-widest3 uppercase text-tangerine">
            — Gemini, judge
          </div>
        </blockquote>
      )}

      <footer className="mt-auto px-5 py-3 bg-navy text-cream text-center font-sans font-bold text-[10px] tracking-widest2 uppercase">
        next match opens shortly
      </footer>
    </main>
  );
}

function computePct(state: ReturnType<typeof useGameState>['state']) {
  if (!state || !state.players.A || !state.players.B) return { A: 0, B: 0 };
  if (state.winnerMode === 'AI_SCORE') {
    const a = state.players.A.aiScore ?? 0;
    const b = state.players.B.aiScore ?? 0;
    const tot = a + b || 1;
    return { A: Math.round((a / tot) * 100), B: Math.round((b / tot) * 100) };
  }
  const a = state.votes?.A ?? 0;
  const b = state.votes?.B ?? 0;
  const tot = a + b || 1;
  return { A: Math.round((a / tot) * 100), B: Math.round((b / tot) * 100) };
}
