import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/adminAuth.js';
import lifecycle from '@/lib/game/matchLifecycle.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  const c = cookies().get(COOKIE_NAME);
  if (!verifyToken(c?.value)) return NextResponse.json({ ok: false }, { status: 401 });
  // TODO(Story 4.x): accept a roomId in the request body; default to 'default' for now.
  lifecycle.adminForceEnd('default');
  return NextResponse.json({ ok: true });
}
