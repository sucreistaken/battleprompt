'use client';

interface Props {
  label: string;
  value: React.ReactNode;
  className?: string;
}

/**
 * One row of broadcast info — label left, value right, 1px hairline below.
 * Use inside the right rail of stage screens.
 */
export function BroadcastInfoRow({ label, value, className = '' }: Props) {
  return (
    <div
      className={`flex items-baseline justify-between border-b border-cream/15 py-3 ${className}`}
    >
      <span className="font-sans font-bold text-[11px] tracking-widest2 uppercase text-cream/70">
        {label}
      </span>
      <span className="font-sans font-bold text-xl text-cream tabular-nums">
        {value}
      </span>
    </div>
  );
}
