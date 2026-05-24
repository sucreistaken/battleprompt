import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/adminAuth.js';

export const runtime = 'nodejs';

export async function GET() {
  const c = cookies().get(COOKIE_NAME);
  const ok = !!verifyToken(c?.value);
  return NextResponse.json({ ok });
}
