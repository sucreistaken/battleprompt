'use client';

import { useState, type FormEvent } from 'react';
import { useGameState } from './useGameState';
import { useI18n } from './i18nContext';

/**
 * Shared join logic — nickname state, validation, submit and reason→i18n error
 * mapping. Extracted from JoinForm so the dark StageEntry and the (light)
 * JoinForm can share one implementation. The socket emit lives in
 * useGameState().joinGame; this hook only owns the form state and error copy.
 */
export function useJoin() {
  const { joinGame } = useGameState();
  const { t } = useI18n();
  const [nickname, setNickname] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = nickname.trim().length >= 2 && !submitting;

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    const res = await joinGame(nickname.trim());
    if (!res.ok) {
      const reasonKey =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ({
          too_short: 'nicknameTooShort',
          too_long: 'nicknameTooLong',
          invalid: 'nicknameInvalid',
          profane: 'nicknameProfane',
        } as Record<string, any>)[res.reason || ''] || 'nicknameInvalid';
      setError(t(reasonKey));
      setSubmitting(false);
    }
  };

  const updateNickname = (value: string) => {
    setNickname(value);
    if (error) setError(null);
  };

  return { nickname, setNickname: updateNickname, error, submitting, canSubmit, handleSubmit };
}
