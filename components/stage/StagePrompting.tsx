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
      <TopBar liveLabel={t('live')} matchId={matchId} theme={state.theme} />

      <div
        style={{
          position: 'absolute',
          top: 140,
          bottom: 60,
          left: 60,
          right: 60,
          display: 'grid',
          gridTemplateColumns: '1fr 480px 1fr',
          gap: 36,
        }}
      >
        <PlayerPanel
          letter="A"
          name={state.players.A?.nickname ?? '-'}
          prompt={livePrompts.A}
          submitted={!!state.players.A?.submitted}
          showPrompt={state.showLivePrompts}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
          <div
            style={{
              background: C.ink2,
              border: `1px solid ${C.line}`,
              padding: 22,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              alignItems: 'center',
            }}
          >
            <Lbl size={11}>{t('referenceImage')}</Lbl>
            <ReferenceFrame
              src={state.referenceImageUrl}
              alt={t('referenceImage')}
              size={384}
              loadingLabel={t('loadingText')}
            />
            <div
              style={{
                alignSelf: 'stretch',
                textAlign: 'center',
                fontFamily: FONT.body,
                fontSize: 16,
                color: C.text2,
                fontStyle: 'italic',
                lineHeight: 1.4,
              }}
            >
              &ldquo;{state.theme}&rdquo;
            </div>
          </div>

          <div
            style={{
              background: C.ink2,
              border: `1px solid ${C.line}`,
              padding: '28px 22px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 18,
            }}
          >
            <Lbl size={11}>{t('timeLeft')}</Lbl>
            <CountdownRing size={180} progress={cd.progress} value={cd.value} danger={cd.danger} stroke={6} />
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
        <Avatar letter={letter} size={88} player={letter} />
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
          <span style={{ fontFamily: FONT.body, fontSize: 38, fontWeight: 700, color: C.bone, lineHeight: 1 }}>
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
              <path d="M2 7 L6 11 L12 3" stroke={ink} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
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
              fontSize: 30,
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
                  width: 14,
                  height: 34,
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
