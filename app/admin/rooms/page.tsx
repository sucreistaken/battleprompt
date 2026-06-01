// /admin/rooms — Story 4.1. Server component sets metadata + delegates to
// AdminRoomsClient (which fetches /api/admin/rooms and renders the table).

import type { Metadata } from 'next';
import { AdminRoomsClient } from './AdminRoomsClient';

export const metadata: Metadata = {
  title: 'Aktif Odalar · Operatör',
  robots: { index: false }
};

export default function AdminRoomsPage() {
  return <AdminRoomsClient />;
}
