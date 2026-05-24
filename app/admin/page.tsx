'use client';

import { I18nProvider } from '@/components/client/i18nContext';
import { AdminPanel } from '@/components/admin/AdminPanel';

export default function AdminPage() {
  return (
    <I18nProvider>
      <AdminPanel />
    </I18nProvider>
  );
}
