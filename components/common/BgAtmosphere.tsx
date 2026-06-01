'use client';

/**
 * Fixed-position page atmosphere — radial glow + subtle pixel grid masked
 * to fade at the bottom. Used by landing-v2 / lobby / create-room / etc.
 *
 * Ported from mockups/landing-v2.html bg-glow + bg-grid pair. The tint
 * variant lets specific surfaces (audience = lime, 404 = danger) shift
 * the hue without re-declaring the geometry.
 *
 * Renders zero interactive content; sits at z-index 0 with pointer-events
 * none so children render normally above it.
 */

type Variant = 'default' | 'lime' | 'danger';

type Props = {
  variant?: Variant;
};

const tint: Record<Variant, { glow: string; grid: string }> = {
  default: {
    glow: 'rgba(124,77,255,0.14)',
    grid: 'rgba(124,77,255,0.022)',
  },
  lime: {
    glow: 'rgba(174,210,74,0.12)',
    grid: 'rgba(174,210,74,0.022)',
  },
  danger: {
    glow: 'rgba(255,92,92,0.10)',
    grid: 'rgba(255,92,92,0.022)',
  },
};

export function BgAtmosphere({ variant = 'default' }: Props) {
  const t = tint[variant];
  return (
    <>
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          zIndex: 0,
          pointerEvents: 'none',
          width: 780,
          height: 780,
          left: variant === 'danger' ? '50%' : -220,
          top: -220,
          transform: variant === 'danger' ? 'translateX(-50%)' : undefined,
          background: `radial-gradient(circle at center, ${t.glow} 0%, ${t.glow.replace(/0\.\d+\)/, '0.02)')} 42%, transparent 64%)`,
          filter: 'blur(22px)',
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          backgroundImage: `linear-gradient(${t.grid} 1px, transparent 1px), linear-gradient(90deg, ${t.grid} 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
          maskImage: `radial-gradient(ellipse 90% ${variant === 'danger' ? '60%' : '50%'} at 50% ${variant === 'danger' ? '30%' : '14%'}, #000 14%, transparent 72%)`,
          WebkitMaskImage: `radial-gradient(ellipse 90% ${variant === 'danger' ? '60%' : '50%'} at 50% ${variant === 'danger' ? '30%' : '14%'}, #000 14%, transparent 72%)`,
          opacity: variant === 'danger' ? 0.6 : 1,
        }}
      />
    </>
  );
}
