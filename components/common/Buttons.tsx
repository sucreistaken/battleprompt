'use client';

// Shared CTA primitives — arena DNA: sharp corners, accent borders, no drop-
// shadow softness. Mirrors mockups/audience-generating.html surface principles.

import type { CSSProperties, ButtonHTMLAttributes, AnchorHTMLAttributes } from 'react';
import Link from 'next/link';

type Tone = 'primary' | 'secondary' | 'ghost' | 'done';
type Size = 'md' | 'lg';

function styleFor(tone: Tone, size: Size): CSSProperties {
  const height = size === 'lg' ? 56 : tone === 'secondary' || tone === 'ghost' ? 44 : 48;
  const fontSize = size === 'lg' ? 14 : 13;

  const base: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height,
    padding: '0 22px',
    borderRadius: 0,
    fontFamily: "'Inter Tight', system-ui, sans-serif",
    fontSize,
    fontWeight: 400,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'background 0.16s, border-color 0.16s, color 0.16s, transform 80ms ease-out'
  };

  if (tone === 'primary') {
    return {
      ...base,
      background: 'var(--pc-accent)',
      color: '#fff',
      border: '1.5px solid var(--pc-accent)'
    };
  }
  if (tone === 'secondary') {
    return {
      ...base,
      background: 'transparent',
      color: 'var(--pc-text)',
      border: '1.5px solid var(--pc-line2)',
      letterSpacing: '0.08em'
    };
  }
  if (tone === 'ghost') {
    return {
      ...base,
      background: 'var(--pc-ink2)',
      color: 'var(--pc-text)',
      border: '1px solid var(--pc-line)',
      letterSpacing: '0.08em',
      fontSize: 12
    };
  }
  // done — tıklanabilir success state; cursor `default` "disabled" hissi
  // veriyordu, `pointer` kalır (kullanıcı feedback için aktif element).
  return {
    ...base,
    background: 'rgba(174,210,74,0.10)',
    color: 'var(--pc-b)',
    border: '1.5px solid var(--pc-b)',
    cursor: 'pointer'
  };
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: Tone;
  size?: Size;
};

export function Button({ tone = 'primary', size = 'md', style, className, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      className={['pc-shared-btn', className].filter(Boolean).join(' ')}
      style={{ ...styleFor(tone, size), ...style }}
    />
  );
}

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  tone?: Tone;
  size?: Size;
  external?: boolean;
};

export function ButtonLink({
  href,
  tone = 'primary',
  size = 'md',
  external,
  style,
  className,
  children,
  ...rest
}: LinkProps) {
  const combined: CSSProperties = { ...styleFor(tone, size), ...style };
  const cls = ['pc-shared-btn', className].filter(Boolean).join(' ');
  if (external) {
    return (
      <a href={href} style={combined} className={cls} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} style={combined} className={cls} {...rest}>
      {children}
    </Link>
  );
}
