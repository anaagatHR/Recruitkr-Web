"use client";

import { type ComponentType, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type StatCardProps = {
  icon: ComponentType<{ size?: number | string; className?: string }>;
  label: string;
  value: ReactNode;
  /** Icon-chip tint, e.g. "bg-[#264a7f]/10 text-[#264a7f]". */
  tone?: string;
  /** Optional small badge top-right (e.g. "+12%"). */
  delta?: string;
  deltaTone?: string;
  /** Optional footer node, e.g. a progress bar. */
  footer?: ReactNode;
  className?: string;
};

/**
 * Modern dashboard stat card (RecruitKr design): icon chip + optional delta in
 * the top row, a large value, and a muted label. Subtle lift on hover.
 */
export default function StatCard({
  icon: Icon,
  label,
  value,
  tone = "bg-primary/10 text-primary",
  delta,
  deltaTone = "text-emerald-600",
  footer,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.05)] transition-all hover:-translate-y-0.5 hover:shadow-md sm:p-[18px] dark:border-border dark:bg-card",
        className,
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl", tone)}>
          <Icon size={19} />
        </span>
        {delta && <span className={cn("text-xs font-bold", deltaTone)}>{delta}</span>}
      </div>
      <div className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-[26px] dark:text-foreground">
        {value}
      </div>
      <div className="mt-0.5 text-[13px] font-medium text-slate-500 dark:text-muted-foreground">{label}</div>
      {footer}
    </div>
  );
}
