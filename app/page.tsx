'use client';

import { GameStateProvider } from '@/components/client/useGameState';
import { I18nProvider } from '@/components/client/i18nContext';
import { MobileShell } from '@/components/client/MobileShell';

export default function HomePage() {
  return (
    <I18nProvider>
      <GameStateProvider role="audience">
        <MobileShell />
      </GameStateProvider>
    </I18nProvider>
  );
}
