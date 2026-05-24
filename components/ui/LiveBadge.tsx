'use client';

export function LiveBadge({
  label = 'LIVE',
  className = ''
}: {
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-sans font-bold text-[10px] tracking-widest2 uppercase ${className}`}
    >
      <span className="live-dot" />
      {label}
    </span>
  );
}
