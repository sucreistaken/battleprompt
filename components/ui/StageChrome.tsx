'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StageChromeProps {
  children: ReactNode;
  className?: string;
  /** Show optional top bar with live + match meta */
  topBar?: ReactNode;
}

/**
 * Stage shell — full-bleed background container for TV/projector views.
 * No broadcast clutter (waves, sun bursts, tickers); minimalist editorial
 * surface with violet radial gradient.
 */
export function StageChrome({ children, className, topBar }: StageChromeProps) {
  return (
    <main className={cn('min-h-screen q-stage-bg flex flex-col', className)}>
      {topBar && (
        <header className="px-12 py-6 flex items-center justify-between">
          {topBar}
        </header>
      )}
      <div className="flex-1 flex items-center justify-center px-12 py-8">
        {children}
      </div>
    </main>
  );
}

/** Small live indicator pill, dot pulses. Pass `label` (translated) — fallback
 *  uses a Turkish default only for legacy callers; new callers must inject t('live'). */
export function LiveBadge({ label = 'CANLI' }: { label?: string }) {
  return (
    <span className="q-pill-live inline-flex items-center gap-2">
      <span className="w-2 h-2 rounded-full bg-white animate-livePulse" aria-hidden="true" />
      {label}
    </span>
  );
}

/** Match meta line: theme + match id, low-emphasis */
export function StageMatchMeta({ theme, matchLabel }: { theme: string; matchLabel: string }) {
  return (
    <div className="flex items-center gap-4 text-ink-variant">
      <span className="q-label">{matchLabel}</span>
      <span className="text-ink-light">·</span>
      <span className="text-sm font-medium">{theme}</span>
    </div>
  );
}
