import type { Metadata } from 'next';
import StagePageClient from './StagePageClient';

export const metadata: Metadata = {
  title: 'Sahne, projeksiyon yayını',
  description:
    'Etkinlik sahnesi için canlı yayın. QR ile katılım, hedef görsel, oyuncu kapışmaları, AI üretim ve kazanan açıklaması.',
  alternates: { canonical: '/stage' },
  openGraph: {
    title: 'Sahne, projeksiyon yayını · Prompt Clash',
    description: 'Etkinlikte projeksiyona yansıyan canlı kapışma sahnesi.',
    url: '/stage',
  },
};

export default function StagePage() {
  return <StagePageClient />;
}
