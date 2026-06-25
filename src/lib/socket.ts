import { io, type Socket } from "socket.io-client";

// Socket.IO must reach the Express backend directly (WebSockets don't ride the
// Next.js same-origin rewrite proxy cleanly). Derive the backend origin from
// the configured API URL. When NEXT_PUBLIC_API_URL is unset we fall back to the
// current page origin in the browser (matching resolveApiBase in lib/api.ts)
// instead of a hardcoded localhost, so realtime features don't silently break
// in a same-origin deployment.
const browserOrigin =
  typeof window !== "undefined" ? window.location.origin : "http://localhost:5000";
const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim() || `${browserOrigin}/api/v1`;
const SOCKET_URL = (() => {
  try {
    return new URL(apiUrl).origin;
  } catch {
    return browserOrigin;
  }
})();

let socket: Socket | null = null;
let currentToken: string | null = null;

/**
 * Shared singleton socket. All hooks attach their own listeners to it; it stays
 * alive across components and only reconnects when the auth token changes.
 */
export const getSocket = (token: string): Socket => {
  if (socket && currentToken === token) return socket;

  if (socket) {
    socket.disconnect();
    socket = null;
  }

  currentToken = token;
  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket", "polling"],
    withCredentials: true,
    reconnection: true,
    reconnectionDelay: 2000,
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  currentToken = null;
};

export { SOCKET_URL };
