// Load test scaffold — Story 5.3 / G-1.
//
// Goal: validate NFR-1 (5 rooms × 200 audience = 1000 sockets at p95 < 300ms)
// on a deployed Cloud Run instance configured per D-14 (min=max=1,
// session-affinity, CPU throttle disabled).
//
// IMPORTANT: this is a SCAFFOLD. Running against a dev box from a laptop is
// not a valid load test. Run against a deployed Cloud Run target with
// IMAGE_PROVIDER=stub (so no provider quota is burned).
//
// Usage:
//   SMOKE_URL=https://<cloud-run-url> ROOMS=5 PLAYERS_PER_ROOM=2 \
//   AUDIENCE_PER_ROOM=200 DURATION_SEC=120 node scripts/loadTest.js
//
// PASS criteria (per spec):
//   * p95(castVote, submitPrompt) < 300ms
//   * 0 dropped sockets
//   * Cloud Run CPU < 70% steady-state
//   * No Mongo connection saturation
//
// FAIL → architecture decision (single-instance) is revisited (Phase 2:
// Redis pub-sub + multi-instance scale-out).

const { io } = require('socket.io-client');

const URL = process.env.SMOKE_URL || 'http://localhost:3000';
const PATH = '/api/socket';
const ROOMS = Number(process.env.ROOMS) || 2;
const PLAYERS_PER_ROOM = Number(process.env.PLAYERS_PER_ROOM) || 2;
const AUDIENCE_PER_ROOM = Number(process.env.AUDIENCE_PER_ROOM) || 5;
const DURATION_SEC = Number(process.env.DURATION_SEC) || 30;

async function createRoom(i) {
  const res = await fetch(`${URL}/api/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      roomName: `LoadTest-${i}-${Date.now().toString(36)}`,
      categoryMode: 'RANDOM',
      audienceEnabled: true,
      audienceVotingEnabled: false
    })
  });
  const body = await res.json();
  if (!res.ok || !body.ok) {
    throw new Error(`Room create ${i} failed: ${JSON.stringify(body)}`);
  }
  return body.data; // { roomId, roomCode }
}

function openSocket({ roomId, deviceId, role }) {
  return io(URL, {
    path: PATH,
    auth: { roomId, deviceId, role },
    transports: ['websocket']
  });
}

async function main() {
  const start = Date.now();
  const log = (...a) => console.log(`[+${((Date.now() - start) / 1000).toFixed(1)}s]`, ...a);

  log(`Load test: ROOMS=${ROOMS} PLAYERS=${PLAYERS_PER_ROOM} AUDIENCE=${AUDIENCE_PER_ROOM} DURATION=${DURATION_SEC}s`);
  log(`Target: ${URL}`);

  const rooms = [];
  for (let i = 0; i < ROOMS; i++) {
    rooms.push(await createRoom(i));
  }
  log(`Minted ${rooms.length} rooms`);

  const sockets = [];
  const latencies = [];
  for (const r of rooms) {
    for (let i = 0; i < PLAYERS_PER_ROOM; i++) {
      sockets.push(openSocket({ roomId: r.roomId, deviceId: `lt-p-${r.roomCode}-${i}`, role: 'player' }));
    }
    for (let i = 0; i < AUDIENCE_PER_ROOM; i++) {
      sockets.push(openSocket({ roomId: r.roomId, deviceId: `lt-a-${r.roomCode}-${i}`, role: 'audience' }));
    }
  }
  log(`Opened ${sockets.length} sockets`);

  let received = 0;
  let connectErrors = 0;
  for (const s of sockets) {
    s.on('state', () => {
      received++;
    });
    s.on('connect_error', () => {
      connectErrors++;
    });
  }

  // Steady-state simulation: every audience socket pings the room every 5s
  // (matches a realistic event mix at low intensity). Real load test would
  // hammer castVote/submitPrompt; Phase-1 scaffold just exercises connection.
  await new Promise((resolve) => setTimeout(resolve, DURATION_SEC * 1000));

  log(`Received ${received} state events, ${connectErrors} connect errors, ${latencies.length} measured latencies`);
  if (latencies.length) {
    latencies.sort((a, b) => a - b);
    const p50 = latencies[Math.floor(latencies.length * 0.5)];
    const p95 = latencies[Math.floor(latencies.length * 0.95)];
    log(`Latency p50=${p50}ms p95=${p95}ms`);
    if (p95 < 300) log('PASS: p95 < 300ms');
    else log(`FAIL: p95 ${p95}ms >= 300ms threshold`);
  } else {
    log('NOTE: no event latencies measured (scaffold mode). Full test needs scripted prompt/vote emissions.');
  }

  // Cleanup
  for (const s of sockets) s.close();
  process.exit(connectErrors === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('FATAL', err);
  process.exit(2);
});
