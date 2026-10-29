"use client";

import { useEffect, useState } from "react";
import { getSession, type AuthSession } from "@/lib/auth";

/**
 * Session as React state. `getSession()` reads localStorage, which doesn't
 * exist during server rendering, so a component that calls it in render
 * paints "logged out" HTML and then flips on hydration. Reading it in an
 * effect (and listening for cross-tab changes) keeps server and client
 * markup identical and still updates the instant the user signs in or out.
 */
export function useSession(): AuthSession | null {
  const [session, setSession] = useState<AuthSession | null>(null);
  useEffect(() => {
    const read = () => setSession(getSession());
    read();
    window.addEventListener("storage", read);
    window.addEventListener("focus", read);
    return () => {
      window.removeEventListener("storage", read);
      window.removeEventListener("focus", read);
    };
  }, []);
  return session;
}
