import type { Metadata } from 'next';
import StagePreviewClient from './StagePreviewClient';

export const metadata: Metadata = {
  title: 'Stage preview',
  description: 'Dev preview, mock state ile sahne yüzeyi.',
  robots: { index: false, follow: false },
};

export default function StagePreviewPage() {
  return <StagePreviewClient />;
}
