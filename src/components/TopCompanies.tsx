"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Building2, MapPin } from "lucide-react";
import { Link } from "@/compat/router";
import { fetchJobs, type Job } from "@/lib/jobs";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";

/**
 * Companies currently hiring, derived from the live job list.
 *
 * There is no company API and no company directory — `/uploads/logos` returns
 * bare images with no names, and `fetchCompanies()` points at a `/companies`
 * endpoint the backend doesn't implement. So rather than hand-maintain a list
 * of employer names (which would drift from what's actually on the board), this
 * groups the real jobs by their `company` string. Every name, role count,
 * sector and location shown here comes from a listing that exists.
 *
 * It renders nothing when there are no jobs, so a quiet board shows an honest
 * gap rather than a placeholder wall.
 *
 * It also renders nothing when `fetchJobs()` reports `live: false`. That flag
 * means the request failed and the caller is being handed `seedJobs` — eight
 * fictional listings from six invented companies (Nimbus Technologies,
 * FinEdge Capital and friends). Those are fine as a demo job grid, but this
 * section states "every employer below has at least one live opening", and
 * naming made-up companies under that sentence would be a straightforwardly
 * false claim about who is hiring. Better to show nothing.
 */

const NAVY = "#264a7f";
const GREEN = "#69a44f";
const AMBER = "#e59f56";
const ACCENTS = [NAVY, GREEN, AMBER];

const MAX_COMPANIES = 8;

type CompanySummary = {
  name: string;
  logo?: string;
  /** Number of live listings, not the sum of each listing's `openings` field. */
  listings: number;
  sector?: string;
  location?: string;
};

/** "Nimbus Technologies" -> "NT", "RetailNova" -> "R" */
function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

function summarise(jobs: Job[]): CompanySummary[] {
  const byCompany = new Map<string, CompanySummary>();

  for (const job of jobs) {
    const name = job.company?.trim();
    if (!name) continue;

    // Keyed case-insensitively so "Acme" and "ACME" don't split into two
    // cards; the first spelling seen is the one displayed.
    const key = name.toLowerCase();
    const entry = byCompany.get(key) ?? { name, listings: 0 };

    entry.listings += 1;
    entry.logo ??= job.companyLogo || undefined;
    entry.sector ??= job.sector?.trim() || undefined;
    entry.location ??= job.location?.trim() || undefined;

    byCompany.set(key, entry);
  }

  return [...byCompany.values()].sort(
    (a, b) => b.listings - a.listings || a.name.localeCompare(b.name),
  );
}

function CompanyTile({ company, accent }: { company: CompanySummary; accent: string }) {
  return (
    <Link
      to={`/jobs?search=${encodeURIComponent(company.name)}`}
      aria-label={`${company.name} — ${company.listings} open ${company.listings === 1 ? "role" : "roles"}`}
      className="group flex h-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 transition-all duration-300 hover:-translate-y-1 hover:border-[color:var(--accent)] hover:shadow-[0_18px_40px_-24px_var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] focus-visible:ring-offset-2 sm:gap-4 sm:p-5"
      style={{ "--accent": accent } as React.CSSProperties}
    >
      {/* Logo when the listing carries one, initials monogram when it doesn't —
          a broken <img> would be worse than a clean letterform. */}
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl text-sm font-extrabold sm:h-14 sm:w-14 sm:rounded-2xl sm:text-base"
        style={{ backgroundColor: `${accent}14`, color: accent }}
      >
        {company.logo ? (
          // Employer logos are arbitrary remote URLs that aren't in the
          // next/image remotePatterns allow-list, so next/image would reject
          // them at runtime. Same approach as the logo marquee in company.tsx.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={company.logo}
            alt=""
            aria-hidden
            loading="lazy"
            className="h-full w-full object-contain p-1.5"
          />
        ) : (
          initials(company.name)
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-bold text-slate-900 transition-colors duration-200 group-hover:text-[color:var(--accent)] sm:text-[15px]">
          {company.name}
        </span>

        {/* Sector and location only appear when the listing actually carried
            them — no "—" placeholders for missing fields. */}
        {(company.sector || company.location) && (
          <span className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-slate-500 sm:text-xs">
            {company.location && <MapPin className="h-3 w-3 shrink-0" />}
            <span className="truncate">
              {[company.sector, company.location].filter(Boolean).join(" · ")}
            </span>
          </span>
        )}

        <span
          className="mt-1.5 inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-semibold sm:text-[11px]"
          style={{ backgroundColor: `${accent}14`, color: accent }}
        >
          {company.listings} open {company.listings === 1 ? "role" : "roles"}
        </span>
      </span>
    </Link>
  );
}

export default function TopCompanies() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchJobs()
      .then(({ jobs: allJobs, live }) => {
        // `live: false` means the API call failed and these are the fictional
        // seed listings — treat that as "no companies", not as data.
        if (active) setJobs(live ? allJobs : []);
      })
      .catch(() => {
        if (active) setJobs([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const companies = useMemo(() => summarise(jobs).slice(0, MAX_COMPANIES), [jobs]);

  // Nothing to show and nothing invented to show instead — drop the section
  // rather than leave an empty heading on the page.
  if (!loading && companies.length === 0) return null;

  return (
    <section className="bg-white py-14 sm:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal as="div" className="mx-auto mb-8 max-w-2xl text-center sm:mb-12">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#69a44f]/25 bg-[#69a44f]/10 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#4d7d38]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#69a44f]" />
            Who&apos;s hiring
          </span>
          <h2 className="mt-4 font-heading text-2xl font-extrabold tracking-tight text-slate-900 sm:mt-5 sm:text-3xl lg:text-4xl">
            Companies <span className="text-[#69a44f]">hiring this week</span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
            Every employer below has at least one live opening on the board. Tap one to see its roles.
          </p>
        </Reveal>

        {loading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl border border-slate-200 bg-slate-100/70" />
            ))}
          </div>
        ) : (
          <RevealGroup className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            {companies.map((company, index) => (
              <RevealItem key={company.name} className="h-full">
                <CompanyTile company={company} accent={ACCENTS[index % ACCENTS.length]} />
              </RevealItem>
            ))}
          </RevealGroup>
        )}

        <div className="mt-8 flex justify-center sm:mt-10">
          <Link
            to="/jobs"
            className="group inline-flex min-h-[48px] items-center gap-2 rounded-full border border-slate-300 bg-white px-7 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#69a44f] hover:text-[#4d7d38]"
          >
            <Building2 size={16} />
            Browse every employer
            <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
