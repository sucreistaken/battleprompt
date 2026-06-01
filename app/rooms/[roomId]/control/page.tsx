// /rooms/[roomId]/control — Story 1.9. Server component verifies the host
// session cookie before rendering. Missing/invalid → 401 redirect to
// /create-room (R-3: no silent host elevation).

import { redirect } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import { getRoom } from '@/lib/game/state.js';
import { HOST_COOKIE_NAME, verify as verifyHostToken } from '@/lib/auth/cookieAuth.js';
import { ControlPanelClient } from './ControlPanelClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Oda Paneli · Prompt Clash',
  robots: { index: false }
};

export default function ControlPage({ params }: { params: { roomId: string } }) {
  const { roomId } = params;
  const room = getRoom(roomId);
  if (!room) {
    redirect('/create-room');
  }
  const hostToken = cookies().get(HOST_COOKIE_NAME)?.value;
  const payload = hostToken ? verifyHostToken(hostToken) : null;
  if (!payload || payload.hostId !== room.hostId) {
    redirect('/create-room');
  }

  // Build the origin server-side so the InviteLinksCard can compose absolute
  // URLs without depending on window.location at first paint.
  const h = headers();
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000';
  const proto = h.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https');
  const origin = `${proto}://${host}`;

  return (
    <ControlPanelClient
      roomId={room.roomId}
      roomCode={room.roomCode}
      roomName={room.roomName}
      audienceEnabled={room?.audienceEnabled !== false}
      origin={origin}
    />
  );
}
