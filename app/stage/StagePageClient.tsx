'use client';

import { GameStateProvider, useGameState } from '@/components/client/useGameState';
import { I18nProvider } from '@/components/client/i18nContext';
import { StageShell } from '@/components/stage/StageShell';

export default function StagePageClient() {
  return (
    <GameStateProvider role="stage">
      <I18nBridge>
        <StageShell />
      </I18nBridge>
    </GameStateProvider>
  );
}

function I18nBridge({ children }: { children: React.ReactNode }) {
  const { state } = useGameState();
  const lang = state?.stageLanguage || 'tr';
  return <I18nProvider forceLang={lang}>{children}</I18nProvider>;
}
