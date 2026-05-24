'use client';

import { useState, type FormEvent } from 'react';
import { useGameState } from './useGameState';
import { useI18n } from './i18nContext';
import { cn } from '@/lib/utils';

interface Props {
  waitingFor?: string | null;
}

/**
 * IDLE / PLAYER_1_JOINED entry — mobile join form.
 * Asymmetric: big editorial display headline on top, soft input cluster below.
 * Helper line under input. Empathetic error tone.
 */
export function JoinForm({ waitingFor }: Props) {
  const { joinGame } = useGameState();
  const { t } = useI18n();
  const [nickname, setNickname] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = nickname.trim().length >= 2 && !submitting;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    const res = await joinGame(nickname.trim());
    if (!res.ok) {
      const reasonKey = ({
        too_short: 'nicknameTooShort',
        too_long: 'nicknameTooLong',
        invalid: 'nicknameInvalid',
        profane: 'nicknameProfane',
      } as Record<string, any>)[res.reason || ''] || 'nicknameInvalid';
      setError(t(reasonKey));
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col bg-surface qdl-safe-top">
      {/* Hero block */}
      <section className="px-6 pt-8 pb-10 flex-1 flex flex-col">
        <div className="flex flex-col gap-3">
          <span className="q-label q-label-primary">{t('brandWordmark')}</span>
          <h1 className="q-display text-display-xl text-ink">
            {t('heroLine1')}<br />
            <span className="text-primary">{t('heroAccent')}</span>{' '}{t('heroLine2')}
          </h1>
        </div>

        {waitingFor && (
          <div className="mt-6 q-card-soft p-4 animate-slideUp">
            <p className="text-sm text-ink-variant">
              <span className="font-semibold text-primary-700">{waitingFor}</span>{' '}
              {t('waitingPlayer2').replace('…', '')}, {t('joinAsPlayerB')}.
            </p>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1 min-h-8" />

        {/* Form cluster */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <div>
            <label htmlFor="nickname" className="q-label mb-2 block">
              {t('nicknamePlaceholder')}
            </label>
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value);
                if (error) setError(null);
              }}
              placeholder={t('nicknamePlaceholder')}
              maxLength={20}
              autoComplete="off"
              autoFocus
              aria-invalid={!!error}
              aria-describedby={error ? 'nickname-error' : undefined}
              disabled={submitting}
              className="q-field text-lg"
            />
            {error && (
              <p id="nickname-error" role="alert" className="mt-2 text-sm text-danger">
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className={cn('q-cta', submitting && 'opacity-70')}
          >
            {submitting ? '…' : t('joinGame')}
          </button>
        </form>
      </section>

      {/* Footer hint */}
      <footer className="px-6 pb-8 qdl-safe-bottom">
        <p className="text-xs text-ink-light text-center">
          {t('joinFooterHint')}
        </p>
      </footer>
    </main>
  );
}
