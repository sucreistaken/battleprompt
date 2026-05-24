'use client';

import { useGameState } from '@/components/client/useGameState';
import { StageChrome } from '@/components/ui/StageChrome';
import { Ticker } from '@/components/ui/Ticker';
import { ActionBurst, SpeedLines, InkStar } from '@/components/ui/Doodles';

export function StageGenerating() {
  const { state } = useGameState();
  if (!state) return null;
  const matchNo = state.matchId?.slice(-3).toUpperCase() || '142';

  return (
    <StageChrome matchNo={matchNo}>
      <main className="relative grid grid-cols-3 gap-12 px-14 pt-10 pb-32 min-h-[calc(100vh-180px)]">
        <Tile
          label="01"
          nickname={state.players.A?.nickname}
          imageUrl={state.players.A?.imageUrl}
          accent="tangerine"
        />
        <Tile
          label="REF"
          nickname="REFERENCE"
          imageUrl={state.referenceImageUrl}
          accent="navy"
          isReference
        />
        <Tile
          label="02"
          nickname={state.players.B?.nickname}
          imageUrl={state.players.B?.imageUrl}
          accent="navy"
        />

        {/* Center status overlay */}
        <div className="col-span-3 text-center mt-8 relative">
          <div className="font-sans font-bold text-xs tracking-widest3 uppercase text-tangerine flex items-center justify-center gap-3">
            <span className="live-dot" />
            Rendering in progress
          </div>
          <h2 className="mt-3 font-display italic font-black text-6xl text-navy leading-none relative inline-block">
            <SpeedLines className="absolute -left-20 top-3 w-14 h-12 text-tangerine" />
            AI is drawing
            <SpeedLines className="absolute -right-20 top-3 w-14 h-12 text-tangerine scale-x-[-1]" />
          </h2>
          <InkStar className="absolute left-1/3 -top-4 w-5 h-5 text-tangerine" />
          <InkStar className="absolute right-1/3 top-12 w-4 h-4 text-tangerine" />
        </div>
      </main>

      <Ticker
        items={[
          <span key="1" className="flex items-center gap-2">
            <span className="live-dot" /> LIVE
          </span>,
          'GENERATING · GEMINI 2.5 FLASH IMAGE',
          'BOTH ENTRIES LOCKED',
          'JUDGES STANDING BY'
        ]}
      />
    </StageChrome>
  );
}

function Tile({
  label,
  nickname,
  imageUrl,
  accent,
  isReference = false
}: {
  label: string;
  nickname: string | undefined;
  imageUrl: string | null | undefined;
  accent: 'tangerine' | 'navy';
  isReference?: boolean;
}) {
  const ready = !!imageUrl;
  const accentBg = accent === 'tangerine' ? 'bg-tangerine' : 'bg-navy';
  const accentText = accent === 'tangerine' ? 'text-tangerine' : 'text-navy';
  const offsetClass =
    accent === 'tangerine' ? 'shadow-offsetTangerine' : 'shadow-offsetNavy';

  return (
    <div className="flex flex-col">
      <div className={`flex items-baseline justify-between mb-3 ${accentText}`}>
        <span className="font-sans font-bold text-xs tracking-widest2 uppercase">
          {label} · {nickname || (isReference ? 'TARGET' : '—')}
        </span>
        <span className="font-sans font-bold text-xs tracking-widest2 uppercase">
          {isReference ? 'BRIEF' : ready ? '✓ READY' : 'RENDERING'}
        </span>
      </div>
      <div className={`relative w-full aspect-square ${offsetClass}`}>
        <div className={`relative w-full h-full ${accentBg} overflow-hidden`}>
          {ready ? (
            <img src={imageUrl!} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full grid place-items-center">
              <div className="flex flex-col items-center gap-3">
                <span className="live-dot" />
                <span className="font-sans font-bold text-xs tracking-widest2 uppercase text-cream/70">
                  Receiving feed
                </span>
              </div>
            </div>
          )}
        </div>
        {/* Red Bull-style ZAP burst on each rendering tile */}
        {!ready && !isReference && (
          <div className="absolute -top-4 -right-4 rotate-[14deg] pointer-events-none">
            <ActionBurst className="w-16 h-16 text-tangerine" label="ZAP!" />
          </div>
        )}
      </div>
    </div>
  );
}
