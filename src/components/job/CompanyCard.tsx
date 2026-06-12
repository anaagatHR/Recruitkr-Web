"use client";

import { Link } from "@/compat/router";
import { BadgeCheck, Building2, MapPin } from "lucide-react";
import type { Company } from "@/lib/jobs";
import StarRating from "@/components/job/StarRating";

const displayInitial = (value?: string) => (value?.trim().charAt(0) || "?").toUpperCase();

export default function CompanyCard({ company }: { company: Company }) {
  return (
    <Link
      to={`/companies/${company.id}`}
      className="group flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_18px_40px_-18px_hsl(var(--primary)/0.35)]"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border bg-muted text-base font-bold text-primary">
          {displayInitial(company.name)}
        </div>
        <div className="min-w-0">
          <h3 className="flex items-center gap-1.5 truncate text-base font-bold text-foreground group-hover:text-primary">
            {company.name}
            {company.verified && <BadgeCheck size={16} className="shrink-0 text-secondary" />}
          </h3>
          <p className="truncate text-sm text-muted-foreground">{company.sector}</p>
        </div>
      </div>

      <StarRating value={company.rating} reviews={company.reviews} />

      <p className="line-clamp-2 text-sm text-muted-foreground">{company.description}</p>

      <div className="mt-auto flex items-center justify-between border-t border-border pt-3 text-sm">
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <MapPin size={14} /> {company.location}
        </span>
        <span className="inline-flex items-center gap-1.5 font-semibold text-primary">
          <Building2 size={14} /> {company.openJobs} jobs
        </span>
      </div>
    </Link>
  );
}
