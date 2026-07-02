import { Server } from 'socket.io';

import { env } from './config/env.js';
import { Conversation } from './models/Conversation.js';
import { verifyAccessToken } from './utils/jwt.js';

let io = null;
// userId -> Set<socketId>. Drives online/offline presence. O(1) lookup/update.
const online = new Map();
// userId -> Set<partnerUserId>. Conversation-partner adjacency cached in memory
// so connect/disconnect never hit MongoDB on the hot path. Loaded once per online
// session (a single query on first connect), maintained in O(1) thereafter via
// indexConversationPartners, and evicted when the user goes fully offline so the
// map stays bounded to currently-online users.
const partners = new Map();

const parseOrigins = (value = '') =>
  value
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);

const allowedOrigins = () =>
  Array.from(
    new Set(
      [
        ...parseOrigins(env.CORS_ORIGIN),
        env.FRONTEND_URL?.replace(/\/$/, ''),
        ...(env.NODE_ENV === 'production' ? [] : ['http://localhost:3000', 'http://localhost:3001']),
      ].filter(Boolean),
    ),
  );

/** True when the user has at least one live socket connected. */
export const isUserOnline = (userId) => {
  const set = online.get(String(userId));
  return Boolean(set && set.size > 0);
};

/** Emit an event to every socket a user has open. */
export const emitToUser = ({ userId, event, payload }) => {
  if (!io || !userId || !event) return;
  io.to(`user:${String(userId)}`).emit(event, { ...payload, sentAt: new Date().toISOString() });
};

/**
 * Compatibility shim for the previous SSE API. Controllers and services still
 * call publishLiveUpdate({ userId, role, event, payload }) unchanged.
 */
export const publishLiveUpdate = ({ userId, event, payload }) => emitToUser({ userId, event, payload });

/**
 * Return a user's conversation-partner set, loading it from Mongo only on a cache
 * miss (first connect of an online session). Subsequent reads are O(1) with no DB.
 */
const loadPartners = async (userId) => {
  const id = String(userId);
  const cached = partners.get(id);
  if (cached) return cached; // O(1) hot path — no DB round-trip

  const set = new Set();
  try {
    const conversations = await Conversation.find({ $or: [{ candidateId: id }, { clientId: id }] })
      .select('candidateId clientId')
      .limit(2000) // safety cap: bound per-connect memory even for extreme accounts
      .lean();
    for (const conv of conversations) {
      const candidateId = conv.candidateId.toString();
      const clientId = conv.clientId.toString();
      set.add(candidateId === id ? clientId : candidateId);
    }
  } catch (error) {
    console.error('[socket] partner load failed:', error?.message || error);
  }
  partners.set(id, set);
  return set;
};

/**
 * Incrementally index a newly created conversation edge in O(1). Only updates
 * users whose partner set is already cached (i.e. currently online); an offline
 * user picks up the new edge from Mongo on their next connect, so the cache stays
 * correct with no invalidation or refetch.
 */
export const indexConversationPartners = (candidateId, clientId) => {
  const a = String(candidateId);
  const b = String(clientId);
  partners.get(a)?.add(b);
  partners.get(b)?.add(a);
};

/**
 * Notify a user's conversation partners that they came online / went offline.
 * Iterates the pre-resolved partner set — no DB query on this path.
 */
const broadcastPresence = (userId, isOnline, partnerSet) => {
  const id = String(userId);
  for (const partnerId of partnerSet) {
    emitToUser({ userId: partnerId, event: 'presence', payload: { userId: id, online: isOnline } });
  }
};

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: { origin: allowedOrigins(), credentials: true, methods: ['GET', 'POST'] },
    transports: ['websocket', 'polling'],
  });

  // Authenticate the handshake with the same access token the REST API uses.
  io.use((socket, next) => {
    try {
      // auth payload only — query-string tokens end up in proxy/access logs.
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Missing token'));
      const decoded = verifyAccessToken(String(token));
      socket.data.user = { id: String(decoded.sub), role: decoded.role };
      return next();
    } catch {
      return next(new Error('Invalid token'));
    }
  });

  // Transport-level failures (bad handshakes, upgrade errors) must be visible,
  // not silent — and must never bubble into a process-level crash.
  io.engine.on('connection_error', (error) => {
    console.warn('[socket] connection error:', error?.code, error?.message);
  });

  io.on('connection', async (socket) => {
    const { id: userId, role } = socket.data.user;
    socket.join(`user:${userId}`);

    socket.on('error', (error) => {
      console.warn('[socket] socket error:', error?.message || error);
    });

    const set = online.get(userId) || new Set();
    const wasOffline = set.size === 0;
    set.add(socket.id);
    online.set(userId, set);
    if (wasOffline) {
      try {
        // One DB load per online session; cached for all later connect/disconnects.
        const partnerSet = await loadPartners(userId);
        broadcastPresence(userId, true, partnerSet);
      } catch (error) {
        // Presence is best-effort — a failure here must not bubble out of the
        // async listener as an unhandled rejection.
        console.error('[socket] presence broadcast failed:', error?.message || error);
      }
    }

    // Optional low-latency typing relay straight over the socket.
    socket.on('typing', ({ toUserId, conversationId, typing }) => {
      if (toUserId) {
        emitToUser({
          userId: toUserId,
          event: 'typing',
          payload: { conversationId, fromRole: role, typing: typing !== false },
        });
      }
    });

    socket.on('disconnect', () => {
      const current = online.get(userId);
      if (!current) return;
      current.delete(socket.id);
      if (current.size === 0) {
        online.delete(userId);
        // Use the cached partner set (no DB), then evict to bound memory to
        // online users — it reloads on the user's next connect.
        const partnerSet = partners.get(userId);
        if (partnerSet) broadcastPresence(userId, false, partnerSet);
        partners.delete(userId);
      }
    });
  });

  console.log('[socket] Socket.IO initialized');
  return io;
};
