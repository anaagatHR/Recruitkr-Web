import crypto from 'node:crypto';

const subscribers = new Map();
const HEARTBEAT_INTERVAL_MS = 20000;

const buildSubscriberKey = ({ userId, role }) => `${role}:${userId}`;

const getActiveClientCount = () =>
  Array.from(subscribers.values()).reduce((total, bucket) => total + bucket.size, 0);

const flushIfSupported = (res) => {
  if (typeof res.flush === 'function') {
    res.flush();
  }
};

const canWriteToResponse = (res) => !res.writableEnded && !res.destroyed;

const writeSseEvent = (res, event, payload) => {
  if (!canWriteToResponse(res)) {
    return false;
  }

  if (event) {
    res.write(`event: ${event}\n`);
  }

  res.write(`data: ${JSON.stringify(payload)}\n\n`);
  flushIfSupported(res);
  return true;
};

const writeHeartbeat = (res) => {
  if (!canWriteToResponse(res)) {
    return false;
  }

  res.write(`event: heartbeat\n`);
  res.write(`data: ${JSON.stringify({ ts: Date.now() })}\n\n`);
  flushIfSupported(res);
  return true;
};

export const addLiveUpdateSubscriber = ({ userId, role, res }) => {
  const normalizedUserId = String(userId);
  const key = buildSubscriberKey({ userId: normalizedUserId, role });
  const clientId = crypto.randomUUID();

  const bucket = subscribers.get(key) || new Map();
  bucket.set(clientId, {
    clientId,
    userId: normalizedUserId,
    role,
    res,
    connectedAt: new Date().toISOString(),
  });
  subscribers.set(key, bucket);

  console.log(
    `[SSE] Client connected role=${role} userId=${normalizedUserId} clientId=${clientId} activeClients=${getActiveClientCount()}`,
  );

  const connected = writeSseEvent(res, 'connected', {
    ok: true,
    clientId,
    userId: normalizedUserId,
    role,
    connectedAt: new Date().toISOString(),
  });

  if (!connected) {
    bucket.delete(clientId);
    if (bucket.size === 0) {
      subscribers.delete(key);
    }
    return () => undefined;
  }

  const heartbeatId = setInterval(() => {
    if (!writeHeartbeat(res)) {
      clearInterval(heartbeatId);
    }
  }, HEARTBEAT_INTERVAL_MS);

  return () => {
    clearInterval(heartbeatId);

    const currentBucket = subscribers.get(key);
    if (!currentBucket) return;

    currentBucket.delete(clientId);
    if (currentBucket.size === 0) {
      subscribers.delete(key);
    }

    console.log(
      `[SSE] Client disconnected role=${role} userId=${normalizedUserId} clientId=${clientId} activeClients=${getActiveClientCount()}`,
    );
  };
};

export const publishLiveUpdate = ({ userId, role, event, payload }) => {
  if (!userId || !role) return;

  const normalizedUserId = String(userId);
  const key = buildSubscriberKey({ userId: normalizedUserId, role });
  const bucket = subscribers.get(key);

  console.log(
    `[SSE] Broadcast event=${event} role=${role} userId=${normalizedUserId} targets=${bucket?.size || 0}`,
  );

  if (!bucket?.size) return;

  for (const [clientId, subscriber] of bucket.entries()) {
    const delivered = writeSseEvent(subscriber.res, event, {
      ...payload,
      sentAt: new Date().toISOString(),
    });

    if (!delivered) {
      bucket.delete(clientId);
    }
  }

  if (bucket.size === 0) {
    subscribers.delete(key);
  }
};

export const getLiveUpdateStats = () => ({
  activeClients: getActiveClientCount(),
  subscriberGroups: subscribers.size,
});
