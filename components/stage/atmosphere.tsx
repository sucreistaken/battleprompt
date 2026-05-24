'use client';

/**
 * Stage atmosphere - broadcast / arcade design system.
 *
 * Ported from the Claude Design "Prompt Clash Stage" bundle. Strict palette:
 * one warm-dark surface (dusk) + bone white + ONE accent (violet, the brand)
 * plus a contrasting lime "jersey" for player B so the room can tell who is
 * who at projector distance. No glassmorphism, no bokeh, no halo glow. Sharp
 * corners, hairline borders, broadcast chyron type.
 *
 * Looping motion (LIVE dot, caret, shimmer, spinner, dots) is CSS via the
 * pc-* namespaced keyframes (StageKeyframes). Entrance motion (letter cascade,
 * scale-in callouts) is framer-motion, wired per phase.
 */

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';

export const STAGE_W = 1920;
export const STAGE_H = 1080;
export const PROMPT_MAX = 280;

// ─── Font stacks (loaded via <StageFonts/>) ──────────────────────────────
export const FONT = {
  pixel: "'Silkscreen', monospace",
  body: "'Inter Tight','IBM Plex Sans',system-ui,sans-serif",
  mono: "'JetBrains Mono', monospace",
} as const;

// ─── Palette - dusk theme, violet accent, lime jersey for B ──────────────
const ACCENT = { hex: '#7c4dff', ink: '#ffffff', soft: 'rgba(124,77,255,0.18)' };
const JERSEY_B = { hex: '#c5ff3a', ink: '#0e0e10' };

export const C = {
  ink: '#22202b', // lifted warm slate (not pitch black)
  ink2: '#2d2b38', // raised panel
  ink3: '#383545', // header / hover
  ink4: '#454253', // strong surface
  line: '#4a4757', // hairline
  line2: '#615d72', // stronger
  text: '#f7f4ec', // body bone
  text2: '#c0bdca', // mid
  text3: '#8c8898', // dim
  text4: '#605d6c', // very dim
  bone: '#ffffff', // crispest highlight
  live: '#ff5c5c', // softer signal red
  letterbox: '#060608', // outside the 1920x1080 frame

  accent: ACCENT.hex,
  accentInk: ACCENT.ink,
  accentSoft: ACCENT.soft,

  aColor: ACCENT.hex,
  aInk: ACCENT.ink,
  bColor: JERSEY_B.hex,
  bInk: JERSEY_B.ink,

  player(letter: 'A' | 'B') {
    return letter === 'A' ? ACCENT.hex : JERSEY_B.hex;
  },
  playerInk(letter: 'A' | 'B') {
    return letter === 'A' ? ACCENT.ink : JERSEY_B.ink;
  },
};

// ─── Google fonts (Next hoists <link> into <head>) ───────────────────────
export function StageFonts() {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      {/* eslint-disable-next-line @next/next/google-font-preconnect */}
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Silkscreen:wght@400;700&family=Inter+Tight:wght@400;500;600;700;800&family=IBM+Plex+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
      />
    </>
  );
}

// ─── Keyframes - pc-* namespace to avoid clashing with Tailwind config ───
export function StageKeyframes() {
  return (
    <style>{`
      @keyframes pcLivePulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:.5; transform:scale(.82); } }
      @keyframes pcValuePulse { 0%,100% { transform:scale(1); } 50% { transform:scale(1.06); } }
      @keyframes pcCaret { 0%,49% { opacity:1; } 50%,100% { opacity:0; } }
      @keyframes pcShimmer { 0% { transform:translateX(-100%); } 100% { transform:translateX(100%); } }
      @keyframes pcSpin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
      @keyframes pcDotDot { 0%,20% { opacity:0; } 50% { opacity:1; } 100% { opacity:0; } }
    `}</style>
  );
}

// ─── StageScaler - fit the fixed 1920x1080 stage into any viewport ───────
export function StageScaler({ children }: { children: ReactNode }) {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const fit = () =>
      setScale(Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H));
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: C.letterbox,
        display: 'grid',
        placeItems: 'center',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: STAGE_W,
          height: STAGE_H,
          flex: 'none',
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ─── StageFrame - vignette + scanlines + safe-area ticks ─────────────────
export function StageFrame({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        position: 'relative',
        width: STAGE_W,
        height: STAGE_H,
        background: C.ink,
        overflow: 'hidden',
        fontFamily: FONT.body,
        color: C.text,
        isolation: 'isolate',
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at top, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0) 55%), radial-gradient(ellipse at bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0) 60%)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />
      <Scanlines />
      <SafeAreaTicks />
      {children}
    </div>
  );
}

function Scanlines() {
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 2,
        pointerEvents: 'none',
        backgroundImage:
          'repeating-linear-gradient(0deg, rgba(255,255,255,0.008) 0px, rgba(255,255,255,0.008) 1px, transparent 1px, transparent 3px)',
        mixBlendMode: 'screen',
      }}
    />
  );
}

function SafeAreaTicks() {
  const T = 12;
  const W = 1.5;
  const arm = (x: number, y: number, rx: 0 | 1, ry: 0 | 1): CSSProperties => ({
    position: 'absolute',
    left: x,
    top: y,
    width: rx === 1 ? T : W,
    height: ry === 1 ? T : W,
    background: C.text4,
    opacity: 0.6,
  });
  return (
    <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 4 }}>
      <div style={arm(28, 28, 1, 0)} />
      <div style={arm(28, 28, 0, 1)} />
      <div style={arm(STAGE_W - 28 - T, 28, 1, 0)} />
      <div style={arm(STAGE_W - 28 - W, 28, 0, 1)} />
      <div style={arm(28, STAGE_H - 28 - W, 1, 0)} />
      <div style={arm(28, STAGE_H - 28 - T, 0, 1)} />
      <div style={arm(STAGE_W - 28 - T, STAGE_H - 28 - W, 1, 0)} />
      <div style={arm(STAGE_W - 28 - W, STAGE_H - 28 - T, 0, 1)} />
    </div>
  );
}

// ─── Broadcast top bar ───────────────────────────────────────────────────
export function TopBar({
  liveLabel,
  matchId,
  theme,
}: {
  liveLabel: string;
  matchId: string;
  theme: string;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 56,
        left: 60,
        right: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 20,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <span style={{ fontFamily: FONT.pixel, fontSize: 24, letterSpacing: '0.04em', color: C.bone }}>
          PROMPT CLASH
        </span>
        <span style={{ display: 'inline-block', width: 1, height: 18, background: C.line2 }} />
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '5px 11px',
            background: C.live,
            borderRadius: 2,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#fff',
              animation: 'pcLivePulse 1.4s ease-in-out infinite',
            }}
          />
          <span
            style={{
              fontFamily: FONT.mono,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.18em',
              color: '#fff',
            }}
          >
            {liveLabel}
          </span>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          fontFamily: FONT.mono,
          fontSize: 12,
          letterSpacing: '0.08em',
          color: C.text2,
        }}
      >
        {matchId && <BroadcastChip>{matchId}</BroadcastChip>}
        {theme && (
          <span
            style={{
              fontFamily: FONT.body,
              fontSize: 13,
              fontWeight: 400,
              letterSpacing: '0.01em',
              color: C.text3,
              fontStyle: 'italic',
              maxWidth: 460,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            &ldquo;{theme}&rdquo;
          </span>
        )}
      </div>
    </div>
  );
}

export function BroadcastChip({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 9px',
        border: `1px solid ${C.line2}`,
        color: C.text,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
      }}
    >
      {children}
    </span>
  );
}

// ─── Pixel display text ──────────────────────────────────────────────────
export function PixelText({
  children,
  size = 80,
  color,
  style = {},
}: {
  children: ReactNode;
  size?: number;
  color?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      style={{
        fontFamily: FONT.pixel,
        fontWeight: 700,
        fontSize: size,
        lineHeight: 1,
        letterSpacing: '0.02em',
        color: color || C.bone,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

// ─── LetterCascade - framer-motion staggered letter entrance ─────────────
export function LetterCascade({
  text,
  size = 140,
  color,
  baseDelay = 0,
  gap = 8,
}: {
  text: string;
  size?: number;
  color?: string;
  baseDelay?: number;
  gap?: number;
}) {
  return (
    <span style={{ display: 'flex', gap }}>
      {text.split('').map((ch, i) => (
        <motion.span
          key={`${ch}-${i}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1], delay: baseDelay + i * 0.05 }}
          style={{ display: 'inline-block' }}
        >
          <PixelText size={size} color={color}>
            {ch === ' ' ? ' ' : ch}
          </PixelText>
        </motion.span>
      ))}
    </span>
  );
}

// ─── Avatar - sharp square pixel tile ────────────────────────────────────
export function Avatar({
  letter,
  size = 60,
  player,
}: {
  letter: string;
  size?: number;
  player?: 'A' | 'B';
}) {
  const bg = player ? C.player(player) : C.bone;
  const fg = player ? C.playerInk(player) : C.ink;
  return (
    <div
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: bg,
        color: fg,
        fontFamily: FONT.pixel,
        fontSize: size * 0.48,
        borderRadius: 2,
      }}
    >
      {letter}
    </div>
  );
}

// ─── Broadcast label - all-caps mono ─────────────────────────────────────
export function Lbl({
  children,
  color = 'text3',
  size = 12,
  style = {},
}: {
  children: ReactNode;
  color?: keyof typeof C | string;
  size?: number;
  style?: CSSProperties;
}) {
  const resolved = (C as Record<string, unknown>)[color];
  return (
    <span
      style={{
        fontFamily: FONT.mono,
        fontSize: size,
        fontWeight: 500,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: typeof resolved === 'string' ? resolved : (color as string),
        ...style,
      }}
    >
      {children}
    </span>
  );
}

// ─── Countdown ───────────────────────────────────────────────────────────
export function useCountdown(endsAt: number | null, totalSeconds: number) {
  // null until mounted so SSR and first client render agree (no Date.now in render).
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    if (!endsAt) return;
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [endsAt]);

  if (!endsAt || now === null) return { value: totalSeconds, progress: 1, danger: false } as const;
  const remainingMs = Math.max(0, endsAt - now);
  const value = Math.ceil(remainingMs / 1000);
  const progress = Math.max(0, Math.min(1, remainingMs / (totalSeconds * 1000)));
  const danger = value <= 5 && value > 0;
  return { value, progress, danger } as const;
}

export function CountdownRing({
  size = 160,
  progress,
  value,
  danger = false,
  stroke = 6,
}: {
  size?: number;
  progress: number;
  value: number;
  danger?: boolean;
  stroke?: number;
}) {
  const r = size / 2 - stroke;
  const c = 2 * Math.PI * r;
  const color = danger ? C.live : C.accent;
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.line} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="butt"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - progress)}
          style={{ transition: 'stroke-dashoffset 250ms linear, stroke 200ms ease-out' }}
        />
      </svg>
      <div
        role="timer"
        aria-live="polite"
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: FONT.pixel,
          fontVariantNumeric: 'tabular-nums',
          fontSize: size * 0.46,
          color: C.bone,
          animation: danger ? 'pcValuePulse 0.6s ease-in-out infinite' : 'none',
        }}
      >
        {value}
      </div>
    </div>
  );
}

// ─── Image surfaces - real url with grain, else shimmer skeleton ─────────
const GRAIN_URL =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.5 0'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.6'/></svg>\")";

export function StageImage({
  src,
  alt,
  accent,
  loadingLabel,
  dim = false,
  fill = false,
}: {
  src: string | null;
  alt: string;
  accent: string;
  loadingLabel: string;
  dim?: boolean;
  /** Fill the remaining flex height (object-cover crop) instead of forcing a square. */
  fill?: boolean;
}) {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        ...(fill ? { flex: 1, minHeight: 0 } : { aspectRatio: '1 / 1' }),
        overflow: 'hidden',
        background: C.ink,
        opacity: dim ? 0.5 : 1,
        filter: dim ? 'grayscale(0.55) brightness(0.75)' : 'none',
      }}
    >
      {src ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: GRAIN_URL,
              mixBlendMode: 'overlay',
              opacity: 0.35,
              pointerEvents: 'none',
            }}
          />
        </>
      ) : (
        <Skeleton accent={accent} label={loadingLabel} />
      )}
    </div>
  );
}

function Skeleton({ accent, label }: { accent: string; label: string }) {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          width: '30%',
          background: `linear-gradient(90deg, transparent 0%, ${accent}33 50%, transparent 100%)`,
          animation: 'pcShimmer 1.6s linear infinite',
          mixBlendMode: 'screen',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 20,
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            border: `2px solid ${C.line2}`,
            borderTop: `2px solid ${accent}`,
            borderRight: `2px solid ${accent}`,
            borderRadius: '50%',
            animation: 'pcSpin 1.2s linear infinite',
          }}
        />
        <Lbl size={12} color="text2">
          {label}
        </Lbl>
      </div>
    </div>
  );
}

// ─── Reference image - hairline frame + accent corner crops ──────────────
export function ReferenceFrame({
  src,
  alt,
  size,
  loadingLabel,
}: {
  src: string | null;
  alt: string;
  size: number;
  loadingLabel: string;
}) {
  const crop = (s: CSSProperties): CSSProperties => ({ position: 'absolute', width: 16, height: 16, ...s });
  return (
    <div style={{ position: 'relative', width: size, height: size, overflow: 'hidden', border: `1px solid ${C.line2}` }}>
      <StageImage src={src} alt={alt} accent={C.accent} loadingLabel={loadingLabel} />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: '40%',
          background: 'linear-gradient(180deg, rgba(14,14,16,0) 0%, rgba(14,14,16,0.65) 100%)',
          pointerEvents: 'none',
        }}
      />
      <div style={crop({ top: 6, left: 6, borderTop: `2px solid ${C.accent}`, borderLeft: `2px solid ${C.accent}` })} />
      <div style={crop({ top: 6, right: 6, borderTop: `2px solid ${C.accent}`, borderRight: `2px solid ${C.accent}` })} />
      <div style={crop({ bottom: 6, left: 6, borderBottom: `2px solid ${C.accent}`, borderLeft: `2px solid ${C.accent}` })} />
      <div style={crop({ bottom: 6, right: 6, borderBottom: `2px solid ${C.accent}`, borderRight: `2px solid ${C.accent}` })} />
    </div>
  );
}

// ─── Real QR (ink modules on bone white) ─────────────────────────────────
export function StageQR({ value, size = 380 }: { value: string; size?: number }) {
  return (
    <div style={{ background: '#fff', lineHeight: 0 }}>
      <QRCodeSVG value={value} size={size} level="M" fgColor="#0e0e10" bgColor="#ffffff" includeMargin={false} />
    </div>
  );
}

// ─── Loading stage (no socket state yet) ─────────────────────────────────
export function LoadingStage({ label }: { label: string }) {
  return (
    <StageFrame>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 24,
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            border: `4px solid ${C.line}`,
            borderTop: `4px solid ${C.accent}`,
            borderRadius: '50%',
            animation: 'pcSpin 1.1s linear infinite',
          }}
        />
        <Lbl size={16} color="text2">
          {label}
        </Lbl>
      </div>
    </StageFrame>
  );
}
