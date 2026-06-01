'use client';

// Room-scoped stage — Story 1.10 + Story 2.7. Routes IDLE/PLAYER_1_JOINED
// to the custom room-scoped StageWaiting (correct join QR + room code);
// every other phase delegates to the existing StageShell which already
// owns the cinematic phase boards.

import { useEffect, useState } from 'react';
import { MotionConfig } from 'framer-motion';
import {
  StageFonts,
  StageKeyframes,
  StageScaler,
  useStageTheme
} from '@/components/stage/atmosphere';
import { StageWaiting } from '@/components/stage/StageWaiting';
import { I18nProvider, useI18n } from '@/components/client/i18nContext';
import { GameStateProvider, useGameState } from '@/components/client/useGameState';
import { StageShell } from '@/components/stage/StageShell';

type Props = {
  roomId: string;
  roomCode: string;
  stageTheme: 'dark' | 'light';
  stageLanguage: 'tr' | 'en';
  origin: string;
};

export function StageClient(props: Props) {
  return (
    <I18nProvider forceLang={props.stageLanguage}>
      <GameStateProvider role="stage" roomId={props.roomId}>
        <StageBody {...props} />
      </GameStateProvider>
    </I18nProvider>
  );
}

function StageBody({ roomCode, stageTheme, origin }: Props) {
  const { t } = useI18n();
  const { state } = useGameState();
  useStageTheme(stageTheme);
  const [disconnected, setDisconnected] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.key === 'f' || e.key === 'F') && !e.metaKey && !e.ctrlKey && !e.altKey) {
        toggleFullscreen();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // TODO(Story 2.8 polish): tie this into useRoomState's `disconnected` flag.
  void setDisconnected;

  const phase = state?.phase;
  const isWaiting = !phase || phase === 'IDLE' || phase === 'PLAYER_1_JOINED';

  if (isWaiting) {
    return (
      <MotionConfig reducedMotion="user">
        <StageFonts />
        <StageKeyframes />
        <StageScaler>
          <StageWaiting roomCode={roomCode} joinUrl={`${origin}/join/${roomCode}`} />
        </StageScaler>
        <AriaLive text={t('stageAnnounceRoomReady')} />
        {disconnected ? <DisconnectOverlay text={t('stageDisconnected')} /> : null}
        <FullscreenButton label={t('stageFullscreen')} />
      </MotionConfig>
    );
  }

  // Live match phases — delegate to the existing StageShell. It already routes
  // VS_INTRO / PROMPTING / GENERATING / SCORING / VOTING / TIEBREAK_VOTE / RESULT
  // to the correct phase board, and consumes the room-scoped state via the
  // GameStateProvider we wrap above.
  return (
    <>
      <StageShell />
      <AriaLive text={phaseToAnnouncement(t, phase)} />
      {disconnected ? <DisconnectOverlay text={t('stageDisconnected')} /> : null}
      <FullscreenButton label={t('stageFullscreen')} />
    </>
  );
}

function phaseToAnnouncement(t: (k: any) => string, phase: string): string {
  switch (phase) {
    case 'VS_INTRO':
      return t('stageAnnounceVsIntro');
    case 'PROMPTING':
      return t('stageAnnouncePrompting');
    case 'GENERATING':
      return t('stageAnnounceGenerating');
    case 'SCORING':
      return t('stageAnnounceScoring');
    case 'VOTING':
    case 'TIEBREAK_VOTE':
      return t('stageAnnounceVoting');
    case 'RESULT':
      return t('stageAnnounceResult');
    default:
      return '';
  }
}

function AriaLive({ text }: { text: string }) {
  return (
    <div
      aria-live="polite"
      style={{
        position: 'absolute',
        left: -9999,
        top: 0,
        width: 1,
        height: 1,
        overflow: 'hidden'
      }}
    >
      {text}
    </div>
  );
}

function DisconnectOverlay({ text }: { text: string }) {
  return (
    <div
      role="alert"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        color: 'var(--pc-bone)',
        fontFamily: "'Inter Tight', system-ui, sans-serif",
        fontSize: 28,
        textAlign: 'center',
        padding: 40
      }}
    >
      {text}
    </div>
  );
}

function toggleFullscreen() {
  if (typeof document === 'undefined') return;
  const doc = document as any;
  if (!document.fullscreenElement && !doc.webkitFullscreenElement) {
    const el = document.documentElement as any;
    (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el);
  } else {
    (document.exitFullscreen || doc.webkitExitFullscreen)?.call(document);
  }
}

function FullscreenButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={toggleFullscreen}
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 50,
        padding: '10px 16px',
        background: 'rgba(0,0,0,0.5)',
        color: 'var(--pc-text2)',
        border: '1px solid var(--pc-line2)',
        borderRadius: 12,
        fontFamily: "'Inter Tight', system-ui, sans-serif",
        fontSize: 11,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        fontWeight: 600
      }}
      aria-label={label}
    >
      ⛶ {label}
    </button>
  );
}
