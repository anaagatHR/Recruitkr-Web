import { Server } from 'socket.io';

import { env } from './config/env.js';
import { Conversation } from './models/Conversation.js';
import { verifyAccessToken } from './utils/jwt.js';

let io = null;
// userId -> Set<socketId>. Drives online/offline presence.
const online = new Map();

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

/** Notify a user's conversation partners that they came online / went offline. */
const broadcastPresence = async (userId, isOnline) => {
  try {
    const id = String(userId);
    const conversations = await Conversation.find({ $or: [{ candidateId: id }, { clientId: id }] })
      .select('candidateId clientId')
      .lean();

    const partners = new Set();
    for (const conv of conversations) {
      const candidateId = conv.candidateId.toString();
      const clientId = conv.clientId.toString();
      if (candidateId === id) partners.add(clientId);
      else if (clientId === id) partners.add(candidateId);
    }

    for (const partnerId of partners) {
      emitToUser({ userId: partnerId, event: 'presence', payload: { userId: id, online: isOnline } });
    }
  } catch (error) {
    console.error('[socket] presence broadcast failed:', error?.message || error);
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
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) return next(new Error('Missing token'));
      const decoded = verifyAccessToken(String(token));
      socket.data.user = { id: String(decoded.sub), role: decoded.role };
      return next();
    } catch {
      return next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const { id: userId, role } = socket.data.user;
    socket.join(`user:${userId}`);

    const set = online.get(userId) || new Set();
    const wasOffline = set.size === 0;
    set.add(socket.id);
    online.set(userId, set);
    if (wasOffline) void broadcastPresence(userId, true);

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
        void broadcastPresence(userId, false);
      }
    });
  });

  console.log('[socket] Socket.IO initialized');
  return io;
};
