import { NextResponse } from 'next/server';
import { connectMongo } from '@/lib/db.js';
import { getBucket } from '@/lib/gcs.js';
import { publicConfig, validateEnv } from '@/lib/env.js';
import { withTimeout } from '@/lib/async.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const env = validateEnv({ strict: false });
  const checks: Record<string, unknown> = { env: env.ok };

  try {
    await withTimeout(connectMongo(), 5000, 'Mongo readiness');
    checks.mongo = true;
  } catch (err: any) {
    checks.mongo = false;
    checks.mongoError = err.message;
  }

  const cfg = publicConfig();
  if (!cfg.demoMode && cfg.hasGcs) {
    try {
      const [exists] = await withTimeout(getBucket().exists(), 5000, 'GCS readiness');
      checks.gcs = !!exists;
    } catch (err: any) {
      checks.gcs = false;
      checks.gcsError = err.message;
    }
  } else {
    checks.gcs = cfg.demoMode ? 'skipped_demo' : false;
  }

  const ok = env.ok && checks.mongo === true && (checks.gcs === true || checks.gcs === 'skipped_demo');
  return NextResponse.json({ ok, checks, config: cfg }, { status: ok ? 200 : 503 });
}
