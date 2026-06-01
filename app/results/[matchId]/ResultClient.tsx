'use client';

// Public result share page client — Story 5.1. Minimal layout that surfaces
// the winner + both images + reference + AI scores. UX-DR4 loser-shaming
// ban honored (positive runner-up framing).

import { I18nProvider, useI18n } from '@/components/client/i18nContext';
import { LangToggle } from '@/components/client/LangToggle';
import type { CSSProperties } from 'react';

type Match = {
  _id?: string;
  targetPrompt?: string;
  category?: string;
  difficulty?: string;
  referenceImageUrl?: string;
  winnerMode?: string;
  playerA?: { nickname?: string; prompt?: string; imageUrl?: string; aiScore?: number; voteCount?: number };
  playerB?: { nickname?: string; prompt?: string; imageUrl?: string; aiScore?: number; voteCount?: number };
  winner?: 'A' | 'B' | 'TIE';
  startedAt?: string;
};

export function ResultClient({ match }: { match: Match }) {
  return (
    <I18nProvider>
      <ResultBody match={match} />
    </I18nProvider>
  );
}

function ResultBody({ match }: { match: Match }) {
  const { t } = useI18n();
  const winnerSide = match.winner;
  const wrap: CSSProperties = {
    minHeight: '100vh',
    background: 'var(--pc-ink)',
    color: 'var(--pc-text)',
    padding: '40px 20px',
    fontFamily: "'Inter Tight', system-ui, sans-serif"
  };
  const shell: CSSProperties = {
    maxWidth: 920,
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 24
  };

  return (
    <main style={wrap}>
      <div style={shell}>
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline'
          }}
        >
          <span
            style={{
              fontFamily: "'Inter Tight', system-ui, sans-serif",
              fontSize: 18,
              letterSpacing: '0.04em',
              color: 'var(--pc-bone)'
            }}
          >
            PROMPT CLASH
          </span>
          <LangToggle />
        </header>

        <section>
          <span
            style={{
              fontFamily: "'Inter Tight', system-ui, sans-serif",
              fontSize: 11,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--pc-text3)'
            }}
          >
            {match.category || '—'}
          </span>
          <h1
            style={{
              fontFamily: "'Inter Tight', system-ui, sans-serif",
              fontSize: 56,
              color: 'var(--pc-bone)',
              letterSpacing: '0.02em',
              fontWeight: 400,
              marginTop: 6,
              lineHeight: 1
            }}
          >
            {winnerSide === 'TIE'
              ? t('tie')
              : winnerSide === 'A'
              ? match.playerA?.nickname || 'A'
              : match.playerB?.nickname || 'B'}{' '}
            {winnerSide !== 'TIE' ? t('winner') : ''}
          </h1>
        </section>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 16
          }}
        >
          <PlayerCard
            slot="A"
            isWinner={winnerSide === 'A'}
            nickname={match.playerA?.nickname}
            prompt={match.playerA?.prompt}
            imageUrl={match.playerA?.imageUrl}
            score={match.playerA?.aiScore}
            voteCount={match.playerA?.voteCount}
            t={t}
          />
          <PlayerCard
            slot="B"
            isWinner={winnerSide === 'B'}
            nickname={match.playerB?.nickname}
            prompt={match.playerB?.prompt}
            imageUrl={match.playerB?.imageUrl}
            score={match.playerB?.aiScore}
            voteCount={match.playerB?.voteCount}
            t={t}
          />
        </div>

        {match.referenceImageUrl ? (
          <section
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              padding: 16,
              background: 'var(--pc-ink2)',
              border: '1px solid var(--pc-line)',
              borderRadius: 12
            }}
          >
            <span
              style={{
                fontFamily: "'Inter Tight', system-ui, sans-serif",
                fontSize: 11,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'var(--pc-text3)'
              }}
            >
              {t('referenceImage')}
            </span>
            <img
              src={match.referenceImageUrl}
              alt={t('referenceImage')}
              style={{
                width: '100%',
                maxWidth: 360,
                height: 'auto',
                borderRadius: 8,
                margin: '0 auto'
              }}
            />
            {match.targetPrompt ? (
              <p style={{ fontSize: 14, color: 'var(--pc-text2)', lineHeight: 1.5 }}>
                {match.targetPrompt}
              </p>
            ) : null}
          </section>
        ) : null}

        <footer
          style={{
            fontSize: 12,
            color: 'var(--pc-text3)',
            textAlign: 'center'
          }}
        >
          <a
            href="/create-room"
            style={{
              color: 'var(--pc-accent)',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: 14
            }}
          >
            {t('resultsCreateYourOwn')} →
          </a>
        </footer>
      </div>
    </main>
  );
}

function PlayerCard({
  slot,
  isWinner,
  nickname,
  prompt,
  imageUrl,
  score,
  voteCount,
  t
}: {
  slot: 'A' | 'B';
  isWinner: boolean;
  nickname?: string;
  prompt?: string;
  imageUrl?: string;
  score?: number;
  voteCount?: number;
  t: (k: any) => string;
}) {
  return (
    <article
      style={{
        background: 'var(--pc-ink2)',
        border: `1px solid ${isWinner ? 'var(--pc-accent)' : 'var(--pc-line)'}`,
        borderRadius: 14,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 10
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline'
        }}
      >
        <span
          style={{
            fontFamily: "'Inter Tight', system-ui, sans-serif",
            fontSize: 18,
            color: 'var(--pc-bone)',
            letterSpacing: '0.04em'
          }}
        >
          {nickname || `Player ${slot}`}
        </span>
        {isWinner ? (
          <span
            style={{
              fontFamily: "'Inter Tight', system-ui, sans-serif",
              fontSize: 11,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--pc-accent)'
            }}
          >
            {t('winner')}
          </span>
        ) : null}
      </div>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={nickname || `Player ${slot}`}
          style={{ width: '100%', height: 'auto', borderRadius: 8 }}
        />
      ) : (
        <div
          style={{
            width: '100%',
            aspectRatio: '1',
            background: 'var(--pc-ink3)',
            borderRadius: 8
          }}
        />
      )}
      {prompt ? (
        <p style={{ fontSize: 13, color: 'var(--pc-text2)', lineHeight: 1.5 }}>{prompt}</p>
      ) : null}
      <div
        style={{
          display: 'flex',
          gap: 14,
          fontSize: 12,
          color: 'var(--pc-text3)',
          fontFamily: "'Inter Tight', system-ui, sans-serif"
        }}
      >
        {typeof score === 'number' ? <span>AI {score}</span> : null}
        {typeof voteCount === 'number' && voteCount > 0 ? <span>{voteCount} vote</span> : null}
      </div>
    </article>
  );
}
