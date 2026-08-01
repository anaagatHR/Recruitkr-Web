"use client";

import { useEffect, useMemo, useState } from "react";
import { Flame, Eye, Zap, type LucideIcon } from "lucide-react";
import type { Job } from "@/lib/jobs";

/**
 * A rotating one-line summary of the listings currently on screen.
 *
 * This used to invent its numbers — `120 + Math.random() * 80`, re-rolled on
 * every render — which claimed "123 jobs posted in the last 24 hours" to one
 * visitor and "139" to the next, and produced a hydration error the moment the
 * server's roll disagreed with the browser's. Every line below is now counted
 * from the jobs actually loaded, and a line whose count is zero (or whose field
 * the API doesn't populate) is dropped rather than shown as "0".
 *
 * It renders nothing until mounted. The 24-hour window is measured against the
 * current clock, so a server render and a client render seconds apart can
 * legitimately disagree; deferring past hydration sidesteps that entirely, and
 * this is decoration that costs nothing to leave out of the initial HTML.
 */

type Stat = { icon: LucideIcon; text: string };

const DAY_MS = 24 * 60 * 60 * 1000;

function buildStats(jobs: Job[]): Stat[] {
  if (jobs.length === 0) return [];

  const cutoff = Date.now() - DAY_MS;
  const freshCount = jobs.filter((job) => {
    const posted = Date.parse(job.postedAt);
    return Number.isFinite(posted) && posted >= cutoff;
  }).length;

  const openings = jobs.reduce((sum, job) => sum + (Number(job.openings) || 0), 0);
  const companies = new Set(
    jobs.map((job) => job.company?.trim().toLowerCase()).filter(Boolean),
  ).size;
  const applicants = jobs.reduce((sum, job) => sum + (Number(job.applicants) || 0), 0);

  const stats: Stat[] = [];

  if (freshCount > 0) {
    stats.push({
      icon: Zap,
      text: `${freshCount.toLocaleString("en-IN")} posted in the last 24 hours`,
    });
  }
  if (openings > 0 && companies > 0) {
    stats.push({
      icon: Eye,
      text: `${openings.toLocaleString("en-IN")} ${openings === 1 ? "opening" : "openings"} across ${companies} ${companies === 1 ? "company" : "companies"}`,
    });
  }
  if (applicants > 0) {
    stats.push({
      icon: Flame,
      text: `${applicants.toLocaleString("en-IN")} ${applicants === 1 ? "person has" : "people have"} applied to these roles`,
    });
  }

  return stats;
}

export default function FomoTicker({ jobs }: { jobs: Job[] }) {
  const [mounted, setMounted] = useState(false);
  const [idx, setIdx] = useState(0);

  const stats = useMemo(() => buildStats(jobs), [jobs]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (stats.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % stats.length), 3500);
    return () => clearInterval(t);
  }, [stats.length]);

  if (!mounted || stats.length === 0) return null;

  // The filters can shrink the list between renders and drop a stat, leaving
  // `idx` past the end — fall back to the first rather than crashing.
  const stat = stats[idx] ?? stats[0];
  const Icon = stat.icon;

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-1.5 text-sm font-medium text-orange-700">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500" />
      </span>
      <Icon size={15} />
      <span>{stat.text}</span>
    </div>
  );
}
