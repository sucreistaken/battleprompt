'use client';

import { ReactNode } from 'react';

interface PostcardProps {
  children?: ReactNode;
  rotate?: number;
  className?: string;
  inner?: boolean;
  stamp?: ReactNode;
  /** Tailwind bg-* class for card body. Defaults to bg-white. */
  bg?: string;
  noBorder?: boolean;
}

/**
 * Aegean Postcard card — rotated white card with optional dashed inner border
 * and a corner stamp slot.
 */
export function Postcard({
  children,
  rotate = -2,
  className = '',
  inner = true,
  stamp,
  bg = 'bg-white',
  noBorder = false
}: PostcardProps) {
  return (
    <div
      className={`relative ${className}`}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <div
        className={`relative ${bg} rounded-card shadow-postcard ${
          noBorder ? '' : 'border border-ink/20'
        } overflow-hidden`}
      >
        {inner && (
          <div className="absolute inset-3 sm:inset-4 rounded-[14px] pointer-events-none dashed-postcard" />
        )}
        {stamp && <div className="absolute top-4 right-4 z-10">{stamp}</div>}
        <div className="relative">{children}</div>
      </div>
    </div>
  );
}

interface StampProps {
  label: ReactNode;
  color?: string;
  className?: string;
}

/** Terracotta stamp commonly placed in the postcard corner. */
export function Stamp({
  label,
  color = 'bg-terra',
  className = ''
}: StampProps) {
  return (
    <div
      className={`${color} text-paper px-3 py-2 rounded-md text-center font-display font-bold leading-tight text-xs tracking-wider ${className}`}
      style={{ transform: 'rotate(4deg)' }}
    >
      {label}
    </div>
  );
}
