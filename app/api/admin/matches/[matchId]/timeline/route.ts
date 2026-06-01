// GET /api/admin/matches/[matchId]/timeline — Story 4.2. Audit log replay
// for a single match. Reads from models/AuditLog.

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/adminAuth.js';
import { AuditLog } from '@/models/AuditLog.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { matchId: string } }) {
  const c = cookies().get(COOKIE_NAME);
  if (!verifyToken(c?.value)) {
    return NextResponse.json({ ok: false, code: 'unauthorized_admin' }, { status: 401 });
  }
  try {
    const entries = await AuditLog.find({ matchId: params.matchId })
      .sort({ at: -1 })
      .limit(500)
      .lean();
    return NextResponse.json({ ok: true, data: { matchId: params.matchId, entries } });
  } catch (err: any) {
    return NextResponse.json({
      ok: true,
      data: { matchId: params.matchId, entries: [], degraded: true, reason: err?.message }
    });
  }
}
