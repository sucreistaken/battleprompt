'use client';

/**
 * Red Bull–style hand-drawn ink doodles for Prompt Clash.
 * All strokes use currentColor so they pick up parent text color.
 * Paths intentionally wobbly to feel hand-drawn (Joko Schimanski / Tartanson vibe).
 * Spot color: tangerine. Ink: navy.
 */

import { CSSProperties } from 'react';

interface DoodleProps {
  className?: string;
  style?: CSSProperties;
}

// ---------- Hand-drawn arrow pointing right-down ----------
export function ScribbleArrow({ className = '', style }: DoodleProps) {
  return (
    <svg
      viewBox="0 0 140 80"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
    >
      <path d="M5 12 C 20 18, 35 6, 52 16 S 80 6, 95 22 S 118 12, 130 32" />
      <path d="M125 22 L132 34 L118 38" />
    </svg>
  );
}

// ---------- POW / action burst ----------
export function ActionBurst({
  className = '',
  style,
  label = 'POW!'
}: DoodleProps & { label?: string }) {
  return (
    <div className={`relative inline-block ${className}`} style={style}>
      <svg viewBox="0 0 160 160" className="w-full h-full">
        <polygon
          points="80,4 96,42 138,30 110,66 156,80 110,94 138,130 96,118 80,156 64,118 22,130 50,94 4,80 50,66 22,30 64,42"
          fill="currentColor"
          stroke="#001f3f"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center font-display italic font-black text-navy text-2xl rotate-[-8deg]">
        {label}
      </span>
    </div>
  );
}

// ---------- Speed / motion lines (3 short strokes) ----------
export function SpeedLines({ className = '', style }: DoodleProps) {
  return (
    <svg
      viewBox="0 0 80 60"
      fill="none"
      stroke="currentColor"
      strokeWidth="3.5"
      strokeLinecap="round"
      className={className}
      style={style}
    >
      <path d="M4 14 L 64 12" />
      <path d="M14 32 L 76 30" />
      <path d="M2 50 L 56 48" />
    </svg>
  );
}

// ---------- Loose scribble underline ----------
export function ScribbleUnderline({ className = '', style }: DoodleProps) {
  return (
    <svg
      viewBox="0 0 220 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
      preserveAspectRatio="none"
      className={className}
      style={style}
    >
      <path d="M4 10 C 30 4, 60 14, 90 8 S 150 12, 180 6 S 210 10, 216 8" />
    </svg>
  );
}

// ---------- Loose hand-drawn circle (wraps something) ----------
export function ScribbleCircle({ className = '', style }: DoodleProps) {
  return (
    <svg
      viewBox="0 0 200 100"
      fill="none"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
      preserveAspectRatio="none"
      className={className}
      style={style}
    >
      <path d="M30 50 C 30 18, 90 6, 120 8 S 180 22, 184 52 S 150 92, 100 92 S 36 86, 30 56 S 32 28, 70 18" />
    </svg>
  );
}

// ---------- Tiny brush star ("hit") ----------
export function InkStar({ className = '', style }: DoodleProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="currentColor"
      stroke="#001f3f"
      strokeWidth="2.5"
      strokeLinejoin="round"
      className={className}
      style={style}
    >
      <path d="M24 2 L29 19 L46 22 L33 32 L37 47 L24 38 L11 47 L15 32 L2 22 L19 19 Z" />
    </svg>
  );
}

// ---------- Hand-drawn speech bubble ----------
export function SpeechBubble({
  className = '',
  style,
  children
}: DoodleProps & { children?: React.ReactNode }) {
  return (
    <div className={`relative inline-block ${className}`} style={style}>
      <svg viewBox="0 0 200 120" className="absolute inset-0 w-full h-full">
        <path
          d="M15 18 C 20 6, 180 4, 188 18 S 196 80, 180 92 L 100 96 L 60 116 L 70 96 L 30 92 C 8 88, 10 24, 15 18 Z"
          fill="#fdfcf0"
          stroke="#001f3f"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
      </svg>
      <div className="relative px-7 py-5 font-display italic font-bold text-navy text-xl">
        {children}
      </div>
    </div>
  );
}

// ---------- Lightning bolt (energy / live) ----------
export function LightningBolt({ className = '', style }: DoodleProps) {
  return (
    <svg
      viewBox="0 0 60 100"
      fill="currentColor"
      stroke="#001f3f"
      strokeWidth="3"
      strokeLinejoin="round"
      className={className}
      style={style}
    >
      <path d="M36 4 L 8 56 L 26 56 L 18 96 L 52 38 L 32 38 Z" />
    </svg>
  );
}

// ---------- Pixel — the Prompt Clash mascot.
// A chunky retro CRT/TV-head robot with antennae, broadcasting personality.
// Drawn loose & wobbly for the Red Bull cartoonist feel.
export function Pixel({
  className = '',
  style,
  emote = 'happy'
}: DoodleProps & { emote?: 'happy' | 'excited' | 'thinking' | 'shout' }) {
  return (
    <svg
      viewBox="0 0 140 130"
      fill="none"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
    >
      {/* Antennae */}
      <path d="M40 22 C 36 8, 24 6, 22 18" />
      <circle cx="20" cy="14" r="4" fill="currentColor" />
      <path d="M100 22 C 104 8, 116 6, 118 18" />
      <circle cx="120" cy="14" r="4" fill="currentColor" />

      {/* TV head — chunky rounded rectangle */}
      <path d="M26 32 C 24 28, 28 24, 34 24 L 106 24 C 112 24, 116 28, 114 32 L 114 94 C 114 100, 110 102, 104 102 L 36 102 C 30 102, 26 100, 26 94 Z" />

      {/* Inner screen bezel */}
      <path d="M36 38 L 104 38 L 104 84 L 36 84 Z" />

      {/* Face — varies by emote */}
      {emote === 'happy' && (
        <>
          {/* Eyes */}
          <circle cx="56" cy="56" r="3.5" fill="currentColor" />
          <circle cx="84" cy="56" r="3.5" fill="currentColor" />
          {/* Smile */}
          <path d="M52 68 Q 70 80 88 68" fill="none" />
        </>
      )}
      {emote === 'excited' && (
        <>
          {/* Star eyes */}
          <path d="M52 50 L 56 60 L 62 56 L 56 58 L 58 66 L 54 60 L 48 62 L 54 56 Z" fill="currentColor" />
          <path d="M80 50 L 84 60 L 90 56 L 84 58 L 86 66 L 82 60 L 76 62 L 82 56 Z" fill="currentColor" />
          {/* Open smile */}
          <path d="M52 70 Q 70 84 88 70 L 86 72 Q 70 80 54 72 Z" fill="currentColor" />
        </>
      )}
      {emote === 'thinking' && (
        <>
          {/* Side-eyes */}
          <ellipse cx="60" cy="56" rx="4" ry="3" fill="currentColor" />
          <ellipse cx="88" cy="56" rx="4" ry="3" fill="currentColor" />
          {/* Pursed mouth */}
          <path d="M62 72 L 78 72" />
        </>
      )}
      {emote === 'shout' && (
        <>
          {/* Squint eyes */}
          <path d="M50 56 L 60 56" />
          <path d="M80 56 L 90 56" />
          {/* Wide-open shout */}
          <ellipse cx="70" cy="74" rx="10" ry="6" fill="currentColor" />
        </>
      )}

      {/* Volume / button on bottom */}
      <circle cx="44" cy="93" r="2.5" fill="currentColor" />
      <path d="M52 93 L 64 93" />

      {/* Little legs */}
      <path d="M50 102 L 50 116 L 56 116" />
      <path d="M90 102 L 90 116 L 84 116" />
    </svg>
  );
}

// ---------- Annotation arrow with text ("HERE!") ----------
export function PointerNote({
  label = 'HERE',
  className = '',
  style,
  rotate = -10
}: DoodleProps & { label?: string; rotate?: number }) {
  return (
    <div
      className={`relative inline-flex items-end gap-2 ${className}`}
      style={{ transform: `rotate(${rotate}deg)`, ...style }}
    >
      <span className="font-display italic font-black text-base whitespace-nowrap">
        {label}
      </span>
      <ScribbleArrow className="w-14 h-8 -mb-1" />
    </div>
  );
}

// ---------- Crown for the winner ----------
export function InkCrown({ className = '', style }: DoodleProps) {
  return (
    <svg
      viewBox="0 0 160 90"
      fill="currentColor"
      stroke="#001f3f"
      strokeWidth="4"
      strokeLinejoin="round"
      strokeLinecap="round"
      className={className}
      style={style}
    >
      <path d="M8 78 L 14 22 L 42 56 L 60 14 L 80 60 L 100 14 L 118 56 L 146 22 L 152 78 Z" />
      <path d="M8 78 L 152 78" />
      <circle cx="14" cy="22" r="5" />
      <circle cx="80" cy="14" r="5" />
      <circle cx="146" cy="22" r="5" />
    </svg>
  );
}

// ---------- Wings (right side, mirror via CSS scale-x for left) ----------
export function InkWing({ className = '', style }: DoodleProps) {
  return (
    <svg
      viewBox="0 0 200 100"
      fill="none"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
    >
      <path d="M4 60 C 30 10, 80 8, 130 24 S 195 50, 196 88" />
      <path d="M20 60 C 40 36, 70 28, 100 36" />
      <path d="M40 70 C 60 50, 90 44, 120 50" />
      <path d="M60 80 C 80 64, 100 58, 130 64" />
    </svg>
  );
}

// ---------- Hatching pattern (small parallel strokes) ----------
export function Hatching({ className = '', style }: DoodleProps) {
  return (
    <svg
      viewBox="0 0 80 80"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      className={className}
      style={style}
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <line key={i} x1={10 + i * 8} y1={6} x2={-2 + i * 8} y2={70} />
      ))}
    </svg>
  );
}
