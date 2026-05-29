// Socket.io event handlers — tek namespace, oda yok, tüm broadcast'ler herkese.
// Rol filtreleme client tarafında yapılır (state snapshot zaten role-safe).

const { state } = require('../game/state.js');
const { broadcastState } = require('./broadcasts.js');
const lifecycle = require('../game/matchLifecycle.js');
const { loadSettings, saveSettings } = require('../../models/Settings.js');
const { verifyToken, COOKIE_NAME } = require('../adminAuth.js');
const { rateLimit } = require('../rateLimit.js');
const cookie = require('cookie');

const ROLES = new Set(['player', 'audience', 'stage', 'admin']);

function _parseAdminCookie(handshake) {
  const raw = handshake?.headers?.cookie;
  if (!raw) return false;
  const parsed = cookie.parse(raw);
  const token = parsed[COOKIE_NAME];
  return !!verifyToken(token);
}

function _parseDeviceCookie(handshake) {
  const raw = handshake?.headers?.cookie;
  if (!raw) return null;
  const parsed = cookie.parse(raw);
  return parsed.pc_device_id ? String(parsed.pc_device_id) : null;
}

function _identifySlot(socket) {
  if (state.players.A?.socketId === socket.id) return 'A';
  if (state.players.B?.socketId === socket.id) return 'B';
  return null;
}

function _identifySlotByDevice(deviceId) {
  if (state.players.A?.deviceId === deviceId) return 'A';
  if (state.players.B?.deviceId === deviceId) return 'B';
  return null;
}

function _clientIp(socket) {
  const xf = socket.handshake.headers['x-forwarded-for'];
  if (typeof xf === 'string' && xf) return xf.split(',')[0].trim();
  return socket.handshake.address || 'unknown';
}

function _allow(socket, event, opts) {
  const ip = _clientIp(socket);
  const deviceId = socket.data.deviceId || 'unknown';
  const keys = [`ip:${ip}:${event}`, `device:${deviceId}:${event}`];
  for (const key of keys) {
    const res = rateLimit(key, opts);
    if (!res.ok) {
      socket.emit('error', { code: 'rate_limited', event, retryInMs: res.retryInMs });
      return false;
    }
  }
  return true;
}

async function attachSocketServer(io) {
  lifecycle.setIo(io);

  // Settings'leri DB'den yükle, state'e uygula, ilk referans görseli üretmeye başla
  try {
    const settings = await loadSettings();
    require('../game/state.js').applySettings(settings);
    // Background: ilk hedef görseli pre-cache
    lifecycle.ensureTargetImage().catch(() => {});
  } catch (err) {
    console.warn('[init] settings load failed:', err.message);
  }

  io.on('connection', (socket) => {
    const { role: rawRole, deviceId } = socket.handshake.auth || {};
    const role = ROLES.has(rawRole) ? rawRole : 'audience';
    const isAdmin = role === 'admin' ? _parseAdminCookie(socket.handshake) : false;
    socket.data.role = role;
    const cookieDeviceId = _parseDeviceCookie(socket.handshake);
    socket.data.deviceId = String(cookieDeviceId || deviceId || socket.id);
    socket.data.isAdmin = isAdmin;

    // Reconnect mantığı: bu cihaz zaten bir slot'ta mı?
    const existingSlot = _identifySlotByDevice(socket.data.deviceId);
    if (existingSlot) {
      lifecycle.handlePlayerReconnect(existingSlot, socket.id);
      socket.data.slot = existingSlot;
      socket.emit('joined_as', { slot: existingSlot });
    }

    // İlk state'i sadece bu sokete gönder
    socket.emit('state', require('./broadcasts.js').buildSnapshot());

    // -----------------------------------------------------------------------
    // Player events
    // -----------------------------------------------------------------------
    socket.on('join_game', (payload, ack) => {
      if (!_allow(socket, 'join_game', { limit: 10, windowMs: 60_000 })) {
        if (typeof ack === 'function') ack({ ok: false, reason: 'rate_limited' });
        return;
      }
      const nickname = payload?.nickname;
      const result = lifecycle.tryJoinAsPlayer({
        socketId: socket.id,
        deviceId: socket.data.deviceId,
        nickname
      });
      if (result.ok) {
        socket.data.slot = result.slot;
        socket.emit('joined_as', { slot: result.slot });
      } else {
        socket.emit('error', { code: 'join_failed', reason: result.reason });
      }
      if (typeof ack === 'function') ack(result);
    });

    socket.on('prompt_typing', (payload) => {
      if (!_allow(socket, 'prompt_typing', { limit: 90, windowMs: 30_000 })) return;
      const slot = socket.data.slot || _identifySlot(socket);
      if (!slot) return;
      lifecycle.handlePromptTyping({ slot, text: payload?.text });
    });

    socket.on('prompt_submit', (payload) => {
      if (!_allow(socket, 'prompt_submit', { limit: 6, windowMs: 60_000 })) return;
      const slot = socket.data.slot || _identifySlot(socket);
      if (!slot) return;
      lifecycle.handlePromptSubmit({ slot, text: payload?.text });
    });

    socket.on('vote', (payload, ack) => {
      if (!_allow(socket, 'vote', { limit: 20, windowMs: 30_000 })) {
        if (typeof ack === 'function') ack({ ok: false, reason: 'rate_limited' });
        return;
      }
      const result = lifecycle.handleVote({
        deviceId: socket.data.deviceId,
        votedFor: payload?.for
      });
      if (!result.ok) socket.emit('error', { code: 'vote_failed', reason: result.reason });
      if (typeof ack === 'function') ack(result);
    });

    // -----------------------------------------------------------------------
    // Admin events
    // -----------------------------------------------------------------------
    socket.on('admin:update_settings', async (payload, ack) => {
      if (!socket.data.isAdmin) {
        socket.emit('error', { code: 'admin_required' });
        if (typeof ack === 'function') ack({ ok: false });
        return;
      }
      try {
        const saved = await saveSettings(payload || {});
        lifecycle.adminUpdateSettings(saved);
        if (typeof ack === 'function') ack({ ok: true, settings: saved });
      } catch (err) {
        if (typeof ack === 'function') ack({ ok: false, reason: err.message });
      }
    });

    socket.on('admin:reset_match', () => {
      if (!socket.data.isAdmin) return;
      lifecycle.adminReset();
    });

    socket.on('admin:force_end', () => {
      if (!socket.data.isAdmin) return;
      lifecycle.adminForceEnd();
    });

    // -----------------------------------------------------------------------
    // Disconnect
    // -----------------------------------------------------------------------
    socket.on('disconnect', () => {
      const slot = socket.data.slot || _identifySlot(socket);
      if (slot) lifecycle.handlePlayerDisconnect(slot);
    });
  });

  console.log('[socket] attached');
}

module.exports = { attachSocketServer };
