// Multi-room registry — owns the Map<roomId, RoomState>. RAM authoritative
// per D-2 (architecture.md). Single Cloud Run instance assumption; mid-deploy
// active-room loss is accepted in Phase 1.
//
// Phase-1 transition path: a synthetic 'default' room is bootstrapped at
// module load so the existing single-room UI + matchSmoke.js keep working
// unchanged. Story 1.6 (POST /api/rooms) will retire the default room.

const { createRoomState } = require('./state.js');
const { clearForRoom } = require('./timers.js');

// Next.js dev mode bundles app/api/*/route.ts via webpack — those routes get a
// SEPARATE module instance from server.js's direct require(). Backing the Map
// on globalThis keeps state.js / roomRegistry / matchLifecycle in sync across
// both module-load paths (same pattern as lib/db.js's global.__mongoConn).
const GLOBAL_KEY = '__promptClashRoomRegistry';
const _g = /** @type {any} */ (globalThis);
if (!_g[GLOBAL_KEY]) {
  _g[GLOBAL_KEY] = { rooms: new Map(), sweeperStarted: false, defaultBootstrapped: false };
}
const _rooms = /** @type {Map<string, any>} */ (_g[GLOBAL_KEY].rooms);

const DEFAULT_ROOM_ID = 'default';

// roomId-short for log prefixes (MUST rule #5 in architecture.md).
// 'default' is preserved verbatim during the Phase-1 transition.
function shortRoomId(roomId) {
  if (!roomId) return '------';
  if (roomId === DEFAULT_ROOM_ID) return 'default';
  return String(roomId).slice(0, 6);
}

// Story 1.6: real ID + code generators per architecture naming conventions.
const crypto = require('crypto');

// clash_<22-char base32 lower-case>. 22 chars of base32 ≈ 110 bits.
function _genRoomId() {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz234567'; // RFC 4648 base32 lower
  const bytes = crypto.randomBytes(22);
  let out = '';
  for (let i = 0; i < 22; i++) out += alphabet[bytes[i] % 32];
  return `clash_${out}`;
}

// 6-char roomCode, alphabet excludes 0 O 1 I L (visual ambiguity). 31 chars.
const _ROOM_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
function _genRoomCode() {
  const bytes = crypto.randomBytes(6);
  let out = '';
  for (let i = 0; i < 6; i++) out += _ROOM_CODE_ALPHABET[bytes[i] % _ROOM_CODE_ALPHABET.length];
  return out;
}

// Roll a unique roomCode that isn't currently held by any active room.
function generateUniqueRoomCode({ maxAttempts = 12 } = {}) {
  const active = new Set();
  for (const r of _rooms.values()) {
    if (r.roomCode) active.add(r.roomCode);
  }
  for (let i = 0; i < maxAttempts; i++) {
    const c = _genRoomCode();
    if (!active.has(c)) return c;
  }
  // Extremely unlikely (31^6 ≈ 887M slots); fall through with last roll.
  return _genRoomCode();
}

function createRoom({ roomId, roomCode, hostId, roomName, settings, state } = {}) {
  const id = roomId || _genRoomId();
  if (_rooms.has(id)) return _rooms.get(id);
  const room = createRoomState({ roomId: id, roomCode, hostId, roomName, settings, state });
  _rooms.set(id, room);
  console.log(`[room:${shortRoomId(id)}] created`);
  return room;
}

// Story 1.6: support the concurrent-room cap. "Active" = any room not in a
// terminal state (ROOM_COMPLETED / ROOM_CANCELLED / ROOM_EXPIRED).
const TERMINAL_STATES = new Set(['ROOM_COMPLETED', 'ROOM_CANCELLED', 'ROOM_EXPIRED']);

function countActiveRoomsByHost(hostId) {
  if (!hostId) return 0;
  let n = 0;
  for (const r of _rooms.values()) {
    if (r.hostId === hostId && !TERMINAL_STATES.has(r.state)) n++;
  }
  return n;
}

function getRoom(roomId) {
  return _rooms.get(roomId);
}

function listRooms() {
  return Array.from(_rooms.values());
}

function closeRoom(roomId) {
  const room = _rooms.get(roomId);
  if (!room) return false;
  clearForRoom(roomId); // G-6: per-room timer cleanup
  _rooms.delete(roomId);
  console.log(`[room:${shortRoomId(roomId)}] closed`);
  return true;
}

function expireRoom(roomId) {
  const room = _rooms.get(roomId);
  if (!room) return false;
  room.phase = 'ROOM_EXPIRED';
  clearForRoom(roomId); // G-6
  // Story 1.4: replace earlier stub with real fire-and-forget writer.
  try {
    require('../auditLog.js').info({
      roomId,
      actor: 'system',
      action: 'room_expired_ttl'
    });
  } catch (_err) {
    // auditLog or its mongo model not loadable — swallow per MUST #10.
  }
  // Notify any connected sockets. broadcasts may not be wired yet during early
  // bootstrap or in non-socket contexts (smoke scripts); swallow silently.
  try {
    const broadcasts = require('../socket/broadcasts.js');
    if (typeof broadcasts.emitToRoom === 'function') {
      broadcasts.emitToRoom(roomId, 'room:closed', { reason: 'expired' });
    }
  } catch (_err) {
    // socket layer not attached — ignore
  }
  _rooms.delete(roomId);
  return true;
}

// Idle-TTL sweep. Defaults from env with safe fallbacks; Story 1.2 will make
// ROOM_IDLE_TTL_HOURS a validated env var.
const _idleTtlHours = Number(process.env.ROOM_IDLE_TTL_HOURS) || 4;
const _idleTtlMs = _idleTtlHours * 3600 * 1000;
const _sweepIntervalMs = 60_000;

function _sweepExpired() {
  const now = Date.now();
  for (const room of _rooms.values()) {
    // Phase-1 transition: never expire the synthetic default room.
    if (room.roomId === DEFAULT_ROOM_ID) continue;
    if (!room.lastActivityAt) continue;
    if (room.lastActivityAt + _idleTtlMs < now) {
      expireRoom(room.roomId);
    }
  }
}

// Guard the sweeper + bootstrap against double-init when Next.js dev recompiles
// this module (HMR / route re-bundle would otherwise stack extra intervals).
if (!_g[GLOBAL_KEY].sweeperStarted) {
  _g[GLOBAL_KEY].sweeperStarted = true;
  const _sweeper = setInterval(_sweepExpired, _sweepIntervalMs);
  if (typeof _sweeper.unref === 'function') _sweeper.unref();
}

module.exports = {
  DEFAULT_ROOM_ID,
  shortRoomId,
  createRoom,
  getRoom,
  listRooms,
  closeRoom,
  expireRoom,
  generateUniqueRoomCode,
  countActiveRoomsByHost
};

// Bootstrap the synthetic default room AFTER module.exports is populated.
// Guarded against re-bootstrap when multiple module instances share the same
// Map via globalThis.
// TODO(Story 1.6): drop default room bootstrap after /create-room ships.
if (!_g[GLOBAL_KEY].defaultBootstrapped) {
  _g[GLOBAL_KEY].defaultBootstrapped = true;
  if (!_rooms.has(DEFAULT_ROOM_ID)) {
    createRoom({ roomId: DEFAULT_ROOM_ID });
  }
}
