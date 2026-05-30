import type { Metadata } from 'next';
import PhonePreviewClient from './PhonePreviewClient';

export const metadata: Metadata = {
  title: 'Phone preview',
  description: 'Dev preview, mock state ile mobil cihaz yüzeyi.',
  robots: { index: false, follow: false },
};

export default function PhonePreviewPage() {
  return <PhonePreviewClient />;
}
