// GenerationJob — Story 2.5. Persisted state machine for image-gen jobs.
// State transitions: QUEUED → STARTED → COMPLETED | FAILED → RETRYING.
// Idempotency key: (roomId, matchId, roundId, slot).

const { mongoose } = require('../lib/db.js');

const JOB_STATES = ['QUEUED', 'STARTED', 'COMPLETED', 'FAILED', 'RETRYING'];

const GenerationJobSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true, index: true },
    matchId: { type: String, required: true, index: true },
    roundId: { type: String },
    slot: { type: String, enum: ['A', 'B'], required: true },
    prompt: { type: String, required: true },
    provider: { type: String },
    state: { type: String, enum: JOB_STATES, default: 'QUEUED', index: true },
    attempts: { type: Number, default: 0 },
    startedAt: { type: Date },
    completedAt: { type: Date },
    failedAt: { type: Date },
    errorReason: { type: String },
    responseLog: { type: mongoose.Schema.Types.Mixed },
    estimatedCostUsd: { type: Number },
    resultImageId: { type: String },
    resultImageUrl: { type: String },
    createdAt: { type: Date, default: Date.now }
  },
  { versionKey: false }
);

// Uniqueness for idempotency: (roomId, matchId, roundId, slot).
GenerationJobSchema.index(
  { roomId: 1, matchId: 1, roundId: 1, slot: 1 },
  { unique: true, partialFilterExpression: { roundId: { $type: 'string' } } }
);

// Convenience query path for the admin generations panel (Story 4.3).
GenerationJobSchema.index({ state: 1, createdAt: -1 });

const GenerationJob =
  mongoose.models.GenerationJob || mongoose.model('GenerationJob', GenerationJobSchema);

async function recordJob(doc) {
  try {
    return await GenerationJob.create(doc);
  } catch (err) {
    console.warn('[gen-job] mongo save failed:', err.message);
    return null;
  }
}

async function updateJob(filter, patch) {
  try {
    return await GenerationJob.findOneAndUpdate(filter, patch, { new: true }).lean();
  } catch (err) {
    console.warn('[gen-job] mongo update failed:', err.message);
    return null;
  }
}

module.exports = { GenerationJob, JOB_STATES, recordJob, updateJob };
