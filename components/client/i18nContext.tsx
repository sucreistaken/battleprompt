'use client';

import { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { dictionaries, pickLang, type Lang, type DictKey } from '@/i18n/dict';

interface Ctx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: DictKey) => string;
}

const I18nCtx = createContext<Ctx | null>(null);

export function I18nProvider({
  children,
  forceLang
}: {
  children: React.ReactNode;
  forceLang?: Lang;
}) {
  const [lang, setLang] = useState<Lang>(forceLang || 'tr');

  useEffect(() => {
    if (forceLang) {
      setLang(forceLang);
    } else {
      setLang(pickLang());
    }
  }, [forceLang]);

  const value = useMemo<Ctx>(
    () => ({
      lang,
      setLang,
      t: (k: DictKey) => dictionaries[lang][k] ?? String(k)
    }),
    [lang]
  );

  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nCtx);
  if (!ctx) throw new Error('useI18n must be inside I18nProvider');
  return ctx;
}
