'use client';

interface Props {
  size?: number;
  color?: string;
  className?: string;
  sparkle?: boolean;
}

export function Star({
  size = 24,
  color = '#f4c542',
  className = '',
  sparkle = false
}: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={`${className} ${sparkle ? 'animate-sparkle' : ''}`}
    >
      <path
        d="M16 0 L18 14 L32 16 L18 18 L16 32 L14 18 L0 16 L14 14 Z"
        fill={color}
      />
    </svg>
  );
}
