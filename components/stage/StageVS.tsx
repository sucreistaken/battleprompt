'use client';

import { useGameState } from '@/components/client/useGameState';
import { StageChrome } from '@/components/ui/StageChrome';
import { Ticker } from '@/components/ui/Ticker';
import { CountdownTimer } from '@/components/client/CountdownTimer';
import {
  Pixel,
  LightningBolt,
  InkStar,
  ActionBurst,
  ScribbleUnderline
} from '@/components/ui/Doodles';

export function StageVS() {
  const { state } = useGameState();
  if (!state) return null;
  const A = state.players.A;
  const B = state.players.B;
  const matchNo = state.matchId?.slice(-3).toUpperCase() || '142';

  return (
    <StageChrome matchNo={matchNo}>
      <main
        className="relative grid grid-cols-2 min-h-[calc(100vh-180px)]"
        style={{ minHeight: 'calc(100vh - 180px)' }}
      >
        {/* LEFT — tangerine */}
        <section
          className="relative bg-tangerine overflow-hidden"
          style={{ clipPath: 'polygon(0 0, 100% 0, calc(100% - 80px) 100%, 0 100%)' }}
        >
          <div className="absolute top-10 left-12 font-sans font-bold text-xs tracking-widest2 uppercase text-navy">
            01 · Player A
          </div>
          <div className="absolute inset-0 flex items-center justify-end pr-32">
            <div className="text-right">
              <div className="font-display italic font-black text-navy text-[12rem] leading-[0.85] tracking-tight">
                {A?.nickname || '—'}
              </div>
              <div className="mt-4 font-sans font-bold text-base tracking-widest2 uppercase text-navy/70">
                {A ? '✓ Ready' : 'Awaiting'}
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT — navy */}
        <section className="relative bg-navy overflow-hidden">
          <div className="absolute top-10 right-12 font-sans font-bold text-xs tracking-widest2 uppercase text-tangerine">
            02 · Player B
          </div>
          <div className="absolute inset-0 flex items-center justify-start pl-32">
            <div>
              <div className="font-display italic font-black text-cream text-[12rem] leading-[0.85] tracking-tight">
                {B?.nickname || '—'}
              </div>
              <div className="mt-4 font-sans font-bold text-base tracking-widest2 uppercase text-cream/70">
                {B ? '✓ Ready' : 'Awaiting'}
              </div>
            </div>
          </div>
        </section>

        {/* CENTER VS mark + countdown */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center">
          <div className="relative bg-cream border-4 border-navy w-60 h-60 grid place-items-center shadow-offsetNavy">
            <span className="font-display italic font-black text-[10rem] leading-none text-navy">VS</span>
            {/* Lightning bolts on either side */}
            <LightningBolt className="absolute -left-10 top-1/2 -translate-y-1/2 w-8 h-14 text-tangerine" />
            <LightningBolt className="absolute -right-10 top-1/2 -translate-y-1/2 w-8 h-14 text-tangerine scale-x-[-1]" />
            {/* Sparkle stars */}
            <InkStar className="absolute -top-4 -right-4 w-6 h-6 text-tangerine" />
            <InkStar className="absolute -bottom-3 -left-4 w-5 h-5 text-tangerine" />
          </div>
          <div className="mt-6 bg-navy text-cream px-6 py-2 font-sans font-bold text-sm tracking-widest2 uppercase">
            Match #{matchNo}
          </div>
          {state.phaseEndsAt && (
            <div className="mt-2 font-numeric font-bold text-base text-navy tabular-nums">
              <CountdownTimer endsAt={state.phaseEndsAt} className="font-display italic" />s · GO
            </div>
          )}
        </div>

        {/* PIXEL mascots cheering on either side of the VS coin */}
        <Pixel
          emote="shout"
          className="absolute left-16 bottom-32 w-32 h-28 text-navy"
          style={{ transform: 'rotate(-12deg)' }}
        />
        <Pixel
          emote="shout"
          className="absolute right-16 bottom-32 w-32 h-28 text-cream"
          style={{ transform: 'rotate(12deg) scaleX(-1)' }}
        />
      </main>

      <Ticker
        items={[
          <span key="1" className="flex items-center gap-2">
            <span className="live-dot" /> LIVE
          </span>,
          `FIGHT INTRO · MATCH #${matchNo}`,
          `THEME · ${(state.theme || '').toUpperCase()}`,
          'WINNER TAKES THE PRESTIGE',
          'STAY TUNED FOR THE PROMPT PHASE'
        ]}
      />
    </StageChrome>
  );
}
