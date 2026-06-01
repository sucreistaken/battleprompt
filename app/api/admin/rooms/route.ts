// GET /api/admin/rooms — Story 4.1. Lists active rooms from the RAM registry.
// Admin auth via existing pc_admin signed cookie (lib/adminAuth.js).

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/adminAuth.js';
import { listRooms } from '@/lib/game/roomRegistry.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function _isAdmin(): boolean {
  const c = cookies().get(COOKIE_NAME);
  return !!verifyToken(c?.value);
}

export async function GET() {
  if (!_isAdmin()) {
    return NextResponse.json({ ok: false, code: 'unauthorized_admin' }, { status: 401 });
  }
  const rows = listRooms().map((r: any) => ({
    roomId: r.roomId,
    roomCode: r.roomCode,
    roomName: r.roomName || '',
    hostId: r.hostId,
    state: r.state || null,
    phase: r.phase,
    playerCount: (r.players?.A ? 1 : 0) + (r.players?.B ? 1 : 0),
    audienceVotingEnabled: !!r.audienceVotingEnabled,
    audienceEnabled: r.audienceEnabled !== false,
    createdAt: r.createdAt,
    lastActivityAt: r.lastActivityAt
  }));
  rows.sort((a: any, b: any) => (b.lastActivityAt || 0) - (a.lastActivityAt || 0));
  return NextResponse.json({ ok: true, data: { rooms: rows } });
}
