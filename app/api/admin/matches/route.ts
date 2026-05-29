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
    const rows = await recentMatches(20);
    const matches = rows.map((m: any) => ({
      _id: String(m._id),
      matchId: String(m._id).slice(-8),
      targetPrompt: m.targetPrompt,
      category: m.category,
      difficulty: m.difficulty,
      winner: m.winner,
      winnerMode: m.winnerMode,
      players: {
        A: m.playerA ? { nickname: m.playerA.nickname, aiScore: m.playerA.aiScore ?? null } : null,
        B: m.playerB ? { nickname: m.playerB.nickname, aiScore: m.playerB.aiScore ?? null } : null
      },
      votes: {
        A: m.playerA?.voteCount ?? 0,
        B: m.playerB?.voteCount ?? 0
      },
      finishedAt: m.endedAt || m.startedAt
    }));
    return NextResponse.json({ ok: true, matches });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
