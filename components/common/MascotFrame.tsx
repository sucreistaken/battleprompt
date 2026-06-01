'use client';

/**
 * Mascot stage — axolotl SVG inside a halo + optional pixel particles +
 * optional pill label below. Used by landing-v2 (hero), player-waiting (lobby
 * AI HAKEM bekleme alanı), watch-entry (audience identity badge), and
 * create-room (form opener).
 *
 * Ported from mockups/player-waiting.html .mascot-host + .mascot-frame and
 * landing-v2.html .mascot-stage. Float animation is the only motion; respects
 * prefers-reduced-motion via the CSS injected once below.
 *
 * Tint variants:
 *   default → purple halo (host / player surfaces)
 *   lime    → lime halo   (audience / watch surfaces)
 *   dim     → grayscale + 0.62 opacity, slow idle float (404 / error surfaces)
 */

import { MascotMark } from './MascotMark';
import { useId } from 'react';

type Variant = 'default' | 'lime' | 'dim';

type Props = {
  /** Outer frame size in px. Halo and SVG scale inside. */
  size?: number;
  /** SVG mascot inner size. Defaults to ~80% of frame size. */
  mascotSize?: number;
  variant?: Variant;
  /** Show 3 small pixel particles around the mascot. */
  particles?: boolean;
  /** Optional pill label below the mascot (e.g. "AI HAKEM"). */
  label?: string;
  /** Optional micro copy below the label. */
  sub?: string;
  /** Desktop (≥960px) frame size — grows the mascot on wide viewports. */
  desktopSize?: number;
  /** Desktop mascot inner size. Defaults to ~80% of desktopSize. */
  desktopMascotSize?: number;
};

const tint: Record<Variant, { halo: string; glow: string }> = {
  default: {
    halo: 'radial-gradient(circle at center, rgba(124,77,255,0.24) 0%, rgba(124,77,255,0.06) 38%, transparent 64%)',
    glow: 'rgba(124,77,255,0.20)',
  },
  lime: {
    halo: 'radial-gradient(circle at center, rgba(174,210,74,0.22) 0%, rgba(174,210,74,0.05) 40%, transparent 64%)',
    glow: 'rgba(174,210,74,0.20)',
  },
  dim: {
    halo: 'radial-gradient(circle at center, rgba(255,92,92,0.18) 0%, rgba(255,92,92,0.04) 40%, transparent 64%)',
    glow: 'rgba(255,92,92,0.18)',
  },
};

export function MascotFrame({
  size = 120,
  mascotSize,
  variant = 'default',
  particles = false,
  label,
  sub,
  desktopSize,
  desktopMascotSize,
}: Props) {
  const t = tint[variant];
  const innerSize = mascotSize ?? Math.round(size * 0.78);
  const isDim = variant === 'dim';
  const reactId = useId().replace(/:/g, '');
  const uid = `pc-mf-${reactId}`;
  const dSize = desktopSize ?? size;
  const dInner = desktopMascotSize ?? (desktopSize ? Math.round(desktopSize * 0.82) : innerSize);
  const hasDesktopGrow = !!desktopSize && desktopSize !== size;

  return (
    <div
      className={uid}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
        position: 'relative',
      }}
    >
      <div
        className="pc-mf-frame"
        style={{
          position: 'relative',
          width: size,
          height: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 'none',
        }}
      >
        {/* halo */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: -16,
            zIndex: 0,
            pointerEvents: 'none',
            background: t.halo,
            filter: 'blur(8px)',
          }}
        />
        {/* particles */}
        {particles && !isDim && (
          <span
            aria-hidden="true"
            className="pc-mascot-particles"
            style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none' }}
          >
            <span
              style={{
                position: 'absolute',
                top: 8,
                right: 6,
                width: 6,
                height: 6,
                background: variant === 'lime' ? 'var(--pc-accent)' : '#aed24a',
                boxShadow: variant === 'lime'
                  ? '0 0 8px rgba(124,77,255,0.55)'
                  : '0 0 8px rgba(174,210,74,0.5)',
                imageRendering: 'pixelated',
              }}
            />
            <span
              style={{
                position: 'absolute',
                bottom: 14,
                left: 2,
                width: 5,
                height: 5,
                background: variant === 'lime' ? '#aed24a' : 'var(--pc-accent)',
                boxShadow: variant === 'lime'
                  ? '0 0 8px rgba(174,210,74,0.5)'
                  : '0 0 8px rgba(124,77,255,0.55)',
                imageRendering: 'pixelated',
              }}
            />
            <span
              style={{
                position: 'absolute',
                top: '48%',
                right: -6,
                width: 4,
                height: 4,
                background: '#ffffff',
                opacity: 0.7,
                imageRendering: 'pixelated',
              }}
            />
          </span>
        )}
        {/* mascot */}
        <span
          className={`pc-mf-mascot ${isDim ? 'pc-mascot-dim' : 'pc-mascot-float'}`}
          style={{
            position: 'relative',
            zIndex: 1,
            width: innerSize,
            height: innerSize,
            display: 'inline-block',
            filter: isDim
              ? `drop-shadow(0 8px 14px rgba(0,0,0,0.45)) drop-shadow(0 0 10px ${t.glow}) grayscale(0.4) saturate(0.7)`
              : `drop-shadow(0 10px 18px rgba(0,0,0,0.45)) drop-shadow(0 0 12px ${t.glow})`,
            opacity: isDim ? 0.62 : 1,
          }}
        >
          <MascotMark size={innerSize} />
        </span>
      </div>

      {label && (
        <span
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '5px 12px',
            borderRadius: 999,
            background: variant === 'default'
              ? 'rgba(174,210,74,0.10)'
              : variant === 'lime'
                ? 'rgba(174,210,74,0.10)'
                : 'rgba(255,92,92,0.10)',
            border: `1px solid ${variant === 'dim' ? 'rgba(255,92,92,0.34)' : 'rgba(174,210,74,0.38)'}`,
            fontFamily: "'Inter Tight', system-ui, sans-serif",
            fontSize: 11,
            letterSpacing: '0.10em',
            color: variant === 'dim' ? 'var(--pc-live)' : '#aed24a',
            textShadow: variant === 'dim'
              ? '0 0 12px rgba(255,92,92,0.30)'
              : '0 0 12px rgba(174,210,74,0.30)',
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              background: variant === 'dim' ? 'var(--pc-live)' : '#aed24a',
              flex: 'none',
              boxShadow: variant === 'dim'
                ? '0 0 8px rgba(255,92,92,0.6)'
                : '0 0 8px rgba(174,210,74,0.6)',
            }}
          />
          {label}
        </span>
      )}

      {sub && (
        <p
          style={{
            fontFamily: "'Inter Tight', system-ui, sans-serif",
            fontSize: 12.5,
            color: 'var(--pc-text3)',
            lineHeight: 1.4,
            textAlign: 'center',
            maxWidth: '30ch',
            margin: 0,
            fontStyle: 'italic',
          }}
        >
          {sub}
        </p>
      )}

      {/* keyframes injected once per page — duplicate <style> in React tree is fine */}
      <style>{`
        @keyframes pc-mascot-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes pc-mascot-dim-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
        .pc-mascot-float { animation: pc-mascot-float 5.2s ease-in-out infinite; }
        .pc-mascot-dim { animation: pc-mascot-dim-float 6s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .pc-mascot-float, .pc-mascot-dim { animation: none; }
        }
        ${hasDesktopGrow ? `
        @media (min-width: 960px) {
          .${uid} .pc-mf-frame { width: ${dSize}px !important; height: ${dSize}px !important; }
          .${uid} .pc-mf-mascot { width: ${dInner}px !important; height: ${dInner}px !important; }
          .${uid} .pc-mf-mascot svg { width: ${dInner}px !important; height: ${dInner}px !important; }
        }
        ` : ''}
      `}</style>
    </div>
  );
}
