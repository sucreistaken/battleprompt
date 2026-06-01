'use client';

// Inline (non-fixed) language chip used inside AppHeader. Mirrors the
// `mockups/*.html` .lang pill exactly; the fixed-position floating chip
// stays in `@/components/client/LangToggle` for legacy MobileShell layouts.

import { useI18n } from '@/components/client/i18nContext';
import type { Lang } from '@/i18n/dict';

export function LangToggle() {
  const { lang, setLang } = useI18n();
  return (
    <div
      aria-label="language"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0,
        padding: '3px 4px',
        background: 'color-mix(in srgb, var(--pc-ink) 75%, transparent)',
        border: '1px solid var(--pc-line)',
        borderRadius: 999,
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        fontFamily: "'Inter Tight', system-ui, sans-serif",
        fontSize: 10,
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        userSelect: 'none'
      }}
    >
      <Chip code="tr" active={lang === 'tr'} onSelect={setLang} />
      <span style={{ width: 1, height: 12, background: 'var(--pc-line)', opacity: 0.6 }} />
      <Chip code="en" active={lang === 'en'} onSelect={setLang} />
    </div>
  );
}

function Chip({
  code,
  active,
  onSelect
}: {
  code: Lang;
  active: boolean;
  onSelect: (l: Lang) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(code)}
      aria-pressed={active}
      style={{
        appearance: 'none',
        border: 'none',
        background: 'transparent',
        padding: '4px 10px',
        color: active ? 'var(--pc-accent)' : 'var(--pc-text3)',
        fontFamily: 'inherit',
        fontSize: 'inherit',
        letterSpacing: 'inherit',
        textTransform: 'inherit',
        cursor: active ? 'default' : 'pointer',
        fontWeight: active ? 600 : 400
      }}
    >
      {code.toUpperCase()}
    </button>
  );
}
