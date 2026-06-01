// Fire-and-forget audit log writer.
// Story 1.4 / D-12 / MUST rule #7. Every state transition + admin/host action
// is logged. Mongo errors are swallowed silently — audit must never block the
// hot path (MUST rule #10).

const { AuditLog } = require('../models/AuditLog.js');

function _short(roomId) {
  if (!roomId) return '------';
  if (roomId === 'default') return 'default';
  return String(roomId).slice(0, 6);
}

// Internal write — never throws.
function _write(entry) {
  try {
    AuditLog.create(entry).catch((err) => {
      // Mongo down or schema mismatch. Swallow per MUST #10. Surface once at
      // warn level so operators see it in logs.
      console.warn(`[audit:${_short(entry.roomId)}] write failed:`, err.message);
    });
  } catch (err) {
    // Model not loaded / connection failure during sync path. Don't crash.
    console.warn(`[audit:${_short(entry && entry.roomId)}] write failed sync:`, err.message);
  }
}

/**
 * @param {{ roomId: string, matchId?: string, actor: 'system'|'host'|'admin'|'player'|'audience', actorId?: string, action: string, payload?: any }} entry
 */
function info({ roomId, matchId, actor, actorId, action, payload }) {
  if (!roomId || !actor || !action) return;
  _write({ roomId, matchId, actor, actorId, action, payload, at: new Date() });
  console.log(`[audit:${_short(roomId)}] ${action}`);
}

/**
 * @param {{ roomId: string, matchId?: string, actor: 'system'|'host'|'admin'|'player'|'audience', actorId?: string, action: string, payload?: any }} entry
 */
function warn({ roomId, matchId, actor, actorId, action, payload }) {
  if (!roomId || !actor || !action) return;
  _write({ roomId, matchId, actor, actorId, action, payload, at: new Date() });
  console.warn(`[audit:${_short(roomId)}] WARN ${action}`);
}

module.exports = { info, warn };
