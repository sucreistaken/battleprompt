'use client';

import { useGameState } from '@/components/client/useGameState';
import { StageChrome } from '@/components/ui/StageChrome';
import { Ticker } from '@/components/ui/Ticker';
import { CountdownTimer } from '@/components/client/CountdownTimer';
import { ActionBurst, ScribbleUnderline, ScribbleArrow, InkStar } from '@/components/ui/Doodles';

export function StageVoting({ scoringMode = false }: { scoringMode?: boolean }) {
  const { state } = useGameState();
  if (!state) return null;
  const matchNo = state.matchId?.slice(-3).toUpperCase() || '142';
  const isTiebreak = state.phase === 'TIEBREAK_VOTE';

  const aRaw = scoringMode ? state.players.A?.aiScore ?? 0 : state.votes?.A ?? 0;
  const bRaw = scoringMode ? state.players.B?.aiScore ?? 0 : state.votes?.B ?? 0;
  const tot = aRaw + bRaw || 1;
  const aPct = Math.round((aRaw / tot) * 100);
  const bPct = 100 - aPct;
  const totalVotes = (state.votes?.A ?? 0) + (state.votes?.B ?? 0);

  return (
    <StageChrome matchNo={matchNo}>
      <main className="relative grid grid-cols-2 gap-0 min-h-[calc(100vh-180px)]">
        {/* Banner across top */}
        <div className="col-span-2 bg-navy text-cream px-14 py-6 flex items-center justify-between">
          <div>
            <div className="font-sans font-bold text-[11px] tracking-widest3 uppercase text-tangerine">
              {scoringMode ? 'AI Judgment' : isTiebreak ? 'Sudden Death' : 'Audience Vote'}
            </div>
            <div className="font-display italic font-bold text-4xl mt-1">
              {scoringMode
                ? 'Gemini deciding…'
                : isTiebreak
                  ? 'Audience breaks the tie'
                  : 'Who tells it better?'}
            </div>
          </div>
          {state.phaseEndsAt && (
            <div className="flex items-baseline gap-3">
              <CountdownTimer
                endsAt={state.phaseEndsAt}
                className="font-display italic font-black text-7xl text-tangerine tabular-nums"
              />
              <span className="font-sans font-bold text-xs tracking-widest2 uppercase text-cream/60">
                sec
              </span>
            </div>
          )}
        </div>

        {/* LEFT — Player A */}
        <VoteCard
          slot="A"
          nickname={state.players.A?.nickname}
          imageUrl={state.players.A?.imageUrl}
          pct={aPct}
          raw={aRaw}
          accent="tangerine"
          isScore={scoringMode}
        />

        {/* RIGHT — Player B */}
        <VoteCard
          slot="B"
          nickname={state.players.B?.nickname}
          imageUrl={state.players.B?.imageUrl}
          pct={bPct}
          raw={bRaw}
          accent="navy"
          isScore={scoringMode}
        />
      </main>

      <Ticker
        items={[
          <span key="1" className="flex items-center gap-2">
            <span className="live-dot" /> LIVE
          </span>,
          scoringMode
            ? 'AI JUDGE · COMPARING TO REFERENCE'
            : `AUDIENCE VOTE · ${totalVotes} CAST`,
          isTiebreak ? 'SUDDEN DEATH 10 SECONDS' : 'TAP YOUR FAVOURITE',
          `MATCH #${matchNo}`
        ]}
      />
    </StageChrome>
  );
}

function VoteCard({
  slot,
  nickname,
  imageUrl,
  pct,
  raw,
  accent,
  isScore
}: {
  slot: 'A' | 'B';
  nickname: string | undefined;
  imageUrl: string | null | undefined;
  pct: number;
  raw: number;
  accent: 'tangerine' | 'navy';
  isScore: boolean;
}) {
  const accentBg = accent === 'tangerine' ? 'bg-tangerine' : 'bg-navy';
  const accentText = accent === 'tangerine' ? 'text-tangerine' : 'text-navy';
  const textOn = accent === 'tangerine' ? 'text-navy' : 'text-cream';
  const slotNum = slot === 'A' ? '01' : '02';

  return (
    <section className="relative px-12 py-12">
      <div className="flex items-baseline justify-between mb-5 relative">
        <div className={`font-sans font-bold text-xs tracking-widest2 uppercase ${accentText}`}>
          {slotNum} · {nickname || '—'}
          <ScribbleUnderline className={`block w-24 h-1.5 ${accentText}`} />
        </div>
        <div className={`relative ${accentBg} ${textOn} px-4 py-1.5 font-display italic font-black text-2xl tabular-nums`}>
          {pct}%
          {pct >= 50 && (
            <InkStar className={`absolute -top-3 -right-3 w-5 h-5 ${accentText}`} />
          )}
        </div>
      </div>

      <div className="relative w-full aspect-square shadow-offsetNavy">
        <div className="relative w-full h-full bg-cream-deep overflow-hidden">
          {imageUrl ? (
            <img src={imageUrl} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full grid place-items-center text-navy/30 font-display italic text-2xl">
              —
            </div>
          )}
        </div>
      </div>

      {/* Bar */}
      <div className="mt-5 h-2 bg-navy/10 overflow-hidden">
        <div className={`h-full ${accentBg} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      {!isScore && (
        <div className="mt-2 font-sans font-bold text-[11px] tracking-widest2 uppercase text-navy/50">
          {raw} votes
        </div>
      )}
    </section>
  );
}
