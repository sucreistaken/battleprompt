'use client';

import { useGameState } from '@/components/client/useGameState';
import { useI18n } from '@/components/client/i18nContext';
import {
  StageFrame,
  TopBar,
  Avatar,
  Lbl,
  ReferenceFrame,
  CountdownRing,
  useCountdown,
  C,
  FONT,
  PROMPT_MAX,
} from './atmosphere';

/**
 * PROMPTING - twin jersey panels (A left, B mirrored right) + center column
 * (reference image + live countdown). Both prompts stream to the room unless
 * the admin's showLivePrompts toggle is off.
 */
export function StagePrompting() {
  const { state, livePrompts } = useGameState();
  const { t } = useI18n();
  const cd = useCountdown(state?.phaseEndsAt ?? null, state?.durations.promptDurationSec ?? 30);

  if (!state) return null;
  const matchId = state.matchId ? state.matchId.slice(-4).toUpperCase() : '';

  return (
    <StageFrame>
      <TopBar liveLabel={t('live')} matchId={matchId} category={state.roundCategoryLabel} difficulty={state.roundDifficultyLabel} />

      <div
        style={{
          position: 'absolute',
          top: 132,
          bottom: 52,
          left: 44,
          right: 44,
          display: 'grid',
          gridTemplateColumns: '1fr 560px 1fr',
          gap: 32,
        }}
      >
        <PlayerPanel
          letter="A"
          name={state.players.A?.nickname ?? '-'}
          prompt={livePrompts.A}
          submitted={!!state.players.A?.submitted}
          showPrompt={state.showLivePrompts}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div
            style={{
              background: C.ink2,
              border: `1px solid ${C.line}`,
              padding: 18,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              alignItems: 'center',
            }}
          >
            <Lbl size={11}>{t('referenceImage')}</Lbl>
            <ReferenceFrame
              src={state.referenceImageUrl}
              alt={t('referenceImage')}
              size={480}
              loadingLabel={t('loadingText')}
            />
            {/* Tema metni gizli: oyuncu hedef görseli yorumlamalı. */}
          </div>

          <div
            style={{
              flex: 1,
              background: C.ink2,
              border: `1px solid ${C.line}`,
              padding: '24px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 20,
            }}
          >
            <Lbl size={11}>{t('timeLeft')}</Lbl>
            <CountdownRing size={172} progress={cd.progress} value={cd.value} danger={cd.danger} stroke={6} />
          </div>
        </div>

        <PlayerPanel
          letter="B"
          name={state.players.B?.nickname ?? '-'}
          prompt={livePrompts.B}
          submitted={!!state.players.B?.submitted}
          showPrompt={state.showLivePrompts}
          mirrored
        />
      </div>
    </StageFrame>
  );
}

function PlayerPanel({
  letter,
  name,
  prompt,
  submitted,
  showPrompt,
  mirrored = false,
}: {
  letter: 'A' | 'B';
  name: string;
  prompt: string;
  submitted: boolean;
  showPrompt: boolean;
  mirrored?: boolean;
}) {
  const { t } = useI18n();
  const color = C.player(letter);
  const ink = C.playerInk(letter);
  const active = !submitted;
  const charCount = Math.min(prompt.length, PROMPT_MAX);

  return (
    <div
      style={{
        position: 'relative',
        background: C.ink2,
        border: `1px solid ${active ? color : C.line}`,
        borderLeft: mirrored ? `1px solid ${active ? color : C.line}` : `5px solid ${color}`,
        borderRight: mirrored ? `5px solid ${color}` : `1px solid ${active ? color : C.line}`,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 720,
      }}
    >
      {/* Top stripe */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
          background: active ? color : C.ink3,
          color: active ? ink : C.text2,
          borderBottom: `1px solid ${active ? color : C.line}`,
          flexDirection: mirrored ? 'row-reverse' : 'row',
        }}
      >
        <span style={{ fontFamily: FONT.pixel, fontSize: 18, letterSpacing: '0.1em' }}>
          {(active ? t('typingShort') : t('submittedShort')).toUpperCase()} · {t('playerLabel').toUpperCase()} {letter}
        </span>
        <span style={{ fontFamily: FONT.mono, fontSize: 13, letterSpacing: '0.12em' }}>
          {charCount}/{PROMPT_MAX}
        </span>
      </div>

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 22,
          padding: '30px 36px 24px',
          flexDirection: mirrored ? 'row-reverse' : 'row',
        }}
      >
        <Avatar letter={letter} size={80} player={letter} />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            alignItems: mirrored ? 'flex-end' : 'flex-start',
          }}
        >
          <Lbl size={12} color={color}>
            {t('playerLabel')} {letter}
          </Lbl>
          <span style={{ fontFamily: FONT.body, fontSize: 35, fontWeight: 700, color: C.bone, lineHeight: 1 }}>
            {name}
          </span>
        </div>
        <div style={{ flex: 1 }} />
        {submitted && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 14px',
              background: color,
              color: ink,
              fontFamily: FONT.pixel,
              fontSize: 14,
              letterSpacing: '0.1em',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 14 14">
              <path d="M2 7 L6 11 L12 3" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: ink }} />
            </svg>
            {t('lockedLabel')}
          </div>
        )}
      </div>

      <div style={{ height: 1, background: C.line, margin: '0 36px' }} />

      {/* Prompt */}
      <div style={{ flex: 1, padding: '28px 36px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <Lbl size={11} color="text3">
          {submitted ? t('submittedPromptLabel') : t('livePromptLabel')}
        </Lbl>
        {showPrompt ? (
          <div
            style={{
              fontFamily: FONT.mono,
              fontSize: 28,
              lineHeight: 1.52,
              color: submitted ? C.text2 : C.bone,
              letterSpacing: '-0.005em',
            }}
          >
            {prompt || (active ? '' : '-')}
            {active && (
              <span
                style={{
                  display: 'inline-block',
                  width: 13,
                  height: 31,
                  background: color,
                  verticalAlign: 'text-bottom',
                  marginLeft: 4,
                  animation: 'pcCaret 0.53s steps(2, end) infinite',
                }}
              />
            )}
          </div>
        ) : (
          <Lbl size={14} color="text4">
            {t('promptHidden')}
          </Lbl>
        )}
      </div>
    </div>
  );
}
