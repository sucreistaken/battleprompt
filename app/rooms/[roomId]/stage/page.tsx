// /rooms/[roomId]/stage — Story 1.10. Server resolves room and hands roomCode
// to StageClient. Link-bearer access (no auth required per addendum §2.2).

import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { getRoom } from '@/lib/game/state.js';
import { StageClient } from './StageClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Sahne · Prompt Clash',
  robots: { index: false }
};

export default function RoomStagePage({ params }: { params: { roomId: string } }) {
  const { roomId } = params;
  const room = getRoom(roomId);
  if (!room) notFound();

  const h = headers();
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000';
  const proto = h.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https');
  const origin = `${proto}://${host}`;

  return (
    <StageClient
      roomId={room.roomId}
      roomCode={room.roomCode}
      stageTheme={room.stageTheme || 'dark'}
      stageLanguage={room.stageLanguage || 'tr'}
      origin={origin}
    />
  );
}
