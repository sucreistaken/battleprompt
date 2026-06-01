import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/adminAuth.js';
import { publicConfig, validateEnv } from '@/lib/env.js';
import { getRoom } from '@/lib/game/state.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// TODO(Story 4.x): list every room via roomRegistry.listRooms() instead of
// hard-coding the default-room readout.
export async function GET() {
  const c = cookies().get(COOKIE_NAME);
  if (!verifyToken(c?.value)) return NextResponse.json({ ok: false }, { status: 401 });
  const env = validateEnv({ strict: false });
  const state = getRoom('default');
  return NextResponse.json({
    ok: true,
    env,
    config: publicConfig(),
    game: state
      ? {
          phase: state.phase,
          matchId: state.matchId,
          operationEpoch: state.operationEpoch,
          referencePending: state.referencePending
        }
      : null
  });
}
