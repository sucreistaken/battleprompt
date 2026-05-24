'use client';

import { ReactNode } from 'react';
import { LiveBadge } from './LiveBadge';

interface StageChromeProps {
  matchNo?: string | number;
  liveLabel?: string;
  children: ReactNode;
  rightSlot?: ReactNode;
  className?: string;
}

/**
 * Broadcast-style top nav + canvas wrapper used by every stage screen.
 * Mirrors the Stitch "Olympic Heritage" reference: cream bg, navy ink,
 * tabbed top nav with LIVE indicator, optional CTA on the right.
 */
export function StageChrome({
  matchNo = '142',
  liveLabel = 'LIVE',
  children,
  rightSlot,
  className = ''
}: StageChromeProps) {
  return (
    <div className={`relative min-h-screen w-full bg-cream text-navy overflow-hidden ${className}`}>
      {/* Top nav */}
      <header className="relative z-30 px-12 pt-6 pb-4 flex items-center justify-between border-b border-navy/10">
        <div className="flex items-baseline gap-10">
          <div className="font-display italic font-black text-2xl tracking-tight text-navy">
            PROMPT CLASH
          </div>
          <nav className="hidden md:flex items-center gap-8 font-sans font-bold text-xs tracking-widest2 uppercase text-navy/70">
            <span className="text-navy flex items-center gap-2">
              <LiveBadge label={liveLabel} />
            </span>
            <span>Episodes</span>
            <span>Schedule</span>
            <span>Players</span>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden md:inline font-sans font-bold text-[11px] tracking-widest2 uppercase text-navy/40">
            MATCH #{matchNo}
          </span>
          {rightSlot ?? (
            <button className="bg-navy text-cream px-5 py-2.5 font-sans font-bold text-xs tracking-widest2 uppercase">
              Watch Now
            </button>
          )}
        </div>
      </header>

      {children}
    </div>
  );
}
