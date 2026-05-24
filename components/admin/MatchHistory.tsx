'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '@/components/client/i18nContext';

interface MatchRow {
  _id: string;
  matchId: string;
  theme: string;
  winner: 'A' | 'B' | 'TIE' | null;
  winnerMode: 'AI_SCORE' | 'AUDIENCE_VOTE';
  players: {
    A?: { nickname: string; aiScore: number | null };
    B?: { nickname: string; aiScore: number | null };
  };
  votes: { A: number; B: number } | null;
  finishedAt: string;
}

export function MatchHistory() {
  const { t } = useI18n();
  const [matches, setMatches] = useState<MatchRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/matches', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setMatches(d.matches);
        else setError(t('loadFailed'));
      })
      .catch(() => setError(t('loadFailed')));
  }, [t]);

  if (matches === null && !error) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="q-card p-4 h-24 q-skeleton" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="q-card-soft p-6 text-center">
        <p className="text-sm text-ink-variant">{error}</p>
      </div>
    );
  }

  if (!matches || matches.length === 0) {
    return (
      <div className="q-card-soft p-6 text-center">
        <p className="q-label">{t('noMatches')}</p>
        <p className="mt-1 text-sm text-ink-variant">
          {t('noMatchesBody')}
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {matches.map((m) => (
        <li key={m._id} className="q-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="q-label">#{m.matchId.slice(-4)}</span>
            <span className="text-xs text-ink-light">
              {new Date(m.finishedAt).toLocaleString('tr-TR', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <PlayerRow
              slot="A"
              nickname={m.players.A?.nickname ?? '—'}
              winner={m.winner === 'A'}
              score={m.winnerMode === 'AI_SCORE' ? m.players.A?.aiScore : m.votes?.A}
            />
            <span className="q-label text-ink-light">vs</span>
            <PlayerRow
              slot="B"
              nickname={m.players.B?.nickname ?? '—'}
              winner={m.winner === 'B'}
              score={m.winnerMode === 'AI_SCORE' ? m.players.B?.aiScore : m.votes?.B}
              align="right"
            />
          </div>
          {m.theme && (
            <p className="mt-2 text-xs text-ink-variant truncate">{m.theme}</p>
          )}
          {m.winner === 'TIE' && (
            <p className="mt-1 q-label">{t('tie')}</p>
          )}
        </li>
      ))}
    </ul>
  );
}

function PlayerRow({
  slot,
  nickname,
  winner,
  score,
  align = 'left',
}: {
  slot: 'A' | 'B';
  nickname: string;
  winner: boolean;
  score: number | null | undefined;
  align?: 'left' | 'right';
}) {
  return (
    <div className={`flex flex-col ${align === 'right' ? 'items-end text-right' : 'items-start'}`}>
      <span className={`text-sm font-semibold truncate max-w-full ${winner ? 'text-primary' : 'text-ink'}`}>
        {winner && '🏆 '}
        {nickname}
      </span>
      {typeof score === 'number' && (
        <span className="text-xs text-ink-variant tabular-nums">{score}</span>
      )}
    </div>
  );
}
