// Uçtan uca maç testi: 2 oyuncu simüle eder, kazanan çıkıyor mu doğrular.
// Kullanım: node scripts/matchSmoke.js
const { io } = require('socket.io-client');

const URL = process.env.SMOKE_URL || 'http://localhost:3000';
const PATH = '/api/socket';

function mkClient(role, deviceId) {
  return io(URL, {
    path: PATH,
    auth: { role, deviceId, roomId: 'default' },
    transports: ['websocket']
  });
}

const A = mkClient('player', 'smoke-dev-A-' + Date.now());
const B = mkClient('player', 'smoke-dev-B-' + Date.now());

let lastPhase = null;
let aSubmitted = false;
let bSubmitted = false;
let aReadyEmitted = false;
let bReadyEmitted = false;
let resultCount = 0; // 1 = first match done, 2 = rematch done → exit
const TWO_TURNS = process.env.SMOKE_TWO_TURNS === '1';
const start = Date.now();

function log(...a) { console.log(`[+${((Date.now() - start) / 1000).toFixed(1)}s]`, ...a); }

A.on('connect', () => {
  log('A connected, joining...');
  A.emit('join_game', { nickname: 'AlfaBot' }, (r) => log('A join ack:', JSON.stringify(r)));
});

B.on('connect', () => log('B connected (will join after A is PLAYER_1)'));

function handleState(who, s) {
  if (s.phase !== lastPhase) {
    lastPhase = s.phase;
    log(`PHASE -> ${s.phase}  winner=${s.winner ?? '-'}  cat=${s.roundCategory ?? '-'} diff=${s.roundDifficulty ?? '-'}  A.score=${s.players?.A?.aiScore ?? '-'} B.score=${s.players?.B?.aiScore ?? '-'}`);
  }
  // A görünce ve B henüz katılmadıysa B katılsın
  if (s.phase === 'PLAYER_1_JOINED' && !B._joined) {
    B._joined = true;
    log('B joining...');
    B.emit('join_game', { nickname: 'BetaBot' }, (r) => log('B join ack:', JSON.stringify(r)));
  }
  // LOBBY (Sally v3 + rematch): both players ack "Hazırım" → server fires startMatch.
  // Rematch LOBBY için flag'leri sıfırlıyoruz ki ikinci tur ready'leri de gönderilsin.
  if (s.phase === 'LOBBY') {
    if (!aReadyEmitted) {
      aReadyEmitted = true;
      A.emit('player_ready', {}, (r) => log('A player_ready ack:', JSON.stringify(r)));
    }
    if (!bReadyEmitted) {
      bReadyEmitted = true;
      B.emit('player_ready', {}, (r) => log('B player_ready ack:', JSON.stringify(r)));
    }
  }
  // PROMPTING'e gelince prompt gönder
  if (s.phase === 'PROMPTING') {
    if (!aSubmitted) { aSubmitted = true; A.emit('prompt_submit', { text: 'a single futuristic cyberpunk cat with neon lights, glowing eyes' }); log('A submitted prompt'); }
    if (!bSubmitted) { bSubmitted = true; B.emit('prompt_submit', { text: 'a green frog sitting on a rock in daylight' }); log('B submitted prompt'); }
  }
  if (s.phase === 'RESULT' && resultCount === 0) {
    resultCount = 1;
    log('=== RESULT (tur 1) ===');
    log('winner:', s.winner);
    log('A:', s.players?.A?.nickname, 'score=', s.players?.A?.aiScore, 'img=', !!s.players?.A?.imageUrl);
    log('B:', s.players?.B?.nickname, 'score=', s.players?.B?.aiScore, 'img=', !!s.players?.B?.imageUrl);
    log('reasoning:', s.aiReasoning);
    log('reference:', s.referenceImageUrl);
    log('category/difficulty:', s.roundCategory, s.roundDifficulty);
    log('GERÇEK PROMPT (reveal):', s.targetPrompt);
    if (!TWO_TURNS) {
      setTimeout(() => { A.close(); B.close(); process.exit(s.winner && s.winner !== 'TIE' ? 0 : 2); }, 500);
      return;
    }
    log('TWO_TURNS=1 — rematch LOBBY bekleniyor...');
    // Rematch için ikinci tur ready emitlerini sıfırla; ayrıca prompt-submit'lerini de.
    aReadyEmitted = false; bReadyEmitted = false;
    aSubmitted = false; bSubmitted = false;
    return;
  }
  if (s.phase === 'RESULT' && resultCount === 1) {
    resultCount = 2;
    log('=== RESULT (tur 2 / rematch) ===');
    log('winner:', s.winner);
    log('A:', s.players?.A?.nickname, 'score=', s.players?.A?.aiScore);
    log('B:', s.players?.B?.nickname, 'score=', s.players?.B?.aiScore);
    setTimeout(() => { A.close(); B.close(); process.exit(s.winner && s.winner !== 'TIE' ? 0 : 2); }, 500);
  }
}

A.on('state', (s) => handleState('A', s));
B.on('state', (s) => handleState('B', s));
A.on('error', (e) => log('A error:', JSON.stringify(e)));
B.on('error', (e) => log('B error:', JSON.stringify(e)));

setTimeout(() => { log('TIMEOUT - no RESULT reached'); A.close(); B.close(); process.exit(1); }, TWO_TURNS ? 240000 : 120000);
