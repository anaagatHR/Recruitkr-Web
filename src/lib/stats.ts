"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";

/**
 * Live numbers for the homepage, from GET /api/v1/stats.
 *
 * Every figure the marketing pages show about the board — openings, hiring
 * companies, jobs per category — comes from here. Nothing is hardcoded any
 * more: the audit found "500+ Active openings" and "120+ jobs" as string
 * literals while the API reported 68 listings, and a visitor who clicked
 * through saw five. Numbers that don't survive a click cost more trust than
 * small honest ones.
 */
export type SiteStats = {
  activeJobs: number;
  completeJobs: number;
  openings: number;
  companies: number;
  byType: Record<string, number>;
  byMode: Record<string, number>;
  byLocation: Record<string, number>;
  generatedAt?: string;
};

const EMPTY: SiteStats = {
  activeJobs: 0,
  completeJobs: 0,
  openings: 0,
  companies: 0,
  byType: {},
  byMode: {},
  byLocation: {},
};

const asCount = (value: unknown) => {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
};

const asCountMap = (value: unknown): Record<string, number> => {
  if (!value || typeof value !== "object") return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, count]) => [key.toLowerCase(), asCount(count)]),
  );
};

export function normalizeStats(raw: unknown): SiteStats {
  const record = (raw && typeof raw === "object" ? (raw as { data?: unknown }).data ?? raw : {}) as Record<string, unknown>;
  return {
    activeJobs: asCount(record.activeJobs),
    completeJobs: asCount(record.completeJobs),
    openings: asCount(record.openings),
    companies: asCount(record.companies),
    byType: asCountMap(record.byType),
    byMode: asCountMap(record.byMode),
    byLocation: asCountMap(record.byLocation),
    generatedAt: typeof record.generatedAt === "string" ? record.generatedAt : undefined,
  };
}

const STATS_TTL_MS = 5 * 60_000;
let memo: { promise: Promise<SiteStats | null>; expiresAt: number } | null = null;

/** Resolves to null when the API is unreachable — callers then show copy, not zeros. */
export async function fetchSiteStats(): Promise<SiteStats | null> {
  const now = Date.now();
  if (memo && now < memo.expiresAt) return memo.promise;
  const promise = apiGet<unknown>("/stats", { retries: 0 })
    .then((res) => normalizeStats(res))
    .catch(() => {
      memo = null;
      return null;
    });
  memo = { promise, expiresAt: now + STATS_TTL_MS };
  return promise;
}

export function useSiteStats() {
  const [stats, setStats] = useState<SiteStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchSiteStats()
      .then((result) => {
        if (active) setStats(result);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { stats, loading };
}

/**
 * How a count is shown on marketing surfaces.
 *
 * Small boards print the exact figure ("68") — rounding 68 up to "100+" is
 * the lie the audit flagged. Once a figure is comfortably large it is rounded
 * DOWN to a clean floor with a plus ("1,200+"), which is always true.
 */
export function formatCount(count: number): string {
  if (!Number.isFinite(count) || count <= 0) return "0";
  if (count < 100) return String(count);
  const step = count < 1_000 ? 50 : count < 10_000 ? 500 : 1_000;
  const floored = Math.floor(count / step) * step;
  return `${floored.toLocaleString("en-IN")}+`;
}

/** "3 jobs" / "1 job" / "No jobs yet". */
export function formatJobCount(count: number): string {
  if (count <= 0) return "No jobs yet";
  return `${formatCount(count)} ${count === 1 ? "job" : "jobs"}`;
}

/** Sum of counts whose key matches any of the given type names. */
export function countFor(map: Record<string, number>, ...keys: string[]): number {
  const wanted = keys.map((k) => k.toLowerCase());
  return Object.entries(map).reduce((sum, [key, count]) => (wanted.some((w) => key.includes(w)) ? sum + count : sum), 0);
}

export { EMPTY as EMPTY_STATS };
