import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/adminAuth.js';
import { connectMongo } from '@/lib/db.js';
import { loadSettings, saveSettings } from '@/models/Settings.js';
import lifecycle from '@/lib/game/matchLifecycle.js';
import { CATEGORIES, DIFFICULTIES } from '@/lib/game/targetPrompt.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isAdmin() {
  const c = cookies().get(COOKIE_NAME);
  return !!verifyToken(c?.value);
}

function clampInt(value: unknown, min: number, max: number) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.max(min, Math.min(max, Math.round(n)));
}

function cleanPatch(body: any) {
  const patch: Record<string, unknown> = {};

  const durations = [
    ['promptDurationSec', 10, 180],
    ['votingDurationSec', 5, 120],
    ['tiebreakDurationSec', 5, 60],
    ['resultDurationSec', 5, 120],
    ['vsIntroDurationSec', 1, 30]
  ] as const;

  for (const [key, min, max] of durations) {
    if (body?.[key] !== undefined) {
      const v = clampInt(body[key], min, max);
      if (v === null) throw new Error(`${key} must be a number`);
      patch[key] = v;
    }
  }

  if (body?.lockedCategory !== undefined) {
    const v = String(body.lockedCategory || '').trim();
    if (v && !CATEGORIES.some((c: { code: string }) => c.code === v)) {
      throw new Error('lockedCategory is invalid');
    }
    patch.lockedCategory = v;
  }

  if (body?.lockedDifficulty !== undefined) {
    const v = String(body.lockedDifficulty || '').trim();
    if (v && !DIFFICULTIES.some((d: { code: string }) => d.code === v)) {
      throw new Error('lockedDifficulty is invalid');
    }
    patch.lockedDifficulty = v;
  }

  if (body?.winnerMode !== undefined) {
    if (!['AI_SCORE', 'AUDIENCE_VOTE'].includes(body.winnerMode)) {
      throw new Error('winnerMode is invalid');
    }
    patch.winnerMode = body.winnerMode;
  }

  if (body?.showLivePrompts !== undefined) {
    patch.showLivePrompts = !!body.showLivePrompts;
  }

  if (body?.stageLanguage !== undefined) {
    if (!['tr', 'en'].includes(body.stageLanguage)) throw new Error('stageLanguage is invalid');
    patch.stageLanguage = body.stageLanguage;
  }

  if (body?.stageTheme !== undefined) {
    if (!['dark', 'light'].includes(body.stageTheme)) throw new Error('stageTheme is invalid');
    patch.stageTheme = body.stageTheme;
  }

  return patch;
}

export async function GET() {
  if (!isAdmin()) return NextResponse.json({ ok: false }, { status: 401 });
  await connectMongo();
  const settings = await loadSettings();
  const categories = CATEGORIES.map((c: { code: string; labelTr: string }) => ({
    code: c.code,
    label: c.labelTr
  }));
  const difficulties = DIFFICULTIES.map((d: { code: string; labelTr: string }) => ({
    code: d.code,
    label: d.labelTr
  }));
  return NextResponse.json({ ok: true, settings, categories, difficulties });
}

export async function PUT(req: Request) {
  if (!isAdmin()) return NextResponse.json({ ok: false }, { status: 401 });

  let body: any = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: 'invalid_json' }, { status: 400 });
  }

  let patch;
  try {
    patch = cleanPatch(body);
  } catch (err: any) {
    return NextResponse.json({ ok: false, reason: err.message }, { status: 400 });
  }

  await connectMongo();
  const settings = await saveSettings(patch);
  lifecycle.adminUpdateSettings(settings);
  return NextResponse.json({ ok: true, settings });
}
