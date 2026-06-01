'use client';

/**
 * Mono caps section label with a short line prefix — the recurring
 * "─ DAVET LİNKLERİ", "─ ODA KODU", "─ NASIL OYNANIR" pattern across the
 * v2 mockup family. Used as both standalone section header and inline
 * field label.
 *
 * Ported from mockups/player-waiting.html .section-lab + .code-label and
 * mockups/landing-v2.html .code-label.
 */

import type { CSSProperties, ReactNode } from 'react';

type Props = {
  children: ReactNode;
  /** Render as <label htmlFor=…> instead of <span>. */
  htmlFor?: string;
  /** Override font size (default 10.5). */
  size?: number;
  style?: CSSProperties;
};

export function SectionLabel({ children, htmlFor, size = 10.5, style }: Props) {
  const baseStyle: CSSProperties = {
    fontFamily: "'Inter Tight', system-ui, sans-serif",
    fontSize: size,
    fontWeight: 700,
    letterSpacing: '0.22em',
    textTransform: 'uppercase',
    color: 'var(--pc-text3)',
    paddingLeft: 2,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    ...style,
  };

  const prefixLine = (
    <span
      aria-hidden="true"
      style={{
        width: 16,
        height: 1,
        background: 'var(--pc-line2)',
        flex: 'none',
      }}
    />
  );

  if (htmlFor) {
    return (
      <label htmlFor={htmlFor} style={baseStyle}>
        {prefixLine}
        {children}
      </label>
    );
  }
  return (
    <span style={baseStyle}>
      {prefixLine}
      {children}
    </span>
  );
}
