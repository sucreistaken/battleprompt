'use client';

import { useGameState } from './useGameState';
import { CountdownTimer } from './CountdownTimer';

export function AudienceView() {
  const { state } = useGameState();
  if (!state) return null;
  const matchNo = state.matchId?.slice(-3).toUpperCase() || '142';

  return (
    <main className="min-h-screen bg-cream text-navy flex flex-col">
      <header className="bg-navy text-cream px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-sans font-bold text-[10px] tracking-widest2 uppercase">
          <span className="live-dot" />
          LIVE · AUDIENCE
        </div>
        <span className="font-sans font-bold text-[10px] tracking-widest2 uppercase text-cream/60">
          MATCH #{matchNo}
        </span>
      </header>

      <section className="px-5 py-10 flex-1 flex flex-col items-center justify-center text-center">
        <div className="font-sans font-bold text-xs tracking-widest3 uppercase text-tangerine">
          NOW PLAYING
        </div>
        <h1 className="mt-3 font-display italic font-black text-4xl leading-[0.9] tracking-tight max-w-xs">
          {state.players.A?.nickname || '—'}
          <span className="block text-tangerine text-2xl my-1 not-italic font-sans tracking-widest2">
            vs
          </span>
          {state.players.B?.nickname || '—'}
        </h1>

        <p className="mt-6 font-display italic text-lg text-navy/70">
          {phaseLabel(state.phase)}
        </p>

        {state.phaseEndsAt && (
          <div className="mt-6 flex items-baseline gap-2">
            <CountdownTimer
              endsAt={state.phaseEndsAt}
              className="font-display italic font-black text-7xl text-tangerine tabular-nums"
            />
            <span className="font-sans font-bold text-xs tracking-widest2 uppercase text-navy/50">
              sec
            </span>
          </div>
        )}

        {state.referenceImageUrl && state.phase !== 'IDLE' && (
          <div className="mt-8 w-full max-w-xs relative">
            <div className="absolute inset-0 translate-x-1.5 translate-y-1.5 bg-navy" />
            <img
              src={state.referenceImageUrl}
              className="relative w-full aspect-square object-cover"
            />
            <div className="mt-3 font-sans font-bold text-[10px] tracking-widest2 uppercase text-navy/50">
              REFERENCE · {(state.theme || '').toUpperCase().slice(0, 24)}
            </div>
          </div>
        )}
      </section>

      <footer className="px-5 pb-6 text-center font-sans font-bold text-[10px] tracking-widest2 uppercase text-navy/40">
        you can join next match · stay tuned
      </footer>
    </main>
  );
}

function phaseLabel(phase: string) {
  switch (phase) {
    case 'VS_INTRO':
      return 'fight intro · 5 seconds';
    case 'PROMPTING':
      return 'players are typing…';
    case 'GENERATING':
      return 'AI is drawing both entries…';
    case 'SCORING':
      return 'judges deciding…';
    case 'VOTING':
      return 'audience vote · go!';
    case 'TIEBREAK_VOTE':
      return 'sudden death';
    case 'RESULT':
      return 'winner declared';
    default:
      return '';
  }
}
