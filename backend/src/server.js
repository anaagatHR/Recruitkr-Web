import http from 'node:http';

import mongoose from 'mongoose';

import app from './app.js';
import { connectDb } from './config/db.js';
import { env } from './config/env.js';
import { reportSolrStatus } from './services/solr.service.js';
import { initSocket } from './socket.js';

// ---------------------------------------------------------------------------
// Process-level crash guards. A stray rejected promise (e.g. a fire-and-forget
// task or a bug deep in a dependency) must NEVER take the whole server down —
// that's every active user disconnected at once. We log and keep serving.
// uncaughtException is more serious (state may be corrupt), so we log, attempt
// a fast graceful close, and exit — Render restarts the container immediately.
// ---------------------------------------------------------------------------
process.on('unhandledRejection', (reason) => {
  console.error('[fatal-guard] unhandledRejection (recovered):', reason);
});

const bootstrap = async () => {
  await connectDb();

  const httpServer = http.createServer(app);

  // Keep server keep-alive longer than the upstream proxy/LB idle timeout
  // (nginx/ALB ~60s). If the server closes idle sockets first, the proxy can
  // reuse a half-closed connection and surface intermittent 502s under load.
  httpServer.keepAliveTimeout = 65_000;
  httpServer.headersTimeout = 66_000; // must exceed keepAliveTimeout

  const io = initSocket(httpServer);

  httpServer.listen(env.PORT, () => {
    console.log(`Backend running on port ${env.PORT}`);
    // Print whether search is served by Solr or the MongoDB fallback. Runs after
    // listen so a slow/unreachable Solr never delays accepting traffic.
    void reportSolrStatus();
  });

  // Graceful shutdown: Render sends SIGTERM on every deploy/restart. Stop
  // accepting new connections, tell socket clients to reconnect (they hit the
  // fresh instance), close Mongo cleanly, then exit. The 10s hard timer
  // guarantees we never hang a deploy waiting on a stuck connection.
  let shuttingDown = false;
  const shutdown = (signal, exitCode = 0) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`[shutdown] ${signal} received — closing gracefully`);

    const forceExit = setTimeout(() => {
      console.error('[shutdown] timed out; forcing exit');
      process.exit(exitCode || 1);
    }, 10_000);
    forceExit.unref();

    io.close(() => {});
    httpServer.close(async () => {
      try {
        await mongoose.connection.close();
      } catch {
        // closing anyway
      }
      process.exit(exitCode);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('uncaughtException', (error) => {
    console.error('[fatal-guard] uncaughtException:', error);
    shutdown('uncaughtException', 1);
  });
};

bootstrap().catch((error) => {
  console.error('network error:', error);
  process.exit(1);
});
