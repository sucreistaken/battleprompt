'use client';

import { useGameState } from '@/components/client/useGameState';
import { useI18n } from '@/components/client/i18nContext';
import { StageChrome } from '@/components/ui/StageChrome';
import { Ticker } from '@/components/ui/Ticker';
import { InkCrown, InkWing, ActionBurst, InkStar, ScribbleUnderline } from '@/components/ui/Doodles';

export function StageResult() {
  const { state } = useGameState();
  const { t } = useI18n();
  if (!state || !state.players.A || !state.players.B) return null;
  const matchNo = state.matchId?.slice(-3).toUpperCase() || '142';
  const { players, winner } = state;

  const a = state.winnerMode === 'AI_SCORE' ? players.A!.aiScore ?? 0 : state.votes?.A ?? 0;
  const b = state.winnerMode === 'AI_SCORE' ? players.B!.aiScore ?? 0 : state.votes?.B ?? 0;
  const tot = a + b || 1;
  const aPct = Math.round((a / tot) * 100);
  const bPct = 100 - aPct;
  const winnerName =
    winner === 'TIE' ? 'DRAW' : winner === 'A' ? players.A!.nickname : players.B!.nickname;
  const winnerColor = winner === 'A' ? 'tangerine' : winner === 'B' ? 'navy' : 'navy';

  return (
    <StageChrome matchNo={matchNo}>
      <main className="relative grid grid-cols-[1fr_2fr_1fr] gap-0 min-h-[calc(100vh-180px)]">
        {/* LEFT — Player A small card */}
        <ResultMini
          slot="A"
          nickname={players.A!.nickname}
          imageUrl={players.A!.imageUrl}
          pct={aPct}
          isWinner={winner === 'A'}
          accent="tangerine"
        />

        {/* CENTER — winner spotlight */}
        <section className="relative bg-cream-deep flex flex-col items-center justify-center px-12 py-16">
          {/* Banner */}
          <div className="font-sans font-bold text-xs tracking-widest3 uppercase text-tangerine">
            ★ WINNER · MATCH #{matchNo} ★
          </div>

          {/* Hand-drawn crown above winner */}
          {winner !== 'TIE' && (
            <InkCrown
              className={`w-32 h-20 ${winnerColor === 'tangerine' ? 'text-tangerine' : 'text-navy'}`}
              style={{ transform: 'rotate(-4deg)' }}
            />
          )}

          {/* Mega italic winner name flanked by wings */}
          <div className="relative flex items-center justify-center gap-6 mt-2">
            {winner !== 'TIE' && (
              <InkWing
                className={`hidden md:block w-32 h-20 ${winnerColor === 'tangerine' ? 'text-tangerine' : 'text-navy'} scale-x-[-1]`}
              />
            )}
            <h1
              className={`relative font-display italic font-black text-center leading-[0.85] tracking-tight ${
                winnerColor === 'tangerine' ? 'text-tangerine' : 'text-navy'
              }`}
              style={{ fontSize: 'clamp(5rem, 12vw, 11rem)' }}
            >
              {winnerName}
              <ScribbleUnderline
                className={`block w-40 h-3 mx-auto mt-2 ${winnerColor === 'tangerine' ? 'text-tangerine' : 'text-navy'}`}
              />
            </h1>
            {winner !== 'TIE' && (
              <InkWing
                className={`hidden md:block w-32 h-20 ${winnerColor === 'tangerine' ? 'text-tangerine' : 'text-navy'}`}
              />
            )}
          </div>

          {/* Score */}
          <div className="mt-8 flex items-baseline gap-6 font-display italic font-black tabular-nums">
            <span className={`text-6xl ${winner === 'A' ? 'text-tangerine' : 'text-navy/40'}`}>
              {aPct}%
            </span>
            <span className="text-2xl text-navy/30">vs</span>
            <span className={`text-6xl ${winner === 'B' ? 'text-navy' : 'text-navy/40'}`}>
              {bPct}%
            </span>
          </div>

          {/* AI reasoning quote */}
          {state.aiReasoning && (
            <blockquote className="mt-8 max-w-2xl text-center font-display italic text-lg text-navy/70 leading-snug">
              "{state.aiReasoning}"
              <div className="mt-3 font-sans font-bold text-[10px] tracking-widest3 uppercase text-tangerine">
                — Gemini, judge
              </div>
            </blockquote>
          )}

          {/* Next match countdown */}
          <div className="absolute bottom-8 inset-x-0 text-center font-sans font-bold text-[11px] tracking-widest2 uppercase text-navy/50">
            New match starts when 2 players join
          </div>
        </section>

        {/* RIGHT — Player B small card */}
        <ResultMini
          slot="B"
          nickname={players.B!.nickname}
          imageUrl={players.B!.imageUrl}
          pct={bPct}
          isWinner={winner === 'B'}
          accent="navy"
        />
      </main>

      <Ticker
        items={[
          <span key="1" className="flex items-center gap-2">
            <span className="live-dot" /> LIVE
          </span>,
          winner === 'TIE'
            ? 'OFFICIAL · DRAW DECLARED'
            : `OFFICIAL · ${winnerName?.toUpperCase()} TAKES THE WIN`,
          `MATCH #${matchNo} CONCLUDED`,
          'NEXT MATCH STANDING BY · SCAN TO JOIN'
        ]}
      />
    </StageChrome>
  );
}

function ResultMini({
  slot,
  nickname,
  imageUrl,
  pct,
  isWinner,
  accent
}: {
  slot: 'A' | 'B';
  nickname: string;
  imageUrl: string | null | undefined;
  pct: number;
  isWinner: boolean;
  accent: 'tangerine' | 'navy';
}) {
  const accentBg = accent === 'tangerine' ? 'bg-tangerine' : 'bg-navy';
  const accentText = accent === 'tangerine' ? 'text-tangerine' : 'text-navy';
  const slotNum = slot === 'A' ? '01' : '02';

  return (
    <section className="relative bg-cream flex flex-col items-stretch px-8 py-10">
      <div className={`flex items-baseline justify-between mb-3 ${accentText}`}>
        <span className="font-sans font-bold text-xs tracking-widest2 uppercase">
          {slotNum} · {nickname}
        </span>
        {isWinner && (
          <span className={`${accentBg} text-cream px-2 py-0.5 font-sans font-bold text-[10px] tracking-widest2 uppercase`}>
            Champion
          </span>
        )}
      </div>
      <div className="relative w-full aspect-square">
        <div className={`absolute inset-0 ${isWinner ? 'translate-x-2 translate-y-2' : 'translate-x-1 translate-y-1'} ${accentBg}`} />
        <div className="relative w-full h-full bg-cream-deep overflow-hidden">
          {imageUrl ? (
            <img src={imageUrl} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full grid place-items-center text-navy/20 font-display italic">
              —
            </div>
          )}
        </div>
      </div>
      <div className={`mt-4 font-display italic font-black text-5xl tabular-nums ${isWinner ? accentText : 'text-navy/40'}`}>
        {pct}%
      </div>
    </section>
  );
}
