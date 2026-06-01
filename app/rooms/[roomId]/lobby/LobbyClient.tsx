'use client';

import { I18nProvider } from '@/components/client/i18nContext';
import { GameStateProvider } from '@/components/client/useGameState';
import { MobileShell } from '@/components/client/MobileShell';

export function LobbyClient({ roomId }: { roomId: string }) {
  return (
    <I18nProvider>
      <GameStateProvider role="audience" roomId={roomId}>
        <MobileShell />
      </GameStateProvider>
    </I18nProvider>
  );
}
