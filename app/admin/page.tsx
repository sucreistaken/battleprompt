import type { Metadata } from 'next';
import AdminPageClient from './AdminPageClient';

export const metadata: Metadata = {
  title: 'Operatör paneli',
  description: 'Prompt Clash operatör paneli.',
  robots: { index: false, follow: false },
  alternates: { canonical: '/admin' },
};

export default function AdminPage() {
  return <AdminPageClient />;
}
