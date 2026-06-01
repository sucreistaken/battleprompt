// In-process generation queue — Story 2.5 / D-4.
//
// Phase-1 scaffold: the API surface (enqueue / retry / counters) is defined
// here so Stories 4.3 and future polish can consume a single entry point.
// Implementation today is a THIN wrapper over the sequential per-slot path
// inside lib/game/matchLifecycle.js (which has been roomId-scoped since
// Story 1.1). Full migration of the inline _generateForSlot into this
// module's worker loop is deferred to Phase 1.5 — see TODO below.
//
// What IS wired today:
//   - GenerationJob Mongo schema (models/GenerationJob.js) — fire-and-forget
//     persistence so admin observability (Story 4.3) has data.
//   - Idempotency key shape: (roomId, matchId, roundId, slot).
//
// What is NOT YET wired (TODO(Phase 1.5)):
//   - Concurrent worker loop honoring GENERATION_MAX_CONCURRENT.
//   - Provider fallback chain (CF → Pollinations → Gemini) — lib/image.js is
//     still single-provider switched at boot. The chain requires a small
//     refactor of lib/image.js to expose try-next-provider semantics.
//   - Exponential-backoff retry policy (1s, 3s) — current matchLifecycle has
//     2 retries baked into AI scoring, but generation today has 0 retries.
//
// Migration sequence when polishing:
//   1. Move _generateForSlot from matchLifecycle into _processJob() here.
//   2. Add the worker loop + concurrency cap reading
//      readPhase1Limits().generationMaxConcurrent.
//   3. matchLifecycle.beginGenerating(roomId) calls enqueue() for A and B,
//      awaits both via Promise.all + epoch guard.

const { recordJob, updateJob } = require('../../models/GenerationJob.js');

const _inflight = new Map(); // key → Promise

function _key({ roomId, matchId, roundId, slot }) {
  return `${roomId}::${matchId}::${roundId || '_'}::${slot}`;
}

// Phase-1 thin API: matchLifecycle calls trackJobStart/trackJobComplete around
// its existing inline generation. This persists the Mongo doc + enforces the
// idempotency check at the queue boundary.
async function trackJobStart({ roomId, matchId, roundId, slot, prompt, provider }) {
  const k = _key({ roomId, matchId, roundId, slot });
  if (_inflight.has(k)) return _inflight.get(k);
  const job = await recordJob({
    roomId,
    matchId,
    roundId: roundId || null,
    slot,
    prompt,
    provider: provider || process.env.IMAGE_PROVIDER || 'pollinations',
    state: 'STARTED',
    attempts: 1,
    startedAt: new Date()
  });
  _inflight.set(k, job);
  return job;
}

async function trackJobComplete({ roomId, matchId, roundId, slot, resultImageUrl }) {
  const k = _key({ roomId, matchId, roundId, slot });
  _inflight.delete(k);
  await updateJob(
    { roomId, matchId, roundId: roundId || null, slot },
    { state: 'COMPLETED', completedAt: new Date(), resultImageUrl }
  );
}

async function trackJobFailed({ roomId, matchId, roundId, slot, errorReason }) {
  const k = _key({ roomId, matchId, roundId, slot });
  _inflight.delete(k);
  await updateJob(
    { roomId, matchId, roundId: roundId || null, slot },
    { state: 'FAILED', failedAt: new Date(), errorReason }
  );
}

function counters() {
  // Phase-1 stub — real per-state counters come from GenerationJob aggregation
  // (Story 4.3). For now just inflight.
  return { inflight: _inflight.size };
}

module.exports = { trackJobStart, trackJobComplete, trackJobFailed, counters };
