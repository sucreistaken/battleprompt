// GET /api/admin/generations — Story 4.3. Counters + failed-job list.

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/adminAuth.js';
import { GenerationJob } from '@/models/GenerationJob.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const c = cookies().get(COOKIE_NAME);
  if (!verifyToken(c?.value)) {
    return NextResponse.json({ ok: false, code: 'unauthorized_admin' }, { status: 401 });
  }
  try {
    const grouped = await GenerationJob.aggregate([
      { $group: { _id: '$state', count: { $sum: 1 } } }
    ]);
    const counters: Record<string, number> = {
      queued: 0,
      started: 0,
      completed: 0,
      failed: 0,
      retrying: 0
    };
    for (const g of grouped) {
      const key = String(g._id || '').toLowerCase();
      if (Object.prototype.hasOwnProperty.call(counters, key)) {
        counters[key] = g.count;
      }
    }
    const failedJobs = await GenerationJob.find({ state: 'FAILED' })
      .sort({ failedAt: -1 })
      .limit(50)
      .lean();
    return NextResponse.json({ ok: true, data: { counters, failedJobs } });
  } catch (err: any) {
    return NextResponse.json({
      ok: true,
      data: {
        counters: { queued: 0, started: 0, completed: 0, failed: 0, retrying: 0 },
        failedJobs: [],
        degraded: true,
        reason: err?.message
      }
    });
  }
}
