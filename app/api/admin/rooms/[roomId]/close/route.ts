// POST /api/admin/rooms/[roomId]/close — Story 4.1. Admin-side variant of
// FR-15.13 Close Room (independent of the host cookie).

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/adminAuth.js';
import { closeRoom, getRoom } from '@/lib/game/roomRegistry.js';
import { updateRoomState } from '@/models/Room.js';
import * as auditLog from '@/lib/auditLog.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(_req: Request, { params }: { params: { roomId: string } }) {
  const c = cookies().get(COOKIE_NAME);
  if (!verifyToken(c?.value)) {
    return NextResponse.json({ ok: false, code: 'unauthorized_admin' }, { status: 401 });
  }
  const room = getRoom(params.roomId);
  if (!room) {
    return NextResponse.json({ ok: false, code: 'room_not_found' }, { status: 404 });
  }
  room.state = 'ROOM_COMPLETED';
  closeRoom(params.roomId);
  updateRoomState(params.roomId, {
    state: 'ROOM_COMPLETED',
    closedAt: new Date()
  }).catch(() => {});
  auditLog.info({
    roomId: params.roomId,
    actor: 'admin',
    action: 'admin_room_closed'
  });
  return NextResponse.json({ ok: true, data: { roomId: params.roomId } });
}
