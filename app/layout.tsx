import type { Metadata, Viewport } from 'next';
import '../styles/globals.css';
import { sourceSerif, archivo } from './fonts';

export const metadata: Metadata = {
  title: 'Prompt Clash — Live Broadcast',
  description: '1v1 AI image generation duel — broadcast live'
};

export const viewport: Viewport = {
  themeColor: '#fdfcf0',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${sourceSerif.variable} ${archivo.variable}`}>
      <body className="font-sans bg-cream text-navy antialiased">{children}</body>
    </html>
  );
}
