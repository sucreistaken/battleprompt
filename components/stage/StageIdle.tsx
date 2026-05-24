'use client';

import { QRCodeSVG } from 'qrcode.react';
import { useGameState } from '@/components/client/useGameState';
import { useI18n } from '@/components/client/i18nContext';
import { StageChrome } from '@/components/ui/StageChrome';
import { Ticker } from '@/components/ui/Ticker';
import {
  Pixel,
  ActionBurst,
  ScribbleUnderline,
  ScribbleArrow,
  InkStar,
  SpeedLines,
  PointerNote
} from '@/components/ui/Doodles';

export function StageIdle({ showWaiting = false }: { showWaiting?: boolean }) {
  const { state } = useGameState();
  const { t } = useI18n();
  const joinUrl =
    (process.env.NEXT_PUBLIC_APP_URL as string | undefined) ||
    (typeof window !== 'undefined' ? window.location.origin : 'https://promptclash.live');

  const matchNo = state?.matchId?.slice(-3).toUpperCase() || '142';
  const playerA = state?.players.A?.nickname;
  const headline = showWaiting && playerA ? playerA : 'Who tells it better?';
  const subline = showWaiting && playerA ? 'is waiting for an opponent' : '';

  return (
    <StageChrome matchNo={matchNo}>
      <main className="relative grid grid-cols-[1fr_440px] min-h-[calc(100vh-180px)]">
        {/* ============ LEFT — tangerine diagonal canvas ============ */}
        <section className="relative overflow-hidden">
          {/* Tangerine diagonal block */}
          <div
            className="absolute inset-0 bg-tangerine"
            style={{
              clipPath: 'polygon(0 0, 100% 0, calc(100% - 220px) 100%, 0 100%)'
            }}
          />

          {/* Subtle stadium / texture overlay on the cream slice */}
          <div className="absolute top-0 right-0 bottom-0 w-[280px] cream-grain opacity-40 pointer-events-none" />

          {/* Faint vertical "01" decoration — pushed to the bottom-left corner so it doesn't clash with the headline */}
          <div className="absolute -left-4 -bottom-6 font-display italic font-bold text-[16rem] leading-none text-navy/10 select-none pointer-events-none">
            01
          </div>

          {/* Content */}
          <div className="relative z-10 h-full flex flex-col justify-between px-14 py-14">
            <div>
              <div className="flex items-center gap-3 font-sans font-bold text-xs tracking-widest2 uppercase text-navy">
                <span>01 · EPISODE 13</span>
                <span className="text-navy/40">·</span>
                <span>LIVE BROADCAST</span>
              </div>

              {/* Massive italic headline */}
              <div className="relative mt-10 max-w-4xl">
                <h1 className="font-display italic font-black text-[clamp(4rem,10vw,10rem)] leading-[0.9] tracking-tight text-navy">
                  {headline}
                </h1>
                {/* Hand-drawn scribble underline */}
                <ScribbleUnderline className="block w-72 h-3 mt-1 text-navy" />
                {/* PIXEL mascot — the Prompt Clash robot, peeking from the right of the headline */}
                <Pixel
                  emote="happy"
                  className="hidden xl:block absolute -right-16 top-0 w-36 h-32 text-navy"
                  style={{ transform: 'rotate(-6deg)' }}
                />
                {/* Floating star sparkles */}
                <InkStar className="absolute -left-4 top-4 w-5 h-5 text-tangerine" />
                <InkStar className="absolute right-1/3 -top-4 w-4 h-4 text-tangerine" />
              </div>

              {subline && (
                <div className="mt-6 font-display italic text-3xl text-navy/70">
                  {subline}
                </div>
              )}
            </div>

            {/* Bottom info strip */}
            <div className="mt-12 grid grid-cols-2 gap-12 border-t-2 border-navy/30 pt-6 max-w-3xl">
              <div>
                <div className="font-sans font-bold text-[10px] tracking-widest2 uppercase text-navy/60">
                  Current Theme
                </div>
                <div className="mt-1 font-display italic font-bold text-2xl text-navy">
                  {state?.theme ? truncate(state.theme, 28) : 'CYBER · NEON · NOIR'}
                </div>
              </div>
              <div>
                <div className="font-sans font-bold text-[10px] tracking-widest2 uppercase text-navy/60">
                  Active Prompt
                </div>
                <div className="mt-1 font-display italic font-bold text-2xl text-navy">
                  "{playerA ? `${playerA} is up` : 'standing by…'}"
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ RIGHT RAIL — navy broadcast panel ============ */}
        <aside className="relative bg-navy text-cream flex flex-col">
          {/* Header strip */}
          <div className="px-8 pt-8 pb-4 border-b border-cream/10">
            <div className="font-display italic font-bold text-base text-cream">
              PROMPT CLASH
            </div>
            <div className="font-sans font-bold text-[10px] tracking-widest2 uppercase text-tangerine mt-1">
              Broadcast Mode
            </div>
          </div>

          {/* QR card */}
          <div className="px-8 pt-8 relative">
            <div className="bg-cream p-5 relative">
              {/* Corner L marks */}
              <CornerMarks />
              <QRCodeSVG
                value={joinUrl}
                size={280}
                level="M"
                fgColor="#001f3f"
                bgColor="#fdfcf0"
                className="w-full h-auto block"
              />
            </div>
            {/* Red Bull-style POW! burst pointing at the QR */}
            <div className="absolute -top-2 -left-4 rotate-[-12deg] pointer-events-none">
              <ActionBurst className="w-20 h-20 text-tangerine" label="TAP!" />
            </div>
            {/* Hand-drawn arrow from the burst aiming at QR center */}
            <ScribbleArrow className="absolute top-12 left-6 w-16 h-10 text-cream rotate-[20deg] pointer-events-none" />

            <div className="mt-4 text-center">
              <div className="font-sans font-bold text-xs tracking-widest2 uppercase text-cream">
                Scan to Play
              </div>
              <div className="font-display italic text-sm text-cream/60 mt-1">
                join the arena now
              </div>
            </div>
          </div>

          {/* Menu rail */}
          <nav className="px-8 mt-8 flex-1">
            {[
              { label: 'Broadcast', active: true },
              { label: 'Stats' },
              { label: 'Scan to Play' },
              { label: 'Help' }
            ].map((item) => (
              <div
                key={item.label}
                className={`flex items-center justify-between py-3 border-b border-cream/10 font-sans font-bold text-xs tracking-widest2 uppercase ${
                  item.active ? 'text-cream' : 'text-cream/50'
                }`}
              >
                <span>{item.label}</span>
                {item.active && <span className="w-8 h-[2px] bg-tangerine" />}
              </div>
            ))}
          </nav>

          {/* Big CTA */}
          <div className="p-8 pt-4 relative">
            <a
              href={joinUrl}
              className="relative block w-full bg-tangerine text-navy text-center py-4 font-sans font-bold text-sm tracking-widest2 uppercase"
            >
              Join the Arena
            </a>
            <SpeedLines className="absolute -left-1 top-1/2 -translate-y-1/2 w-8 h-8 text-cream/40" />
            <SpeedLines className="absolute -right-1 top-1/2 -translate-y-1/2 w-8 h-8 text-cream/40 scale-x-[-1]" />
          </div>
        </aside>
      </main>

      {/* Bottom ticker */}
      <Ticker
        items={[
          <span key="1" className="flex items-center gap-2">
            <span className="live-dot" /> PROMPT CLASH LIVE
          </span>,
          'LIVE FROM THE ARENA · ROUND 3 COMMENCING',
          'NEXT UP · PROMPT MASTERS FINALS',
          <span key="2">
            TOP CONTENDER · <span className="text-tangerine">@VECTOR_VANGUARD</span> (158 PTS)
          </span>,
          'SCAN ANY TIME TO JOIN'
        ]}
      />
    </StageChrome>
  );
}

function CornerMarks() {
  // Tiny L-shaped registration marks at the QR corners
  return (
    <>
      <span className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-tangerine" />
      <span className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 border-tangerine" />
      <span className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 border-tangerine" />
      <span className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-tangerine" />
    </>
  );
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}
