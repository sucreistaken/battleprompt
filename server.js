// Custom Node server: hosts Next.js + Socket.io on the same port.
// Backend runtime code lives in plain JS so this file can require() it directly
// in both dev and production without a separate transpile step.

const { createServer } = require('http');
const next = require('next');
const { Server } = require('socket.io');

// .env'i her şeyden önce yükle ki validateEnv boot'ta doğru görsün.
require('@next/env').loadEnvConfig(process.cwd(), process.env.NODE_ENV !== 'production');

const { attachSocketServer } = require('./lib/socket/server.js');
const { connectMongo } = require('./lib/db.js');
const { validateEnv } = require('./lib/env.js');

const dev = process.env.NODE_ENV !== 'production';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev });
const handle = app.getRequestHandler();

function socketOriginAllowed(origin, cb) {
  if (!origin) return cb(null, true);
  if (dev) return cb(null, true);
  const allowed = new Set(
    [process.env.NEXT_PUBLIC_APP_URL, process.env.ALLOWED_ORIGIN]
      .filter(Boolean)
      .map((v) => {
        try {
          return new URL(v).origin;
        } catch {
          return v;
        }
      })
  );
  cb(null, allowed.has(origin));
}

(async () => {
  validateEnv();
  await app.prepare();
  await connectMongo().catch((err) => {
    console.error('[prompt-clash] mongo connect failed:', err.message);
  });

  const httpServer = createServer((req, res) => handle(req, res));

  const io = new Server(httpServer, {
    path: '/api/socket',
    cors: { origin: socketOriginAllowed, credentials: true },
    pingInterval: 20000,
    pingTimeout: 25000,
    maxHttpBufferSize: 1e5
  });

  attachSocketServer(io);

  httpServer.listen(port, () => {
    console.log(`[prompt-clash] ready on http://localhost:${port}`);
  });
})();
