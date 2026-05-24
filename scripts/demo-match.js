// Demo helper — connects 2 fake players to the local dev server so we can
// screenshot non-IDLE stage screens. Keeps the connections alive until killed.

const { io } = require('socket.io-client');

const URL = process.env.URL || 'http://localhost:3100';

function makeClient(deviceId, role = 'player') {
  return io(URL, {
    path: '/api/socket',
    transports: ['websocket', 'polling'],
    auth: { role, deviceId }
  });
}

async function main() {
  const aliceId = 'demo-alice-' + Date.now();
  const bobId = 'demo-bob-' + Date.now();

  const alice = makeClient(aliceId);
  const bob = makeClient(bobId);

  alice.on('connect', () => console.log('[alice] connected', alice.id));
  bob.on('connect', () => console.log('[bob] connected', bob.id));

  alice.on('state', (s) => {
    console.log('[alice] state', s.phase, 'A=', s.players.A?.nickname, 'B=', s.players.B?.nickname);
  });
  alice.on('joined_as', (m) => console.log('[alice] joined_as', m));
  bob.on('joined_as', (m) => console.log('[bob] joined_as', m));

  // Wait for both to connect
  await new Promise((r) => setTimeout(r, 1500));

  // Alice joins first → Player A
  alice.emit('join_game', { nickname: 'alice' }, (res) => console.log('[alice] join result', res));
  await new Promise((r) => setTimeout(r, 500));

  // Bob joins → Player B → match starts (VS_INTRO 5s → PROMPTING 60s)
  bob.emit('join_game', { nickname: 'bob' }, (res) => console.log('[bob] join result', res));

  // Once PROMPTING begins, simulate live typing then submit early so the
  // match cycles quickly through all phases for screenshotting.
  let typedAlice = '';
  let typedBob = '';
  const aliceText =
    'a futuristic cyberpunk cat with neon eyes on a rainy rooftop in Tokyo';
  const bobText =
    'a stray cat under a glowing pink sign, wet pavement reflecting the city';

  const typer = setInterval(() => {
    if (typedAlice.length < aliceText.length) {
      typedAlice = aliceText.slice(0, typedAlice.length + 3);
      alice.emit('prompt_typing', { text: typedAlice });
    }
    if (typedBob.length < bobText.length) {
      typedBob = bobText.slice(0, typedBob.length + 3);
      bob.emit('prompt_typing', { text: typedBob });
    }
    if (typedAlice.length >= aliceText.length && typedBob.length >= bobText.length) {
      clearInterval(typer);
    }
  }, 200);

  // Submit early (after 14s) so the match advances to GENERATING quickly
  setTimeout(() => {
    console.log('Submitting both prompts to advance the match');
    alice.emit('prompt_submit', { text: aliceText });
    bob.emit('prompt_submit', { text: bobText });
  }, 14_000);

  console.log('Demo running. Press Ctrl+C to stop.');
  // Keep alive
  setInterval(() => {}, 60000);
}

main().catch((e) => {
  console.error('demo failed:', e);
  process.exit(1);
});
