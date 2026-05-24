'use client';

import { useGameState } from '@/components/client/useGameState';
import { useI18n } from '@/components/client/i18nContext';
import { StageChrome, LiveBadge, StageMatchMeta } from '@/components/ui/StageChrome';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { cn } from '@/lib/utils';

/**
 * PROMPTING stage — 3-col layout:
 *   [ A live prompt panel ] [ reference image + countdown ] [ B live prompt panel ]
 * Both prompts visible to the room (live updates via socket prompt_typing).
 * Admin's showLivePrompts toggle still respected.
 */
export function StagePrompting() {
  const { state, livePrompts } = useGameState();
  const { t } = useI18n();

  if (!state) return null;
  const a = state.players.A;
  const b = state.players.B;

  return (
    <StageChrome
      topBar={
        <>
          <div className="flex items-center gap-4">
            <span className="q-display text-2xl text-primary">prompt clash</span>
            <LiveBadge />
          </div>
          <StageMatchMeta theme={state.theme} matchLabel={`${t('match')} #${state.matchId?.slice(-4) ?? ''}`} />
        </>
      }
    >
      <div className="w-full max-w-[1440px]">
        <div className="grid grid-cols-[1fr_auto_1fr] gap-8 items-stretch">
          {/* A panel (left) */}
          <PromptPanel
            slot="A"
            nickname={a?.nickname ?? '—'}
            submitted={!!a?.submitted}
            promptText={livePrompts.A}
            showPrompt={state.showLivePrompts}
            submittedLabel={t('submitted')}
          />

          {/* Reference + countdown (center) */}
          <div className="flex flex-col items-center gap-5 w-[440px]">
            <span className="q-label text-base">{t('referenceImage')}</span>
            <div className="q-card-elevated overflow-hidden w-full aspect-square bg-primary-50">
              {state.referenceImageUrl ? (
                <img
                  src={state.referenceImageUrl}
                  alt={t('referenceImage')}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full q-skeleton grid place-items-center">
                  <span className="q-label">yükleniyor</span>
                </div>
              )}
            </div>
            <CountdownTimer
              endsAt={state.phaseEndsAt}
              totalSeconds={state.durations.promptDurationSec}
              variant="stage"
              label={t('timeLeft')}
            />
          </div>

          {/* B panel (right) */}
          <PromptPanel
            slot="B"
            nickname={b?.nickname ?? '—'}
            submitted={!!b?.submitted}
            promptText={livePrompts.B}
            showPrompt={state.showLivePrompts}
            submittedLabel={t('submitted')}
          />
        </div>
      </div>
    </StageChrome>
  );
}

function PromptPanel({
  slot,
  nickname,
  submitted,
  promptText,
  showPrompt,
  submittedLabel,
}: {
  slot: 'A' | 'B';
  nickname: string;
  submitted: boolean;
  promptText: string;
  showPrompt: boolean;
  submittedLabel: string;
}) {
  return (
    <div
      className={cn(
        'q-card-elevated overflow-hidden flex flex-col min-h-[520px] transition-all',
        submitted && 'ring-2 ring-primary/40',
      )}
    >
      <div className="px-6 py-4 flex items-center justify-between border-b border-border bg-surface">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'q-display w-14 h-14 rounded-full bg-primary text-white grid place-items-center text-3xl shadow-cta',
            )}
          >
            {slot}
          </span>
          <div className="flex flex-col">
            <span className="q-label">Player {slot}</span>
            <span className="text-2xl font-semibold text-ink truncate max-w-[260px]">{nickname}</span>
          </div>
        </div>
        {submitted && <span className="q-pill-primary text-base">{submittedLabel}</span>}
      </div>
      <div className="flex-1 p-8 bg-primary-50 flex items-start">
        {showPrompt ? (
          <p
            className={cn(
              'q-mono leading-relaxed',
              promptText ? 'text-2xl text-ink' : 'text-xl text-ink-light',
            )}
          >
            {promptText || 'yazıyor…'}
          </p>
        ) : (
          <p className="q-label text-ink-light">prompt gizli</p>
        )}
      </div>
    </div>
  );
}
