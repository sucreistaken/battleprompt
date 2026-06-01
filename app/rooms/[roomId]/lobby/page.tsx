// /rooms/[roomId]/lobby — Story 2.2 (audience surface). Same wrap as the
// game page but role='audience' and no auto-join.

import { notFound } from 'next/navigation';
import { getRoom } from '@/lib/game/state.js';
import { LobbyClient } from './LobbyClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'İzle · Prompt Clash',
  robots: { index: false }
};

export default function RoomLobbyPage({ params }: { params: { roomId: string } }) {
  const room = getRoom(params.roomId);
  if (!room) notFound();
  return <LobbyClient roomId={room.roomId} />;
}
