import { asyncHandler } from '../utils/asyncHandler.js';
import { addLiveUpdateSubscriber, getLiveUpdateStats } from '../services/liveUpdate.service.js';

export const streamLiveUpdates = asyncHandler(async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.write('retry: 5000\n\n');

  if (typeof req.socket?.setKeepAlive === 'function') {
    req.socket.setKeepAlive(true);
  }

  if (typeof res.flushHeaders === 'function') {
    res.flushHeaders();
  }

  console.info(
    `[SSE] opening stream userId=${req.user.id} role=${req.user.role} source=${req.auth?.tokenSource || 'unknown'}`,
  );

  // Keep the stream open and immediately establish the SSE channel.
  res.write(`: stream-open ${Date.now()}\n\n`);

  const unsubscribe = addLiveUpdateSubscriber({
    userId: req.user.id,
    role: req.user.role,
    res,
  });

  const stats = getLiveUpdateStats();
  console.log(
    `[SSE] Stream ready role=${req.user.role} userId=${req.user.id} activeClients=${stats.activeClients}`,
  );

  let cleanedUp = false;
  const cleanup = () => {
    if (cleanedUp) return;
    cleanedUp = true;
    unsubscribe();
    console.info(`[SSE] stream closed userId=${req.user.id} role=${req.user.role}`);
  };

  req.on('close', cleanup);
  req.on('aborted', cleanup);
  res.on('close', cleanup);
  res.on('finish', cleanup);
});
