// Phase timer manager — sadece tek aktif timer.
// setPhaseTimer her çağrıldığında öncekini iptal eder.

let _timer = null;
let _disconnectTimers = new Map(); // slot -> timeout

function setPhaseTimer(durationMs, cb) {
  if (_timer) clearTimeout(_timer);
  _timer = setTimeout(() => {
    _timer = null;
    try {
      cb();
    } catch (err) {
      console.error('[timer] callback error:', err);
    }
  }, durationMs);
}

function clearPhaseTimer() {
  if (_timer) {
    clearTimeout(_timer);
    _timer = null;
  }
}

function setDisconnectTimer(slot, durationMs, cb) {
  clearDisconnectTimer(slot);
  const t = setTimeout(() => {
    _disconnectTimers.delete(slot);
    try {
      cb();
    } catch (err) {
      console.error('[disconnect-timer] callback error:', err);
    }
  }, durationMs);
  _disconnectTimers.set(slot, t);
}

function clearDisconnectTimer(slot) {
  const t = _disconnectTimers.get(slot);
  if (t) {
    clearTimeout(t);
    _disconnectTimers.delete(slot);
  }
}

function clearAllDisconnectTimers() {
  for (const t of _disconnectTimers.values()) clearTimeout(t);
  _disconnectTimers.clear();
}

module.exports = {
  setPhaseTimer,
  clearPhaseTimer,
  setDisconnectTimer,
  clearDisconnectTimer,
  clearAllDisconnectTimers
};
