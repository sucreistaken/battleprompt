// Audit log model. Story 1.4 / D-12.
// Schema { roomId, matchId?, actor, actorId?, action, payload, at }.
// 30-day TTL via Mongo index on `at` (configurable via AUDIT_LOG_RETENTION_DAYS).
// All writes fire-and-forget per MUST rule #10 — Mongo errors swallowed.

const { mongoose } = require('../lib/db.js');
const { readPhase1Limits } = require('../lib/env.js');

const ACTORS = ['system', 'host', 'admin', 'player', 'audience'];

const AuditLogSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true, index: true },
    matchId: { type: String },
    actor: { type: String, enum: ACTORS, required: true },
    actorId: { type: String },
    action: { type: String, required: true },
    payload: { type: mongoose.Schema.Types.Mixed },
    at: { type: Date, default: Date.now, required: true }
  },
  { versionKey: false }
);

// 30-day TTL (or whatever AUDIT_LOG_RETENTION_DAYS resolves to at boot).
const retentionDays = readPhase1Limits().auditLogRetentionDays;
const retentionSeconds = Math.max(1, Math.floor(retentionDays * 24 * 3600));
AuditLogSchema.index({ at: 1 }, { expireAfterSeconds: retentionSeconds });

// Query convenience: (matchId, at desc) for the timeline view (Story 4.2).
AuditLogSchema.index({ matchId: 1, at: -1 });

const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);

module.exports = { AuditLog, ACTORS };
