// /watch/[roomCode] — Story 2.2. Audience entry. Resolves roomCode → roomId,
// renders optional-nickname form, sets pc_audience_id cookie, redirects to
// /rooms/[roomId]/lobby.

import { notFound } from 'next/navigation';
import { listRooms } from '@/lib/game/roomRegistry.js';
import { WatchClient } from './WatchClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'İzle · Prompt Clash',
  robots: { index: false }
};

export default function WatchPage({ params }: { params: { roomCode: string } }) {
  const code = String(params.roomCode || '').toUpperCase();
  const rooms = listRooms();
  const room = rooms.find((r: any) => r.roomCode === code);
  if (!room) notFound();
  if (room.state && ['ROOM_COMPLETED', 'ROOM_CANCELLED', 'ROOM_EXPIRED'].includes(room.state)) {
    notFound();
  }
  return (
    <WatchClient
      roomId={room.roomId}
      roomCode={code}
      roomName={room.roomName || ''}
      audienceEnabled={room.audienceEnabled !== false}
      audienceVotingEnabled={!!room.audienceVotingEnabled}
    />
  );
}
