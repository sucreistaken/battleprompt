'use client';

import { createContext, useContext, useMemo, useState, useEffect, useCallback } from 'react';
import { dictionaries, pickLang, type Lang, type DictKey } from '@/i18n/dict';

interface Ctx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: DictKey) => string;
}

const I18nCtx = createContext<Ctx | null>(null);

const STORAGE_KEY = 'pc_lang';

function readStoredLang(): Lang | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === 'tr' || raw === 'en') return raw;
  } catch {
    // localStorage unavailable (private mode, etc.) — fall back to detection.
  }
  return null;
}

export function I18nProvider({
  children,
  forceLang
}: {
  children: React.ReactNode;
  forceLang?: Lang;
}) {
  const [lang, setLangState] = useState<Lang>(forceLang || 'tr');

  useEffect(() => {
    if (forceLang) {
      setLangState(forceLang);
      return;
    }
    const stored = readStoredLang();
    setLangState(stored ?? pickLang());
  }, [forceLang]);

  const setLang = useCallback(
    (l: Lang) => {
      setLangState(l);
      if (forceLang) return;
      if (typeof window === 'undefined') return;
      try {
        window.localStorage.setItem(STORAGE_KEY, l);
      } catch {
        // ignore — selection is still applied in-memory for this session.
      }
    },
    [forceLang]
  );

  const value = useMemo<Ctx>(
    () => ({
      lang,
      setLang,
      t: (k: DictKey) => dictionaries[lang][k] ?? String(k)
    }),
    [lang, setLang]
  );

  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nCtx);
  if (!ctx) throw new Error('useI18n must be inside I18nProvider');
  return ctx;
}
