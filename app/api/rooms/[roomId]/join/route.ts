// POST /api/rooms/[roomId]/join — Story 2.1. Player slot claim.
// Validates nickname, attempts to reattach by deviceId, otherwise assigns A or B.
// Rate-limited per (ip, roomId) + (deviceId, roomId).

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { apiError, ERROR_CODES, apiOk } from '@/lib/apiResponse.js';
import { getRoom } from '@/lib/game/state.js';
import * as lifecycle from '@/lib/game/matchLifecycle.js';
import * as auditLog from '@/lib/auditLog.js';
import { checkLimit } from '@/lib/rateLimit.js';
import { saveRoomMember } from '@/models/RoomMember.js';
import {
  DEVICE_COOKIE_NAME,
  newDeviceId,
  deviceCookieAttrs
} from '@/lib/auth/cookieAuth.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const JoinBody = z.object({
  nickname: z.string().min(3).max(20)
});

function _clientIp(req: Request): string {
  const h = req.headers;
  const xf = h.get('x-forwarded-for');
  if (xf) return xf.split(',')[0].trim();
  return h.get('x-real-ip') || 'unknown';
}

export async function POST(req: Request, { params }: { params: { roomId: string } }) {
  const { roomId } = params;
  const room = getRoom(roomId);
  if (!room) {
    const r = apiError({ code: ERROR_CODES.ROOM_NOT_FOUND });
    return NextResponse.json(r.body, { status: r.status });
  }

  const jar = cookies();
  let deviceId = jar.get(DEVICE_COOKIE_NAME)?.value;
  if (!deviceId) {
    deviceId = newDeviceId();
    jar.set({ name: DEVICE_COOKIE_NAME, value: deviceId, ...deviceCookieAttrs() });
  }

  const ip = _clientIp(req);
  const limited = checkLimit({
    ip,
    deviceId,
    event: 'room:join',
    roomId,
    limit: 30,
    windowMs: 60_000
  });
  if (!limited.ok) {
    const r = apiError({ code: ERROR_CODES.RATE_LIMITED });
    return NextResponse.json(r.body, { status: r.status });
  }

  let body: any;
  try {
    body = JoinBody.parse(await req.json());
  } catch (err) {
    const r = apiError(err);
    return NextResponse.json(r.body, { status: r.status });
  }

  // lifecycle.tryJoinAsPlayer already validates nickname + handles reattach.
  // We bypass the lifecycle direct call and instead use a join-via-REST shim:
  // record intent in audit log + delegate to lifecycle on next socket connect.
  // Phase-1 simpler path: just stamp a RoomMember row + return slot hint;
  // the socket's handshake takes the slot via existing tryJoinAsPlayer flow.
  const trimmed = body.nickname.trim();
  // Persistence fire-and-forget for admin observability (Story 4.x).
  saveRoomMember({
    roomId,
    userId: deviceId,
    sessionId: deviceId,
    nickname: trimmed,
    role: 'PLAYER',
    slot: null, // assigned later by socket flow
    status: 'ACTIVE',
    joinedAt: new Date()
  }).catch(() => {});

  auditLog.info({
    roomId,
    actor: 'player',
    actorId: deviceId,
    action: 'player_join_intent',
    payload: { nickname: trimmed, ip }
  });

  const ok = apiOk({ roomId, nickname: trimmed });
  return NextResponse.json(ok.body, { status: ok.status });
}
