'use client';

import { useGameState } from '@/components/client/useGameState';
import { StageChrome } from '@/components/ui/StageChrome';
import { Ticker } from '@/components/ui/Ticker';
import { CountdownTimer } from '@/components/client/CountdownTimer';
import {
  SpeedLines,
  ScribbleArrow,
  ScribbleUnderline,
  InkStar,
  PointerNote
} from '@/components/ui/Doodles';

export function StagePrompting() {
  const { state, livePrompts } = useGameState();
  if (!state) return null;
  const matchNo = state.matchId?.slice(-3).toUpperCase() || '142';

  return (
    <StageChrome matchNo={matchNo}>
      <main className="relative grid grid-cols-[1fr_580px_1fr] gap-0 min-h-[calc(100vh-180px)]">
        {/* LEFT — Player A */}
        <PlayerPanel
          slot="A"
          nickname={state.players.A?.nickname}
          submitted={!!state.players.A?.submitted}
          showPrompt={state.showLivePrompts}
          prompt={livePrompts.A}
          color="tangerine"
        />

        {/* CENTER — reference image */}
        <section className="relative bg-cream-deep border-l border-r border-navy/10 flex flex-col items-center px-8 pt-12">
          <div className="font-sans font-bold text-[10px] tracking-widest3 uppercase text-navy/50 mb-3">
            Reference Image
          </div>
          <div className="relative w-full max-w-[440px]">
            {/* Solid offset block behind */}
            <div className="absolute inset-0 translate-x-3 translate-y-3 bg-navy" />
            <div className="relative bg-navy w-full aspect-square overflow-hidden">
              {state.referenceImageUrl ? (
                <img src={state.referenceImageUrl} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full grid place-items-center text-cream/40 font-display italic text-2xl">
                  awaiting feed…
                </div>
              )}
            </div>
          </div>
          <div className="mt-6 text-center max-w-md">
            <div className="font-display italic font-bold text-2xl text-navy leading-tight">
              "{state.theme || 'cyberpunk cat'}"
            </div>
            <div className="mt-2 font-sans text-xs tracking-widest2 uppercase text-navy/50">
              both players describe this image
            </div>
          </div>

          {/* Big countdown */}
          <div className="mt-auto mb-12 flex flex-col items-center relative">
            <div className="font-sans font-bold text-[10px] tracking-widest3 uppercase text-navy/50">
              Time Left
            </div>
            <div className="relative">
              <SpeedLines className="absolute -left-16 top-8 w-12 h-12 text-tangerine" />
              <SpeedLines className="absolute -right-16 top-8 w-12 h-12 text-tangerine scale-x-[-1]" />
              <CountdownTimer
                endsAt={state.phaseEndsAt}
                className="font-display italic font-black text-navy text-[8rem] leading-none tabular-nums"
              />
            </div>
            <div className="font-display italic text-tangerine text-xl -mt-2">seconds</div>
            <InkStar className="absolute -top-2 right-4 w-5 h-5 text-tangerine" />
          </div>
        </section>

        {/* RIGHT — Player B */}
        <PlayerPanel
          slot="B"
          nickname={state.players.B?.nickname}
          submitted={!!state.players.B?.submitted}
          showPrompt={state.showLivePrompts}
          prompt={livePrompts.B}
          color="navy"
          rightAlign
        />
      </main>

      <Ticker
        items={[
          <span key="1" className="flex items-center gap-2">
            <span className="live-dot" /> LIVE
          </span>,
          'PROMPTING PHASE · 60 SECONDS',
          state.players.A?.nickname && state.players.B?.nickname
            ? `${state.players.A.nickname.toUpperCase()} vs ${state.players.B.nickname.toUpperCase()}`
            : 'AWAITING DUEL',
          'AI WILL JUDGE EVERY WORD'
        ]}
      />
    </StageChrome>
  );
}

function PlayerPanel({
  slot,
  nickname,
  submitted,
  showPrompt,
  prompt,
  color,
  rightAlign = false
}: {
  slot: 'A' | 'B';
  nickname: string | undefined;
  submitted: boolean;
  showPrompt: boolean;
  prompt: string;
  color: 'tangerine' | 'navy';
  rightAlign?: boolean;
}) {
  const accentBg = color === 'tangerine' ? 'bg-tangerine' : 'bg-navy';
  const accentText = color === 'tangerine' ? 'text-tangerine' : 'text-navy';
  const headerText = color === 'tangerine' ? 'text-navy' : 'text-cream';
  const bg = color === 'tangerine' ? 'bg-cream' : 'bg-cream';
  const slotNum = slot === 'A' ? '01' : '02';

  return (
    <section className={`relative ${bg} flex flex-col px-10 pt-10 pb-12`}>
      {/* Top label strip */}
      <div className={`${accentBg} ${headerText} px-5 py-3 font-sans font-bold text-xs tracking-widest2 uppercase ${rightAlign ? 'self-end' : 'self-start'} flex items-center gap-3`}>
        <span>{slotNum}</span>
        <span className="opacity-50">·</span>
        <span>{nickname || 'AWAITING'}</span>
        {submitted && <span className="opacity-70">✓ SENT</span>}
      </div>

      {/* Big nickname display */}
      <div className={`mt-8 relative ${rightAlign ? 'text-right' : 'text-left'}`}>
        <div className={`font-display italic font-black ${accentText} text-7xl leading-[0.85] tracking-tight truncate`}>
          {nickname || '—'}
        </div>
        <ScribbleUnderline
          className={`w-32 h-2 mt-1 ${accentText} ${rightAlign ? 'ml-auto' : ''}`}
        />
      </div>

      {/* Live prompt area */}
      <div className="mt-10 flex-1 flex flex-col">
        <div className={`font-sans font-bold text-[10px] tracking-widest3 uppercase text-navy/50 ${rightAlign ? 'text-right' : ''}`}>
          {showPrompt ? 'Live Prompt' : 'Prompt Hidden'}
        </div>

        {showPrompt ? (
          <div
            className={`mt-3 relative border-l-4 ${color === 'tangerine' ? 'border-tangerine' : 'border-navy'} pl-5 py-2 max-w-md ${rightAlign ? 'ml-auto border-l-0 border-r-4 pr-5 pl-0 text-right' : ''}`}
          >
            <div className="font-display italic text-2xl text-navy leading-snug min-h-[5rem] break-words">
              {prompt ? `"${prompt}"` : <span className="text-navy/30">awaiting…</span>}
              {!submitted && prompt && (
                <span className="inline-block w-[2px] h-7 bg-navy ml-1 align-middle animate-pulse" />
              )}
            </div>
          </div>
        ) : (
          <div className="mt-3 font-display italic text-2xl text-navy/40">
            🔒 revealed after submission
          </div>
        )}
      </div>

      {/* Submitted badge */}
      {submitted && (
        <div className={`mt-6 font-sans font-bold text-xs tracking-widest2 uppercase ${accentText} ${rightAlign ? 'text-right' : ''}`}>
          ✓ SUBMISSION LOCKED
        </div>
      )}
    </section>
  );
}
