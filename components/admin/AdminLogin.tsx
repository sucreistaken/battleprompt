'use client';

import { useState, type FormEvent } from 'react';
import { useI18n } from '@/components/client/i18nContext';
import { cn } from '@/lib/utils';

interface Props {
  onSuccess: () => void;
}

export function AdminLogin({ onSuccess }: Props) {
  const { t } = useI18n();
  const [password, setPassword] = useState('');
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!password.trim() || working) return;
    setWorking(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.ok) {
        onSuccess();
      } else {
        setError(data.reason === 'locked' ? t('adminLocked') : t('adminWrong'));
      }
    } catch {
      setError(t('disconnected'));
    } finally {
      setWorking(false);
    }
  };

  return (
    <main className="min-h-screen grid place-items-center bg-surface px-6">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-3 mb-8">
          <span className="q-label q-label-primary">prompt clash · admin</span>
          <h1 className="q-display text-display-xl text-ink">
            {t('adminTitle')}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <div>
            <label htmlFor="password" className="q-label mb-2 block">
              {t('adminPassword')}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(null);
              }}
              autoFocus
              autoComplete="current-password"
              aria-invalid={!!error}
              aria-describedby={error ? 'pw-error' : undefined}
              disabled={working}
              className="q-field text-lg"
            />
            {error && (
              <p id="pw-error" role="alert" className="mt-2 text-sm text-danger">
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={working || !password.trim()}
            className={cn('q-cta', working && 'opacity-70')}
          >
            {working ? '…' : t('adminLogin')}
          </button>
        </form>
      </div>
    </main>
  );
}
