'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface CountdownProps {
  endsAt: number | null;
  totalSeconds: number;
  variant?: 'mobile' | 'stage';
  showLabel?: boolean;
  label?: string;
  className?: string;
}

/**
 * Live countdown driven by phaseEndsAt unix timestamp from server state.
 * Auto-ticks every 250ms client-side, shows seconds remaining + progress ring.
 * Pulses red below 5s. Stage variant scales up for TV legibility.
 */
export function CountdownTimer({
  endsAt,
  totalSeconds,
  variant = 'mobile',
  showLabel = true,
  label,
  className,
}: CountdownProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!endsAt) return;
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [endsAt]);

  if (!endsAt) return null;

  const remainingMs = Math.max(0, endsAt - now);
  const remainingSec = Math.ceil(remainingMs / 1000);
  const progress = Math.max(0, Math.min(1, remainingMs / (totalSeconds * 1000)));
  const isUrgent = remainingSec <= 5 && remainingSec > 0;

  const size = variant === 'stage' ? 160 : 88;
  const stroke = variant === 'stage' ? 12 : 7;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  return (
    <div className={cn('inline-flex flex-col items-center gap-2', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="rotate-[-90deg]" aria-hidden="true">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--color-primary-100)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={isUrgent ? 'var(--color-live)' : 'var(--color-primary)'}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 250ms linear, stroke 200ms ease-out' }}
          />
        </svg>
        <div
          role="timer"
          aria-live="polite"
          aria-atomic="true"
          className={cn(
            'absolute inset-0 flex items-center justify-center q-display tabular-nums',
            variant === 'stage' ? 'text-[64px]' : 'text-[28px]',
            isUrgent ? 'text-live animate-livePulse' : 'text-ink',
          )}
        >
          {remainingSec}
        </div>
      </div>
      {showLabel && label && (
        <span className={cn(variant === 'stage' ? 'q-label text-base' : 'q-label')}>
          {label}
        </span>
      )}
    </div>
  );
}
