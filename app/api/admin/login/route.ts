import { NextResponse } from 'next/server';
import { attemptLogin, COOKIE_NAME } from '@/lib/adminAuth.js';

export const runtime = 'nodejs';

function getClientIp(req: Request): string {
  const xf = req.headers.get('x-forwarded-for');
  if (xf) return xf.split(',')[0].trim();
  return 'unknown';
}

export async function POST(req: Request) {
  let body: any = null;
  try {
    body = await req.json();
  } catch {}
  const password = String(body?.password || '');
  const ip = getClientIp(req);

  const result = attemptLogin(ip, password);

  if (!result.ok) {
    const status = result.reason === 'locked' ? 429 : 401;
    return NextResponse.json({ ok: false, reason: result.reason, retryInMs: result.retryInMs }, { status });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, result.token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: result.maxAge
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(COOKIE_NAME);
  return res;
}
