"use client";
import { useEffect, useRef, useState } from "react";

import { getSession } from "@/lib/auth";
import { getSocket } from "@/lib/socket";

export type SseConnectionStatus =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected";

type SseEventPayload = {
  type: string;
  data: unknown;
};

type UseServerEventsOptions = {
  enabled?: boolean;
  /** Kept for API compatibility; ignored by the socket transport. */
  path?: string;
  eventNames?: string[];
  onEvent?: (event: SseEventPayload) => void;
  onError?: (message: string) => void;
};

// Realtime is now Socket.IO. The hook keeps its old name + shape so existing
// callers (dashboards, messages) don't change. Each consumer attaches its own
// listeners to the shared singleton socket and removes them on unmount.
const DEFAULT_EVENTS = [
  "connected",
  "application-created",
  "application-updated",
  "conversation-created",
  "message",
  "message-read",
  "typing",
  "presence",
];

export const useServerEvents = ({
  enabled = true,
  eventNames = DEFAULT_EVENTS,
  onEvent,
  onError,
}: UseServerEventsOptions = {}) => {
  const [status, setStatus] = useState<SseConnectionStatus>(enabled ? "connecting" : "disconnected");
  const onEventRef = useRef(onEvent);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  // Stable key so the effect doesn't re-run on every render from a new array ref.
  const eventsKey = eventNames.join(",");

  useEffect(() => {
    const token = getSession()?.accessToken;
    if (!enabled || !token) {
      setStatus("disconnected");
      return;
    }

    const socket = getSocket(token);
    setStatus(socket.connected ? "connected" : "connecting");

    const onConnect = () => setStatus("connected");
    const onDisconnect = () => setStatus("reconnecting");
    const onConnectError = () => {
      setStatus("reconnecting");
      onErrorRef.current?.("Live connection lost. Reconnecting…");
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);

    const names = eventsKey ? eventsKey.split(",") : [];
    const handlers = new Map<string, (data: unknown) => void>();
    for (const name of names) {
      if (name === "connected" || name === "heartbeat") continue;
      const handler = (data: unknown) => onEventRef.current?.({ type: name, data });
      handlers.set(name, handler);
      socket.on(name, handler);
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      for (const [name, handler] of handlers) {
        socket.off(name, handler);
      }
      // Intentionally do NOT disconnect the shared socket here — other
      // components may still be using it. It closes on logout.
    };
  }, [enabled, eventsKey]);

  return { status };
};
