'use client';

import { useI18n } from './i18nContext';
import { C, FONT } from '@/components/stage/atmosphere';
import type { Lang } from '@/i18n/dict';

/**
 * Sağ üstte sabit küçük TR | EN chip. Mobil/audience surface'lerinde MobileShell
 * tepesinde mount edilir. Stage'de görünmez — orayı admin'in stageLanguage'i
 * yönetir. Aktif dil seçimi localStorage'a (pc_lang) i18nContext tarafından
 * yazılır.
 */
export function LangToggle() {
  const { lang, setLang } = useI18n();
  return (
    <div
      aria-label="language"
      style={{
        position: 'fixed',
        top: 'calc(env(safe-area-inset-top) + 10px)',
        right: 'calc(env(safe-area-inset-right) + 10px)',
        zIndex: 50,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0,
        padding: '4px 6px',
        background: 'color-mix(in srgb, var(--pc-ink) 75%, transparent)',
        border: `1px solid ${C.line}`,
        borderRadius: 999,
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        fontFamily: FONT.mono,
        fontSize: 10,
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        userSelect: 'none',
      }}
    >
      <LangChip code="tr" active={lang === 'tr'} onSelect={setLang} />
      <span style={{ width: 1, height: 12, background: C.line, opacity: 0.6 }} />
      <LangChip code="en" active={lang === 'en'} onSelect={setLang} />
    </div>
  );
}

function LangChip({
  code,
  active,
  onSelect,
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
        color: active ? C.accent : C.text3,
        fontFamily: 'inherit',
        fontSize: 'inherit',
        letterSpacing: 'inherit',
        textTransform: 'inherit',
        cursor: active ? 'default' : 'pointer',
        fontWeight: active ? 600 : 400,
      }}
    >
      {code.toUpperCase()}
    </button>
  );
}
