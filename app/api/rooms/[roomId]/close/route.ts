// POST /api/rooms/[roomId]/close — Story 1.9.
// Host-only Close Room. Verifies the pc_host_session cookie matches the
// room's hostId, transitions the room to ROOM_COMPLETED, writes the audit
// log, returns { ok: true }.

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { apiError, ERROR_CODES } from '@/lib/apiResponse.js';
import { getRoom } from '@/lib/game/state.js';
import { closeRoom } from '@/lib/game/roomRegistry.js';
import { updateRoomState } from '@/models/Room.js';
import * as auditLog from '@/lib/auditLog.js';
import { HOST_COOKIE_NAME, verify as verifyHostToken } from '@/lib/auth/cookieAuth.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(_req: Request, { params }: { params: { roomId: string } }) {
  const { roomId } = params;
  const room = getRoom(roomId);
  if (!room) {
    const r = apiError({ code: ERROR_CODES.ROOM_NOT_FOUND });
    return NextResponse.json(r.body, { status: r.status });
  }

  const hostToken = cookies().get(HOST_COOKIE_NAME)?.value;
  const payload = hostToken ? verifyHostToken(hostToken) : null;
  if (!payload || payload.hostId !== room.hostId) {
    const r = apiError({ code: ERROR_CODES.UNAUTHORIZED_HOST });
    return NextResponse.json(r.body, { status: r.status });
  }

  // Mark RAM state as completed first so any in-flight broadcasts see the
  // final state, then drop the room from the registry (timers cleared via G-6).
  room.state = 'ROOM_COMPLETED';
  closeRoom(roomId);

  // Fire-and-forget Mongo update + audit log.
  updateRoomState(roomId, { state: 'ROOM_COMPLETED', closedAt: new Date() }).catch(() => {});
  auditLog.info({
    roomId,
    actor: 'host',
    actorId: payload.hostId,
    action: 'host_room_closed'
  });

  return NextResponse.json({ ok: true, data: { roomId, state: 'ROOM_COMPLETED' } });
}
