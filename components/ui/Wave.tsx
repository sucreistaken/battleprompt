'use client';

interface Props {
  className?: string;
  width?: number;
  primaryColor?: string;
  secondaryColor?: string;
  animated?: boolean;
}

export function Wave({
  className = '',
  width = 1728,
  primaryColor = '#1d4f8b',
  secondaryColor = '#d97757',
  animated = false
}: Props) {
  // Build a wavy path
  const segments = 16;
  const seg = width / segments;
  let d1 = `M0 30`;
  let d2 = `M0 45`;
  for (let i = 0; i < segments; i++) {
    const cx = i * seg + seg / 2;
    const dir = i % 2 === 0 ? -22 : 22;
    d1 += ` Q ${cx} ${30 + dir} ${(i + 1) * seg} 30`;
    d2 += ` Q ${cx} ${45 + dir} ${(i + 1) * seg} 45`;
  }
  return (
    <svg
      width={width}
      height={60}
      viewBox={`0 0 ${width} 60`}
      className={`${className} ${animated ? 'animate-wave' : ''}`}
    >
      <path d={d1} fill="none" stroke={primaryColor} strokeWidth={3} strokeLinecap="round" opacity={0.5} />
      <path d={d2} fill="none" stroke={secondaryColor} strokeWidth={2} strokeLinecap="round" opacity={0.6} />
    </svg>
  );
}
