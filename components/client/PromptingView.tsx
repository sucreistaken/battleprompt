'use client';

import { useEffect, useState } from 'react';
import { useGameState } from './useGameState';
import { useI18n } from './i18nContext';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { cn } from '@/lib/utils';

/**
 * PROMPTING phase — active player writes their prompt.
 * Layout: countdown + reference image + textarea + submit, all stacked vertical.
 * Throttled typing broadcast so stage live prompts update fluidly.
 */
export function PromptingView() {
  const { state, mySlot, submitPrompt, sendTyping } = useGameState();
  const { t } = useI18n();
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Throttle typing broadcast (every 250ms while user types)
  useEffect(() => {
    if (submitted || state?.phase !== 'PROMPTING') return;
    const id = setTimeout(() => sendTyping(text), 250);
    return () => clearTimeout(id);
  }, [text, submitted, sendTyping, state?.phase]);

  if (!state || !mySlot) return null;

  const isWaiting = state.phase === 'VS_INTRO';
  const promptDuration = state.durations.promptDurationSec;
  const me = state.players[mySlot];
  const opponentSlot = mySlot === 'A' ? 'B' : 'A';
  const opponent = state.players[opponentSlot];

  const handleSubmit = () => {
    if (submitted || !text.trim()) return;
    submitPrompt(text.trim());
    setSubmitted(true);
  };

  return (
    <main className="min-h-screen flex flex-col bg-surface qdl-safe-top">
      {/* Top bar: countdown + meta */}
      <header className="px-6 pt-4 pb-3 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="q-label q-label-primary">
            {mySlot === 'A' ? 'Sen · Player A' : 'Sen · Player B'}
          </span>
          <span className="text-sm text-ink-variant">
            {t('opponent')}:{' '}
            <span className="font-semibold text-ink">{opponent?.nickname ?? '—'}</span>
          </span>
        </div>
        {!isWaiting && (
          <CountdownTimer
            endsAt={state.phaseEndsAt}
            totalSeconds={promptDuration}
            label={t('timeLeft')}
          />
        )}
      </header>

      {/* Reference image */}
      {state.referenceImageUrl && (
        <section className="px-6 mt-2">
          <div className="q-card-elevated overflow-hidden aspect-square">
            <img
              src={state.referenceImageUrl}
              alt={t('referenceImage')}
              className="w-full h-full object-cover"
            />
          </div>
          <p className="q-label mt-2 text-center">{t('referenceImage')}</p>
        </section>
      )}

      {/* Prompt input */}
      <section className="px-6 mt-6 flex-1 flex flex-col">
        <label htmlFor="prompt" className="q-label mb-2 block">
          {t('yourPrompt')}
        </label>
        <textarea
          id="prompt"
          rows={5}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('typeYourPrompt')}
          maxLength={280}
          disabled={submitted || isWaiting}
          className={cn(
            'q-field flex-1 min-h-[160px]',
            submitted && 'opacity-70',
          )}
        />
        <div className="mt-1 flex justify-end">
          <span className="text-xs text-ink-light tabular-nums">{text.length}/280</span>
        </div>
      </section>

      {/* Submit */}
      <footer className="px-6 pt-4 pb-6 qdl-safe-bottom">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitted || !text.trim() || isWaiting}
          className="q-cta"
        >
          {submitted ? t('submitted') : t('submit')}
        </button>
      </footer>
    </main>
  );
}
