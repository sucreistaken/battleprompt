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

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
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

// ─── Palette - sourced from CSS custom properties (--pc-*, see globals.css) ──
// `C` holds var() strings, so every `style={{ background: C.ink }}` resolves to
// whatever the active theme sets. Flip themes by setting <html data-pc-theme>
// via useStageTheme() — no per-component theme wiring. CAVEAT: CSS vars do NOT
// resolve in SVG presentation *attributes* (e.g. <circle stroke={C.line}>) —
// pass those through style={{ stroke }} instead.
export const C = {
  ink: 'var(--pc-ink)',
  ink2: 'var(--pc-ink2)',
  ink3: 'var(--pc-ink3)',
  ink4: 'var(--pc-ink4)',
  line: 'var(--pc-line)',
  line2: 'var(--pc-line2)',
  text: 'var(--pc-text)',
  text2: 'var(--pc-text2)',
  text3: 'var(--pc-text3)',
  text4: 'var(--pc-text4)',
  bone: 'var(--pc-bone)',
  live: 'var(--pc-live)',
  letterbox: 'var(--pc-letterbox)',

  accent: 'var(--pc-accent)',
  accentInk: 'var(--pc-accent-ink)',
  accentSoft: 'var(--pc-accent-soft)',

  aColor: 'var(--pc-a)',
  aInk: 'var(--pc-a-ink)',
  bColor: 'var(--pc-b)',
  bInk: 'var(--pc-b-ink)',

  player(letter: 'A' | 'B') {
    return letter === 'A' ? 'var(--pc-a)' : 'var(--pc-b)';
  },
  playerInk(letter: 'A' | 'B') {
    return letter === 'A' ? 'var(--pc-a-ink)' : 'var(--pc-b-ink)';
  },
};

/**
 * Apply the broadcast theme by setting `data-pc-theme` on <html>. The stage and
 * every phone read the SAME server `state.stageTheme`, so calling this from each
 * shell keeps all devices in sync. Defaults to dark.
 */
export function useStageTheme(theme?: 'dark' | 'light' | null) {
  useEffect(() => {
    document.documentElement.dataset.pcTheme = theme === 'light' ? 'light' : 'dark';
  }, [theme]);
}

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
      @keyframes pcDrift { 0% { transform:translateY(40px); opacity:0; } 16% { opacity:.35; } 84% { opacity:.35; } 100% { transform:translateY(-260px); opacity:0; } }
    `}</style>
  );
}

// ─── StageBackdrop - restrained "arena energy" behind idle content ───────
// Sits at z-index 0 (below StageFrame's vignette/scanlines). Four faint
// layers: a single violet spotlight bloom (top-left), a masked pixel grid,
// a dim perspective fan along the floor (faded out at centre so it never
// crowds the slots), and a few slow drifting motes. Accent-only, no second
// hue; kept low-alpha so the dusk surface still reads premium, not gamer-RGB.
export function StageBackdrop() {
  const accent = '#7c4dff';
  const lime = '#c5ff3a';
  const mote = (left: string, delay: string, b = false): CSSProperties => ({
    position: 'absolute',
    left,
    width: 5,
    height: 5,
    background: b ? lime : accent,
    opacity: 0,
    animation: `pcDrift 11s linear ${delay} infinite`,
  });
  return (
    <div aria-hidden style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {/* spotlight bloom */}
      <div
        style={{
          position: 'absolute',
          width: 1100,
          height: 1100,
          left: -200,
          top: -300,
          background:
            'radial-gradient(circle at center, rgba(124,77,255,0.12) 0%, rgba(124,77,255,0.03) 36%, transparent 60%)',
          filter: 'blur(8px)',
        }}
      />
      {/* pixel grid, masked to upper-left so the centre stays calm */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(124,77,255,0.028) 1px, transparent 1px), linear-gradient(90deg, rgba(124,77,255,0.028) 1px, transparent 1px)',
          backgroundSize: '54px 54px',
          WebkitMaskImage: 'radial-gradient(ellipse 62% 60% at 32% 42%, #000 28%, transparent 76%)',
          maskImage: 'radial-gradient(ellipse 62% 60% at 32% 42%, #000 28%, transparent 76%)',
        }}
      />
      {/* arena floor fan, faded out at horizontal centre */}
      <svg
        viewBox="0 0 1920 280"
        preserveAspectRatio="none"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: 280,
          WebkitMaskImage: 'linear-gradient(90deg, #000 0%, transparent 40%, transparent 60%, #000 100%)',
          maskImage: 'linear-gradient(90deg, #000 0%, transparent 40%, transparent 60%, #000 100%)',
        }}
      >
        <g stroke={accent} strokeWidth={1.5} fill="none" opacity={0.16}>
          <line x1={960} y1={280} x2={120} y2={0} />
          <line x1={960} y1={280} x2={470} y2={0} />
          <line x1={960} y1={280} x2={1450} y2={0} />
          <line x1={960} y1={280} x2={1800} y2={0} />
        </g>
        <g stroke={accent} strokeWidth={1} fill="none" opacity={0.1}>
          <line x1={0} y1={210} x2={1920} y2={210} />
          <line x1={0} y1={140} x2={1920} y2={140} />
        </g>
      </svg>
      {/* drifting motes */}
      <div style={mote('15%', '0s')} />
      <div style={mote('28%', '3.4s', true)} />
      <div style={mote('7%', '6.6s')} />
    </div>
  );
}

// ─── StageScaler - fit the fixed 1920x1080 stage into any viewport ───────
export function StageScaler({ children }: { children: ReactNode }) {
  const [scale, setScale] = useState(1);
  // `ready` gates visibility until the first measurement lands. Without it the
  // SSR/pre-hydration paint shows the board at scale(1) (full 1920x1080, clipped
  // to the viewport centre) and then snaps to the fitted scale — a visible jump.
  // Hidden-until-measured trades that jump for one imperceptible frame of letterbox.
  const [ready, setReady] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // clientWidth/Height track the real layout viewport (and exclude scrollbars),
    // so min() always fits — unlike window.innerWidth/Height which drift under DPR quirks.
    //
    // Distinguish real window resize from browser zoom: under zoom the CSS viewport
    // shrinks/grows but devicePixelRatio moves inversely, so physical pixels
    // (clientWidth * dpr) stay ~constant. Under a real resize the physical area
    // changes. We only refit on real resizes — browser zoom passes through, so the
    // user can Ctrl+/- to inspect detail without us cancelling it.
    let lastDPR = window.devicePixelRatio || 1;
    let lastPhysW = document.documentElement.clientWidth * lastDPR;
    let lastPhysH = document.documentElement.clientHeight * lastDPR;

    const fit = (force = false) => {
      const vw = document.documentElement.clientWidth;
      const vh = document.documentElement.clientHeight;
      const dpr = window.devicePixelRatio || 1;
      const physW = vw * dpr;
      const physH = vh * dpr;
      const isZoom = !force && dpr !== lastDPR && Math.abs(physW - lastPhysW) < 4 && Math.abs(physH - lastPhysH) < 4;
      if (!isZoom) {
        setScale(Math.min(vw / STAGE_W, vh / STAGE_H));
        setReady(true);
      }
      lastDPR = dpr;
      lastPhysW = physW;
      lastPhysH = physH;
    };
    fit(true);
    // One more pass after layout/fonts settle.
    const raf = requestAnimationFrame(() => fit(true));

    const onResize = () => fit();
    window.addEventListener('resize', onResize);
    const vv = window.visualViewport;
    vv?.addEventListener('resize', onResize);
    vv?.addEventListener('scroll', onResize);

    let ro: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined' && frameRef.current) {
      ro = new ResizeObserver(onResize);
      ro.observe(frameRef.current);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      vv?.removeEventListener('resize', onResize);
      vv?.removeEventListener('scroll', onResize);
      ro?.disconnect();
    };
  }, []);
  return (
    <div
      ref={frameRef}
      style={{
        position: 'fixed',
        inset: 0,
        background: C.letterbox,
        overflow: 'hidden',
      }}
    >
      {/* Centre by the element's own box (translate -50%), NOT grid/flex centring:
          when the 1920x1080 layout box is larger than the viewport (e.g. 100% zoom
          on a <1920px screen), `place-items:center` start-aligns the overflowing
          item, shifting the scaled board down-right off-screen. translate(-50%,-50%)
          pins the board's centre to the viewport centre at any size. */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: STAGE_W,
          height: STAGE_H,
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: 'center center',
          visibility: ready ? 'visible' : 'hidden',
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
  category,
  difficulty,
}: {
  liveLabel: string;
  matchId: string;
  category?: string | null;
  difficulty?: string | null;
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
        {/* Kategori + zorluk rozeti. Gerçek prompt gizli; sadece "ne tür" ipucu. */}
        {category && <BroadcastChip>{category}</BroadcastChip>}
        {difficulty && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '4px 9px',
              borderRadius: 2,
              background: C.live,
              color: '#fff',
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
            }}
          >
            {difficulty}
          </span>
        )}
        {matchId && <BroadcastChip>{matchId}</BroadcastChip>}
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
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} style={{ stroke: C.line }} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="butt"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - progress)}
          style={{ stroke: color, transition: 'stroke-dashoffset 250ms linear, stroke 200ms ease-out' }}
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
  objectFit = 'cover',
}: {
  src: string | null;
  alt: string;
  accent: string;
  loadingLabel: string;
  dim?: boolean;
  /** Fill the remaining flex height instead of forcing a square. */
  fill?: boolean;
  /** 'cover' kırpar (varsayılan); 'contain' tüm görseli gösterir (kırpmaz). */
  objectFit?: 'cover' | 'contain';
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
        // Grayscale-only de-emphasis (no brightness drop): brightness(0.75) read
        // as muddy/dead on the light surface; grayscale + 0.5 opacity fades the
        // loser cleanly in both themes.
        filter: dim ? 'grayscale(0.6)' : 'none',
      }}
    >
      {src ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt} style={{ width: '100%', height: '100%', objectFit, display: 'block' }} />
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
          background: `linear-gradient(90deg, transparent 0%, color-mix(in srgb, ${accent} 20%, transparent) 50%, transparent 100%)`,
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

// ─── Reference chip - compact labelled frame for top bands of post-prompt phases ──
// Keeps the target image on screen as an anchor through generating/voting/result.
export function ReferenceChip({
  src,
  size = 200,
  loadingLabel,
  label,
}: {
  src: string | null;
  size?: number;
  loadingLabel: string;
  label: string;
}) {
  return (
    <div
      style={{
        background: C.ink2,
        border: `1px solid ${C.line}`,
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        alignItems: 'center',
      }}
    >
      <Lbl size={10}>{label}</Lbl>
      <ReferenceFrame src={src} alt={label} size={size} loadingLabel={loadingLabel} />
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
