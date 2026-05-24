'use client';

import { useEffect, useState } from 'react';
import { GameStateProvider } from '@/components/client/useGameState';
import { I18nProvider } from '@/components/client/i18nContext';
import { AdminLogin } from '@/components/admin/AdminLogin';
import { AdminPanel } from '@/components/admin/AdminPanel';

export default function Page() {
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/admin/me')
      .then((r) => r.json())
      .then((b) => setAuthed(!!b.ok))
      .catch(() => setAuthed(false));
  }, []);

  if (authed === null) {
    return (
      <main className="min-h-screen grid place-items-center text-white/40">…</main>
    );
  }

  if (!authed) {
    return (
      <I18nProvider>
        <AdminLogin onSuccess={() => setAuthed(true)} />
      </I18nProvider>
    );
  }

  return (
    <I18nProvider>
      <GameStateProvider role="admin">
        <AdminPanel />
      </GameStateProvider>
    </I18nProvider>
  );
}
