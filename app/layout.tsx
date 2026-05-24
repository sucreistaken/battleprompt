import type { Metadata, Viewport } from 'next';
import '../styles/globals.css';
import { poppins } from './fonts';

export const metadata: Metadata = {
  title: {
    default: 'Prompt Clash',
    template: '%s · Prompt Clash',
  },
  description: 'Etkinliklerde QR ile katılımlı 1v1 AI görsel üretme yarışması.',
  applicationName: 'Prompt Clash',
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'Prompt Clash',
    locale: 'tr_TR',
  },
};

export const viewport: Viewport = {
  themeColor: '#541fc4',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={poppins.variable}>
      <body className="font-body bg-surface text-ink antialiased">{children}</body>
    </html>
  );
}
