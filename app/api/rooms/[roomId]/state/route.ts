// GET /api/rooms/[roomId]/state — Story 1.7. Role-filtered cold-load.
//
// Responses:
//   200 { ok: true, data: <snapshot> }
//   401 { ok: false, code: 'unauthorized_host' }   (claiming host without valid cookie)
//   404 { ok: false, code: 'room_not_found' }
//   410 { ok: false, code: 'room_expired' }

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { apiOk, apiError, ERROR_CODES } from '@/lib/apiResponse.js';
import { getRoom } from '@/lib/game/state.js';
import { buildSnapshot } from '@/lib/socket/broadcasts.js';
import {
  HOST_COOKIE_NAME,
  DEVICE_COOKIE_NAME,
  AUDIENCE_COOKIE_NAME,
  verify as verifyHostToken
} from '@/lib/auth/cookieAuth.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Role = 'host' | 'player' | 'audience' | 'stage';

function _resolveRole(
  request: Request,
  room: any
): { role: Role; hostId: string | null; authError: 'unauthorized_host' | null } {
  // Explicit ?role=stage from the projector page (link-bearer, no auth).
  const url = new URL(request.url);
  const explicit = url.searchParams.get('role');
  const jar = cookies();
  const hostToken = jar.get(HOST_COOKIE_NAME)?.value || null;
  const deviceId = jar.get(DEVICE_COOKIE_NAME)?.value || null;

  if (explicit === 'stage') {
    return { role: 'stage', hostId: null, authError: null };
  }
  if (explicit === 'host' || hostToken) {
    const payload = hostToken ? verifyHostToken(hostToken) : null;
    if (!payload || typeof payload.hostId !== 'string') {
      // Explicit host claim or a present-but-invalid token → reject.
      if (explicit === 'host') {
        return { role: 'host', hostId: null, authError: 'unauthorized_host' };
      }
      // Token present but invalid AND no explicit claim — fall through to audience.
    } else {
      if (room.hostId === payload.hostId) {
        return { role: 'host', hostId: payload.hostId, authError: null };
      }
      // Valid host cookie but for a different room → treat as audience.
    }
  }
  // Try player attachment via deviceId + room.players slots.
  if (deviceId) {
    const a = room.players?.A?.deviceId;
    const b = room.players?.B?.deviceId;
    if (a === deviceId || b === deviceId) {
      return { role: 'player', hostId: null, authError: null };
    }
  }
  return { role: 'audience', hostId: null, authError: null };
}

export async function GET(request: Request, { params }: { params: { roomId: string } }) {
  const { roomId } = params;
  const room = getRoom(roomId);
  if (!room) {
    const r = apiError({ code: ERROR_CODES.ROOM_NOT_FOUND });
    return NextResponse.json(r.body, { status: r.status });
  }
  if (room.state === 'ROOM_EXPIRED') {
    const r = apiError({ code: ERROR_CODES.ROOM_EXPIRED });
    return NextResponse.json(r.body, { status: r.status });
  }

  const { role, hostId, authError } = _resolveRole(request, room);
  if (authError) {
    const r = apiError({ code: ERROR_CODES.UNAUTHORIZED_HOST });
    return NextResponse.json(r.body, { status: r.status });
  }

  // Optional: ensure pc_audience_id exists for audience visitors so Story 3.x
  // vote dedup is wired before the audience reaches the voting screen.
  const jar = cookies();
  if (role === 'audience' && !jar.get(AUDIENCE_COOKIE_NAME)?.value) {
    // Lazy import to avoid eager evaluation cost on host/player paths.
    const { newAudienceId, audienceCookieAttrs } = await import('@/lib/auth/cookieAuth.js');
    jar.set({ name: AUDIENCE_COOKIE_NAME, value: newAudienceId(), ...audienceCookieAttrs() });
  }

  const snapshot = buildSnapshot(roomId, role);
  // Stories 2.4 / 3.3 will fold per-role fields (own draft, hasVoted) into
  // the snapshot. Story 1.7 just adds a host-only metadata pocket.
  if (role === 'host' && hostId) {
    (snapshot as any).hostMeta = { hostId, isHost: true };
  }
  const ok = apiOk(snapshot);
  return NextResponse.json(ok.body, { status: ok.status });
}
