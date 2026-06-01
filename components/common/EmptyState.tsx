'use client';

// Generic empty-state surface used by room-not-found and similar dead-end
// screens. Centered, axolotl mark, error code, title, description, CTA stack.

import type { ReactNode } from 'react';
import { MascotMark } from './MascotMark';

type Props = {
  /** All-caps small label above the title (e.g. "404 · oda bulunamadı"). */
  code?: string;
  title: string;
  description?: ReactNode;
  /** Action buttons stack (use <ButtonLink/Button> from Buttons.tsx). */
  actions?: ReactNode;
};

export function EmptyState({ code, title, description, actions }: Props) {
  return (
    <section
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 20px',
        position: 'relative',
        zIndex: 1
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 18,
          maxWidth: 380,
          width: '100%'
        }}
      >
        <div style={{ opacity: 0.85, filter: 'grayscale(0.3)' }}>
          <MascotMark size={80} ariaLabel="Prompt Clash" />
        </div>
        {code ? (
          <span
            style={{
              fontFamily: "'Inter Tight', system-ui, sans-serif",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--pc-text4)'
            }}
          >
            {code}
          </span>
        ) : null}
        <h1
          style={{
            fontFamily: "'Inter Tight', system-ui, sans-serif",
            fontSize: 'clamp(26px, 7vw, 32px)',
            color: 'var(--pc-bone)',
            letterSpacing: '0.04em',
            fontWeight: 400,
            lineHeight: 1.2,
            margin: 0
          }}
        >
          {title}
        </h1>
        {description ? (
          <p
            style={{
              fontFamily: "'Inter Tight', system-ui, sans-serif",
              fontSize: 15,
              color: 'var(--pc-text2)',
              lineHeight: 1.55,
              margin: 0
            }}
          >
            {description}
          </p>
        ) : null}
        {actions ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              width: '100%',
              marginTop: 8
            }}
          >
            {actions}
          </div>
        ) : null}
      </div>
    </section>
  );
}
