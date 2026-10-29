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
 * With `urlParam`, the tab is also mirrored into the query string (e.g.
 * `?tab=jobs`) so tabs can be linked, bookmarked and restored on reload; the
 * initial tab is read from the URL after mount (not during render, so server
 * and client markup still match).
 *
 * @param tab        current active tab
 * @param setTab     setter for the active tab
 * @param defaultTab the tab the page opens on (Back leaves the page from here)
 * @param options    urlParam + validTabs to enable linkable `?param=tab` URLs
 */
export function useTabHistory<T extends string>(
  tab: T,
  setTab: Dispatch<SetStateAction<T>>,
  defaultTab: T,
  options: { urlParam?: string; validTabs?: readonly T[] } = {},
) {
  const { urlParam, validTabs } = options;
  const tabRef = useRef(tab);
  // Set when a tab change originates from a Back/Forward pop (or the initial
  // URL read), so we don't push a new entry for our own history-driven update.
  const skipPushRef = useRef(false);
  const readUrlRef = useRef(false);
  // The tab restored from the URL replaces the landing entry instead of pushing.
  const replaceNextRef = useRef(false);

  const urlFor = (next: T) => {
    if (!urlParam) return undefined;
    const url = new URL(window.location.href);
    if (next === defaultTab) url.searchParams.delete(urlParam);
    else url.searchParams.set(urlParam, next);
    return `${url.pathname}${url.search}${url.hash}`;
  };

  // URL -> tab, once on mount.
  useEffect(() => {
    if (!urlParam || readUrlRef.current) return;
    readUrlRef.current = true;
    const fromUrl = new URLSearchParams(window.location.search).get(urlParam) as T | null;
    if (fromUrl && fromUrl !== tabRef.current && (!validTabs || validTabs.includes(fromUrl))) {
      // Skip this mount's pass for the stale default tab (it would strip the URL),
      // then record the restored tab by replacing — not pushing — the entry.
      skipPushRef.current = true;
      replaceNextRef.current = true;
      setTab(fromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    const replace = replaceNextRef.current;
    replaceNextRef.current = false;
    if (tab === defaultTab || replace) {
      window.history.replaceState(state, "", urlFor(tab));
    } else {
      window.history.pushState(state, "", urlFor(tab));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
