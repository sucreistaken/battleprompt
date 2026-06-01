// /join/[roomCode] — Story 2.1. Server resolves roomCode → roomId, then
// renders the mobile-first nickname + slot claim screen.

import { notFound } from 'next/navigation';
import { listRooms } from '@/lib/game/roomRegistry.js';
import { JoinClient } from './JoinClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Maça Katıl · Prompt Clash',
  robots: { index: false }
};

export default function JoinPage({ params }: { params: { roomCode: string } }) {
  const code = String(params.roomCode || '').toUpperCase();
  const rooms = listRooms();
  const room = rooms.find((r: any) => r.roomCode === code);
  if (!room) notFound();
  if (room.state && ['ROOM_COMPLETED', 'ROOM_CANCELLED', 'ROOM_EXPIRED'].includes(room.state)) {
    notFound();
  }
  // Sally Sprint v3: if both player slots are already claimed, render the
  // join-full dead-end immediately instead of letting the nickname form fail
  // racily once a socket actually connects.
  const roomFull = !!(room.players?.A && room.players?.B);

  return (
    <JoinClient
      roomId={room.roomId}
      roomCode={code}
      roomName={room.roomName || ''}
      initialFull={roomFull}
    />
  );
}
