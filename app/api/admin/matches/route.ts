import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/adminAuth.js';
import { connectMongo } from '@/lib/db.js';
import { recentMatches } from '@/models/Match.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const c = cookies().get(COOKIE_NAME);
  if (!verifyToken(c?.value)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  try {
    await connectMongo();
    const matches = await recentMatches(20);
    return NextResponse.json({ ok: true, matches });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
