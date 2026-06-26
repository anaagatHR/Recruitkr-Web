import http from 'node:http';

import app from './app.js';
import { connectDb } from './config/db.js';
import { env } from './config/env.js';
import { reportSolrStatus } from './services/solr.service.js';
import { initSocket } from './socket.js';

const bootstrap = async () => {
  await connectDb();

  const httpServer = http.createServer(app);
  initSocket(httpServer);

  httpServer.listen(env.PORT, () => {
    console.log(`Backend running on port ${env.PORT}`);
    // Print whether search is served by Solr or the MongoDB fallback. Runs after
    // listen so a slow/unreachable Solr never delays accepting traffic.
    void reportSolrStatus();
  });
};

bootstrap().catch((error) => {
  console.error('network error:', error);
  process.exit(1);
});
