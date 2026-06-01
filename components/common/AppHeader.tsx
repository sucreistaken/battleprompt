'use client';

import Link from 'next/link';
import { MascotMark } from './MascotMark';
import { LangToggle } from './LangToggle';

type Props = {
  /** Slot rendered on the right side of the topbar (e.g. BackLink + LangToggle). */
  right?: React.ReactNode;
  /** When true, makes the wordmark a link to "/". Defaults to true. */
  brandLink?: boolean;
};

export function AppHeader({ right, brandLink = true }: Props) {
  const brand = (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        textDecoration: 'none',
        color: 'inherit'
      }}
    >
      <MascotMark size={28} ariaLabel="Prompt Clash" />
      <span
        style={{
          fontFamily: "'Silkscreen', monospace",
          fontSize: 14,
          letterSpacing: '0.04em',
          color: 'var(--pc-bone)'
        }}
      >
        PROMPT CLASH
      </span>
    </div>
  );

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        padding: '8px 0 14px',
        borderBottom: '1px solid var(--pc-ink3)'
      }}
    >
      {brandLink ? (
        <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          {brand}
        </Link>
      ) : (
        brand
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {right}
        <LangToggle />
      </div>
    </header>
  );
}
