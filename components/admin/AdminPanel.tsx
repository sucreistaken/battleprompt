'use client';

import { useEffect, useState } from 'react';
import { AdminLogin } from './AdminLogin';
import { SettingsForm } from './SettingsForm';
import { MatchHistory } from './MatchHistory';
import { useI18n } from '@/components/client/i18nContext';

type AuthState = 'checking' | 'unauth' | 'auth';

export function AdminPanel() {
  const { t } = useI18n();
  const [auth, setAuth] = useState<AuthState>('checking');

  useEffect(() => {
    fetch('/api/admin/me', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setAuth(d.ok ? 'auth' : 'unauth'))
      .catch(() => setAuth('unauth'));
  }, []);

  if (auth === 'checking') {
    return (
      <main className="min-h-screen grid place-items-center bg-surface">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-[3px] border-primary-100 border-t-primary animate-spin" />
          <p className="q-label">yetki kontrolü</p>
        </div>
      </main>
    );
  }

  if (auth === 'unauth') {
    return <AdminLogin onSuccess={() => setAuth('auth')} />;
  }

  return (
    <main className="min-h-screen bg-surface qdl-safe-top">
      {/* Top bar */}
      <header className="border-b border-border bg-surface sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 lg:px-10 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="q-display text-2xl text-primary">prompt clash</span>
            <span className="q-label">{t('adminTitle')}</span>
          </div>
          <button
            type="button"
            onClick={async () => {
              await fetch('/api/admin/login', { method: 'DELETE' });
              setAuth('unauth');
            }}
            className="q-link text-sm"
          >
            Çıkış
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 lg:px-10 py-10 grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-8">
        <section>
          <h2 className="q-display text-display-lg text-ink mb-2">Ayarlar</h2>
          <p className="text-ink-variant mb-6">Maç parametreleri ve sahne tercihleri.</p>
          <SettingsForm />
        </section>
        <aside>
          <h2 className="q-display text-display-lg text-ink mb-2">{t('matchHistory')}</h2>
          <p className="text-ink-variant mb-6">Son 20 maç.</p>
          <MatchHistory />
        </aside>
      </div>
    </main>
  );
}
