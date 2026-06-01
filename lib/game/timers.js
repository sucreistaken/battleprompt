// Per-room timer registry.
// Story 1.1: was a single global phase timer + a Map of disconnect timers;
// now keyed by roomId so closing/expiring one room cannot leak timers into
// another room (G-6). roomRegistry.closeRoom + expireRoom call clearForRoom.

const _rooms = new Map(); // roomId -> { phaseTimer, disconnectTimers: Map<slot, timeout> }

function _ensure(roomId) {
  let entry = _rooms.get(roomId);
  if (!entry) {
    entry = { phaseTimer: null, disconnectTimers: new Map() };
    _rooms.set(roomId, entry);
  }
  return entry;
}

function setPhaseTimer(roomId, durationMs, cb) {
  const entry = _ensure(roomId);
  if (entry.phaseTimer) clearTimeout(entry.phaseTimer);
  entry.phaseTimer = setTimeout(() => {
    entry.phaseTimer = null;
    try {
      cb();
    } catch (err) {
      console.error('[timer] callback error:', err);
    }
  }, durationMs);
}

function clearPhaseTimer(roomId) {
  const entry = _rooms.get(roomId);
  if (!entry) return;
  if (entry.phaseTimer) {
    clearTimeout(entry.phaseTimer);
    entry.phaseTimer = null;
  }
}

function setDisconnectTimer(roomId, slot, durationMs, cb) {
  const entry = _ensure(roomId);
  clearDisconnectTimer(roomId, slot);
  const t = setTimeout(() => {
    entry.disconnectTimers.delete(slot);
    try {
      cb();
    } catch (err) {
      console.error('[disconnect-timer] callback error:', err);
    }
  }, durationMs);
  entry.disconnectTimers.set(slot, t);
}

function clearDisconnectTimer(roomId, slot) {
  const entry = _rooms.get(roomId);
  if (!entry) return;
  const t = entry.disconnectTimers.get(slot);
  if (t) {
    clearTimeout(t);
    entry.disconnectTimers.delete(slot);
  }
}

function clearAllDisconnectTimers(roomId) {
  const entry = _rooms.get(roomId);
  if (!entry) return;
  for (const t of entry.disconnectTimers.values()) clearTimeout(t);
  entry.disconnectTimers.clear();
}

// G-6 cleanup hook: called by roomRegistry.closeRoom / expireRoom so per-room
// timers cannot leak after a room ends.
function clearForRoom(roomId) {
  clearPhaseTimer(roomId);
  clearAllDisconnectTimers(roomId);
  _rooms.delete(roomId);
}

module.exports = {
  setPhaseTimer,
  clearPhaseTimer,
  setDisconnectTimer,
  clearDisconnectTimer,
  clearAllDisconnectTimers,
  clearForRoom
};
