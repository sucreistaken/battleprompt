'use client';

import { useGameState } from '@/components/client/useGameState';
import { useI18n } from '@/components/client/i18nContext';
import { StageChrome, LiveBadge, StageMatchMeta } from '@/components/ui/StageChrome';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { cn } from '@/lib/utils';

/**
 * PROMPTING stage — countdown center, two live-prompt panels side by side.
 * Live prompts visible only when admin enabled showLivePrompts.
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
      <div className="w-full max-w-7xl">
        {/* Top: countdown */}
        <div className="flex flex-col items-center gap-3 mb-12">
          <CountdownTimer
            endsAt={state.phaseEndsAt}
            totalSeconds={state.durations.promptDurationSec}
            variant="stage"
            label={t('timeLeft')}
          />
        </div>

        {/* Two live-prompt panels */}
        <div className="grid grid-cols-2 gap-8">
          {(['A', 'B'] as const).map((slot) => {
            const player = state.players[slot];
            const promptText = livePrompts[slot];
            const submitted = !!player?.submitted;
            return (
              <div key={slot} className="q-card-elevated overflow-hidden flex flex-col min-h-[400px]">
                <div className="px-6 py-4 flex items-center justify-between border-b border-border">
                  <div className="flex items-center gap-3">
                    <span className="q-display w-12 h-12 rounded-full bg-primary text-white grid place-items-center text-2xl">
                      {slot}
                    </span>
                    <span className="text-2xl font-semibold">{player?.nickname ?? '—'}</span>
                  </div>
                  {submitted && (
                    <span className="q-pill-primary text-base">{t('submitted')}</span>
                  )}
                </div>
                <div className="flex-1 p-8 bg-primary-50 flex items-start">
                  {state.showLivePrompts ? (
                    <p
                      className={cn(
                        'q-mono leading-relaxed text-ink',
                        promptText ? 'text-2xl' : 'text-ink-light text-xl',
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
          })}
        </div>
      </div>
    </StageChrome>
  );
}
