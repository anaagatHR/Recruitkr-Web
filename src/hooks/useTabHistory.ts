"use client";

import { useEffect, useRef, type Dispatch, type SetStateAction } from "react";

/**
 * Integrates an in-page tab with browser history so the Back button — including
 * the phone hardware/gesture back button — steps back through previously-viewed
 * tabs, and only leaves the page when you're on the default tab.
 *
 * How it works: selecting a non-default tab pushes a history entry tagged with
 * that tab; selecting the default tab replaces the current entry (so we never
 * stack duplicates). Pressing Back pops to the previous entry and we restore the
 * tab recorded on it. Next.js' own history state is preserved on every entry, so
 * routing/scroll restoration keep working.
 *
 * @param tab        current active tab
 * @param setTab     setter for the active tab
 * @param defaultTab the tab the page opens on (Back leaves the page from here)
 */
export function useTabHistory<T extends string>(
  tab: T,
  setTab: Dispatch<SetStateAction<T>>,
  defaultTab: T,
) {
  const tabRef = useRef(tab);
  // Set when a tab change originates from a Back/Forward pop, so we don't push a
  // new entry in response to our own history-driven state update.
  const skipPushRef = useRef(false);

  // tab -> history
  useEffect(() => {
    tabRef.current = tab;
    if (typeof window === "undefined") return;

    if (skipPushRef.current) {
      skipPushRef.current = false;
      return;
    }

    // Keep whatever state Next.js stored on this entry; just attach our marker.
    const state = { ...(window.history.state || {}), rkrTab: tab };
    if (tab === defaultTab) {
      window.history.replaceState(state, "");
    } else {
      window.history.pushState(state, "");
    }
  }, [tab, defaultTab]);

  // history -> tab
  useEffect(() => {
    const onPopState = (event: PopStateEvent) => {
      const next = ((event.state as { rkrTab?: T } | null)?.rkrTab ?? defaultTab) as T;
      if (next !== tabRef.current) {
        skipPushRef.current = true;
        setTab(next);
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
    // setTab is stable (useState setter); defaultTab is constant per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
