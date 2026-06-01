// Multi-room isolation scaffold (Story 1.11 / D-15).
// Spins up 2 rooms via POST /api/rooms, connects one socket per room, and
// asserts each socket receives its own room's snapshot (no cross-talk on
// initial connect). Full behavioral invariants (vote isolation, pause
// isolation, etc.) are deferred to Story 5.2.
//
// Usage: server must be running (DEMO_MODE=1 npm run dev).
//   node scripts/multiRoomSmoke.js

const { io } = require('socket.io-client');

const URL = process.env.SMOKE_URL || 'http://localhost:3000';
const PATH = '/api/socket';

const start = Date.now();
const log = (...a) => console.log(`[+${((Date.now() - start) / 1000).toFixed(1)}s]`, ...a);

async function createRoom(roomName) {
  const res = await fetch(`${URL}/api/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      roomName,
      categoryMode: 'RANDOM',
      audienceEnabled: true,
      audienceVotingEnabled: false
    })
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`POST /api/rooms failed ${res.status}: ${txt}`);
  }
  const body = await res.json();
  if (!body.ok || !body.data?.roomId) {
    throw new Error(`POST /api/rooms unexpected: ${JSON.stringify(body)}`);
  }
  return body.data; // { roomId, roomCode }
}

function openSocket(roomId, deviceId, role = 'audience') {
  return io(URL, {
    path: PATH,
    auth: { role, deviceId, roomId },
    transports: ['websocket']
  });
}

function awaitState(socket) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('state event timeout')), 8000);
    socket.once('state', (s) => {
      clearTimeout(t);
      resolve(s);
    });
    socket.once('connect_error', (err) => {
      clearTimeout(t);
      reject(err);
    });
  });
}

async function main() {
  let exitCode = 0;
  log('creating Room A...');
  const a = await createRoom('SmokeRoomA');
  log('Room A:', a.roomId, '(code', a.roomCode, ')');

  log('creating Room B...');
  const b = await createRoom('SmokeRoomB');
  log('Room B:', b.roomId, '(code', b.roomCode, ')');

  if (a.roomId === b.roomId || a.roomCode === b.roomCode) {
    log('FAIL: rooms have identical id or code');
    process.exit(2);
  }

  const sA = openSocket(a.roomId, 'smoke-multi-A');
  const sB = openSocket(b.roomId, 'smoke-multi-B');

  let snapA, snapB;
  try {
    [snapA, snapB] = await Promise.all([awaitState(sA), awaitState(sB)]);
  } catch (err) {
    log('FAIL: snapshot await:', err.message);
    sA.close();
    sB.close();
    process.exit(3);
  }

  // Assertion 1: each socket's snapshot mentions its own room.
  if (snapA?.roomId !== a.roomId) {
    log('FAIL: socket A snapshot.roomId !=', a.roomId, '(got', snapA?.roomId, ')');
    exitCode = 4;
  }
  if (snapB?.roomId !== b.roomId) {
    log('FAIL: socket B snapshot.roomId !=', b.roomId, '(got', snapB?.roomId, ')');
    exitCode = 4;
  }

  // Assertion 2: socket A does NOT receive Room B broadcasts on initial connect.
  let crossTalk = false;
  const onA = (s) => {
    if (s?.roomId && s.roomId !== a.roomId) crossTalk = true;
  };
  const onB = (s) => {
    if (s?.roomId && s.roomId !== b.roomId) crossTalk = true;
  };
  sA.on('state', onA);
  sB.on('state', onB);

  // Give the broadcasters a beat in case any stray emit fires.
  await new Promise((r) => setTimeout(r, 1500));
  if (crossTalk) {
    log('FAIL: cross-room state broadcast detected');
    exitCode = 5;
  }

  sA.off('state', onA);
  sB.off('state', onB);
  sA.close();
  sB.close();

  if (exitCode === 0) log('OK: multi-room scaffold passes (2 rooms isolated on initial connect)');
  process.exit(exitCode);
}

main().catch((err) => {
  log('FATAL:', err.message);
  process.exit(1);
});

setTimeout(() => {
  log('TIMEOUT — no completion within 30s');
  process.exit(1);
}, 30_000).unref?.();
