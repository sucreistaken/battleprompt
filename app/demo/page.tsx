import type { Metadata } from 'next';
import DemoPageClient from './DemoPageClient';

export const metadata: Metadata = {
  title: 'Otomatik demo',
  description:
    'Tüm faz akışını mock veriyle gezen otomatik demo. Bekleme, karşılaşma, prompt, AI üretim, oylama ve sonuç döngüsünü tek bir tarayıcı sekmesinde izle.',
  alternates: { canonical: '/demo' },
  openGraph: {
    title: 'Otomatik demo · Prompt Clash',
    description: 'Bütün maç fazlarını mock veriyle döngüsel izle.',
    url: '/demo',
  },
};

export default function DemoPage() {
  return <DemoPageClient />;
}
