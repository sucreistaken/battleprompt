'use client';

/**
 * Root (localhost:3000) — the JOIN surface. Anyone (player or audience), on any
 * device, opens this, types a nickname and joins. The first two devices to join
 * become players A/B; everyone else votes. The /stage QR encodes this URL, so
 * scanning it just opens this page — scanning is a shortcut, never a requirement.
 *
 * The big-screen broadcast lives at /stage; the operator panel at /admin.
 */

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
