import type { Metadata, Viewport } from 'next';
import '../styles/globals.css';
import { poppins } from './fonts';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
const DESCRIPTION =
  'Etkinlikler için 1v1 AI görsel üretme yarışması. QR ile katıl, 60 saniyede hedefe en yakın promptu yaz, AI kazananı seçsin.';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'Prompt Clash, 1v1 AI görsel kapışması',
    template: '%s · Prompt Clash',
  },
  description: DESCRIPTION,
  applicationName: 'Prompt Clash',
  keywords: [
    'Prompt Clash',
    'AI görsel yarışması',
    'etkinlik AI oyunu',
    'QR oyun',
    '1v1 prompt battle',
    'AI image battle',
    'Türkçe AI yarışma',
  ],
  authors: [{ name: 'Prompt Clash' }],
  creator: 'Prompt Clash',
  publisher: 'Prompt Clash',
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  manifest: '/manifest.webmanifest',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    siteName: 'Prompt Clash',
    locale: 'tr_TR',
    title: 'Prompt Clash, 1v1 AI görsel kapışması',
    description: DESCRIPTION,
    url: '/',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Prompt Clash, 1v1 AI görsel kapışması',
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#22202b' },
    { media: '(prefers-color-scheme: light)', color: '#f6f7f9' },
  ],
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={poppins.variable}>
      {/* No bg-surface here: the body inherits the dusk base from globals.css so
          the dark broadcast app never flashes white. Admin sets its own light
          bg-surface on its <main>. */}
      <body className="font-body text-ink antialiased">{children}</body>
    </html>
  );
}
