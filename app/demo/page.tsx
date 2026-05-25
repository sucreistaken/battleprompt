'use client';

/**
 * /demo — auto-playing walkthrough of every broadcast stage board with mock
 * data. No socket, no AI, no DB: open the URL and watch IDLE → VS → prompting →
 * generating → voting → result loop. A bottom control bar lets you pause and
 * step manually. This is the "see the whole design working" surface.
 */

import { useEffect, useState } from 'react';
import { GameCtx } from '@/components/client/useGameState';
import { I18nProvider } from '@/components/client/i18nContext';
import { StageShell } from '@/components/stage/StageShell';
import { mockGameCtx, DEMO_SEQUENCE } from '../preview/mock';

const PHASE_LABEL: Record<string, string> = {
  IDLE: 'Bekleme',
  PLAYER_1_JOINED: '1. oyuncu katıldı',
  VS_INTRO: 'Karşılaşma',
  PROMPTING: 'Prompt yazımı',
  GENERATING: 'AI üretiyor',
  SCORING: 'Puanlama',
  VOTING: 'Oylama',
  RESULT: 'Sonuç',
};

export default function DemoPage() {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const step = DEMO_SEQUENCE[idx];

  useEffect(() => {
    if (paused) return;
    const id = setTimeout(
      () => setIdx((i) => (i + 1) % DEMO_SEQUENCE.length),
      step.ms,
    );
    return () => clearTimeout(id);
  }, [idx, paused, step.ms]);

  const go = (delta: number) =>
    setIdx((i) => (i + delta + DEMO_SEQUENCE.length) % DEMO_SEQUENCE.length);

  return (
    <I18nProvider forceLang="tr">
      <GameCtx.Provider value={mockGameCtx(step.phase)}>
        <StageShell />
        <DemoBar
          label={PHASE_LABEL[step.phase] ?? step.phase}
          idx={idx}
          total={DEMO_SEQUENCE.length}
          paused={paused}
          onPrev={() => go(-1)}
          onNext={() => go(1)}
          onToggle={() => setPaused((p) => !p)}
        />
      </GameCtx.Provider>
    </I18nProvider>
  );
}

function DemoBar({
  label,
  idx,
  total,
  paused,
  onPrev,
  onNext,
  onToggle,
}: {
  label: string;
  idx: number;
  total: number;
  paused: boolean;
  onPrev: () => void;
  onNext: () => void;
  onToggle: () => void;
}) {
  return (
    <div
      style={{
        position: 'fixed',
        left: '50%',
        bottom: 24,
        transform: 'translateX(-50%)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '10px 14px',
        borderRadius: 999,
        background: 'rgba(16,16,22,0.92)',
        border: '1px solid rgba(255,255,255,0.12)',
        backdropFilter: 'blur(8px)',
        color: '#efeef5',
        fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
        fontSize: 13,
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
      }}
    >
      <span style={{ fontWeight: 700, color: '#7c4dff', letterSpacing: '0.1em' }}>DEMO</span>
      <CircleBtn onClick={onPrev} aria-label="Önceki">◀</CircleBtn>
      <CircleBtn onClick={onToggle} aria-label={paused ? 'Oynat' : 'Duraklat'}>
        {paused ? '▶' : 'II'}
      </CircleBtn>
      <CircleBtn onClick={onNext} aria-label="Sonraki">▶</CircleBtn>
      <span style={{ minWidth: 170 }}>
        <span style={{ color: '#a8a2b8' }}>{idx + 1}/{total}</span>{' · '}
        <span style={{ fontWeight: 600 }}>{label}</span>
      </span>
    </div>
  );
}

function CircleBtn({
  children,
  onClick,
  ...rest
}: {
  children: React.ReactNode;
  onClick: () => void;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      onClick={onClick}
      {...rest}
      style={{
        width: 34,
        height: 34,
        borderRadius: '50%',
        border: '1px solid rgba(255,255,255,0.18)',
        background: 'rgba(255,255,255,0.06)',
        color: '#efeef5',
        cursor: 'pointer',
        fontSize: 12,
        display: 'grid',
        placeItems: 'center',
        lineHeight: 1,
      }}
    >
      {children}
    </button>
  );
}
