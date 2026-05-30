import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Prompt Clash, 1v1 AI görsel kapışması',
    short_name: 'Prompt Clash',
    description:
      'Etkinlikler için QR ile katılımlı 1v1 AI görsel üretme yarışması.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#22202b',
    theme_color: '#22202b',
    lang: 'tr',
    categories: ['games', 'entertainment'],
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/apple-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  };
}
