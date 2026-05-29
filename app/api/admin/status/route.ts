import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/adminAuth.js';
import { publicConfig, validateEnv } from '@/lib/env.js';
import { state } from '@/lib/game/state.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const c = cookies().get(COOKIE_NAME);
  if (!verifyToken(c?.value)) return NextResponse.json({ ok: false }, { status: 401 });
  const env = validateEnv({ strict: false });
  return NextResponse.json({
    ok: true,
    env,
    config: publicConfig(),
    game: {
      phase: state.phase,
      matchId: state.matchId,
      operationEpoch: state.operationEpoch,
      referencePending: state.referencePending
    }
  });
}
