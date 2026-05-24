'use client';

import { ReactNode } from 'react';

interface TickerProps {
  items: ReactNode[];
  className?: string;
  separator?: ReactNode;
  speed?: 'slow' | 'normal' | 'fast';
}

/**
 * Bottom navy ticker bar — like a broadcast lower-third stock ticker.
 * Loops continuously. Items are duplicated for seamless scroll.
 */
export function Ticker({
  items,
  className = '',
  separator = (
    <span className="mx-6 inline-block text-tangerine font-bold">»</span>
  ),
  speed = 'normal'
}: TickerProps) {
  const duration = speed === 'fast' ? '20s' : speed === 'slow' ? '60s' : '40s';
  // Duplicate for seamless loop
  const looped = [...items, ...items];
  return (
    <div className={`relative overflow-hidden bg-navy text-cream ${className}`}>
      <div
        className="flex whitespace-nowrap py-2.5 font-sans text-sm tracking-wider2 uppercase animate-ticker"
        style={{ animationDuration: duration }}
      >
        {looped.map((item, i) => (
          <span key={i} className="inline-flex items-center shrink-0">
            {item}
            {separator}
          </span>
        ))}
      </div>
    </div>
  );
}
