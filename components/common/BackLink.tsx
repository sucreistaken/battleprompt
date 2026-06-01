'use client';

import Link from 'next/link';

type Props = {
  href: string;
  label: string;
};

export function BackLink({ href, label }: Props) {
  return (
    <Link
      href={href}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontFamily: "'Inter Tight', system-ui, sans-serif",
        fontSize: 11,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: 'var(--pc-text3)',
        textDecoration: 'none',
        padding: '4px 8px',
        borderRadius: 6
      }}
    >
      <span aria-hidden="true">←</span>
      <span>{label}</span>
    </Link>
  );
}
