import type { Metadata } from 'next';
import { I18nProvider } from '@/components/client/i18nContext';
import { LandingClient } from './LandingClient';

/**
 * Root (`/`) — Sally Sprint v3 landing. Marketing/entry surface with two
 * intents: "Oda oluştur" (→ /create-room) and "kodla katıl" (→ /join/<code>).
 * Audience join still happens via stage QR → /watch/<code>. The legacy
 * single-room MobileShell-on-root flow is retired; in-room player/audience
 * UI lives under /rooms/[roomId]/lobby and /rooms/[roomId]/game.
 */

export const metadata: Metadata = {
  title: 'Prompt Clash · 1v1 AI görsel kapışması',
  description:
    'Etkinliklerde sahneye yansıt, herkes QR ile katılsın. İki kişi prompt yazar, AI iki sonuç üretir, hedefe yakın olan kazanır.'
};

export default function HomePage() {
  return (
    <I18nProvider>
      <LandingClient />
    </I18nProvider>
  );
}
