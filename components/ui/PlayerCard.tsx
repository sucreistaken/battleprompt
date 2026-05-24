'use client';

import { cn } from '@/lib/utils';
import { useI18n } from '@/components/client/i18nContext';
import type { PlayerSnapshot, Slot } from '@/types/game';

interface PlayerCardProps {
  slot: Slot;
  player: PlayerSnapshot | null;
  variant?: 'stage' | 'mobile';
  state?: 'idle' | 'typing' | 'submitted' | 'generating' | 'revealed' | 'winner' | 'loser';
  imageUrl?: string | null;
  livePromptText?: string;
  showLivePrompt?: boolean;
  aiScore?: number | null;
  voteCount?: number | null;
  className?: string;
}

/**
 * Unified player card — used on stage and mobile for both A and B.
 * Variants:
 *   - stage: large, side-by-side with VS divider
 *   - mobile: compact, vertical stack
 * State drives visual: idle (skeleton), typing (live prompt strip),
 * submitted (check pill), generating (shimmer), revealed (image + score),
 * winner (primary glow), loser (dimmed).
 */
export function PlayerCard({
  slot,
  player,
  variant = 'stage',
  state = 'idle',
  imageUrl,
  livePromptText,
  showLivePrompt,
  aiScore,
  voteCount,
  className,
}: PlayerCardProps) {
  const { t } = useI18n();
  const isStage = variant === 'stage';
  const nickname = player?.nickname ?? `${t('playerLabel')} ${slot}`;
  const finalImage = imageUrl ?? player?.imageUrl ?? null;

  return (
    <div
      className={cn(
        'q-card-elevated overflow-hidden flex flex-col',
        isStage ? 'w-full aspect-[3/4] max-w-[480px]' : 'w-full aspect-square',
        state === 'winner' && 'ring-4 ring-primary shadow-cardLg',
        state === 'loser' && 'opacity-50',
        'transition-all duration-300',
        className,
      )}
    >
      {/* Slot label + nickname */}
      <div className="px-4 py-3 lg:px-6 lg:py-4 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'q-display rounded-full bg-primary text-white grid place-items-center font-extrabold tabular-nums',
              isStage ? 'w-12 h-12 text-2xl' : 'w-8 h-8 text-base',
            )}
            aria-hidden="true"
          >
            {slot}
          </span>
          <span className={cn('font-semibold', isStage ? 'text-2xl' : 'text-base')}>
            {nickname}
          </span>
        </div>
        {state === 'submitted' && (
          <span className="q-pill-primary">{isStage ? t('ready') : '✓'}</span>
        )}
        {player?.disconnected && (
          <span className="q-pill bg-danger text-white">{t('offline')}</span>
        )}
      </div>

      {/* Image / state body */}
      <div className="flex-1 relative bg-primary-50">
        {state === 'idle' && (
          <div className="absolute inset-0 q-skeleton" />
        )}
        {state === 'typing' && showLivePrompt && (
          <div className="absolute inset-0 p-6 flex items-center">
            <p className={cn('q-mono leading-relaxed text-ink-variant',
              isStage ? 'text-2xl' : 'text-base')}>
              {livePromptText || <span className="text-ink-light">…</span>}
            </p>
          </div>
        )}
        {state === 'generating' && (
          <div className="absolute inset-0 grid place-items-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-full border-4 border-primary-100 border-t-primary animate-spin" />
              <span className="q-label">{t('aiDrawing')}</span>
            </div>
          </div>
        )}
        {(state === 'revealed' || state === 'winner' || state === 'loser') && finalImage && (
          <img
            src={finalImage}
            alt={`${nickname} prompt result`}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
      </div>

      {/* Footer: AI score or vote count */}
      {(typeof aiScore === 'number' || typeof voteCount === 'number') && (
        <div className="px-4 py-3 lg:px-6 lg:py-4 border-t border-border flex items-center justify-between">
          {typeof aiScore === 'number' ? (
            <>
              <span className="q-label">{t('aiPoints')}</span>
              <span className={cn('q-display tabular-nums', isStage ? 'text-3xl' : 'text-xl')}>
                {aiScore}
              </span>
            </>
          ) : (
            <>
              <span className="q-label">{t('votesLabel')}</span>
              <span className={cn('q-display tabular-nums', isStage ? 'text-3xl' : 'text-xl')}>
                {voteCount}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
