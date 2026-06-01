// GET /api/admin/active-rooms-warning — Story 4.4 / G-3.
// Returns the operator's deploy-readiness signal: if there are active rooms,
// a mid-deploy will drop them (Phase-1 RAM-only state).

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/adminAuth.js';
import { listRooms, DEFAULT_ROOM_ID } from '@/lib/game/roomRegistry.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TERMINAL = new Set(['ROOM_COMPLETED', 'ROOM_CANCELLED', 'ROOM_EXPIRED']);

export async function GET() {
  const c = cookies().get(COOKIE_NAME);
  if (!verifyToken(c?.value)) {
    return NextResponse.json({ ok: false, code: 'unauthorized_admin' }, { status: 401 });
  }
  // Count rooms that aren't the synthetic default and aren't terminal.
  const active = listRooms().filter(
    (r: any) => r.roomId !== DEFAULT_ROOM_ID && !TERMINAL.has(r.state)
  );
  let warningLevel: 'none' | 'warning' | 'critical' = 'none';
  if (active.length > 0) warningLevel = 'warning';
  if (active.length > 3) warningLevel = 'critical';
  return NextResponse.json({
    ok: true,
    data: { activeRoomCount: active.length, warningLevel }
  });
}
