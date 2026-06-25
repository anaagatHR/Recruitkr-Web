"use client";

import { GraduationCap, Loader2, MapPin, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CandidateResult } from "@/lib/search";

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "?";

const scoreTone = (score: number) =>
  score >= 75 ? "text-emerald-500" : score >= 50 ? "text-amber-500" : "text-slate-400";

/** Small SVG radial showing the candidate's 0-100 potential score. */
const ScoreRing = ({ score }: { score: number }) => {
  const r = 18;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score));
  return (
    <div className="relative h-12 w-12 shrink-0">
      <svg viewBox="0 0 44 44" className="h-12 w-12 -rotate-90">
        <circle cx="22" cy="22" r={r} fill="none" stroke="currentColor" strokeWidth="4" className="text-muted/40" />
        <circle
          cx="22"
          cy="22"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (pct / 100) * c}
          className={cn("transition-all", scoreTone(score))}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-foreground">
        {pct}
      </span>
    </div>
  );
};

type CandidateCardProps = {
  candidate: CandidateResult;
  onMessage?: (candidate: CandidateResult) => void;
  messaging?: boolean;
};

export default function CandidateCard({ candidate, onMessage, messaging }: CandidateCardProps) {
  return (
    <article className="group flex flex-col gap-4 rounded-3xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg">
      <div className="flex items-start gap-4">
        {candidate.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={candidate.photoUrl}
            alt={candidate.name}
            className="h-14 w-14 shrink-0 rounded-2xl border border-border object-cover"
          />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-base font-bold text-primary">
            {initialsOf(candidate.name)}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-bold text-foreground">{candidate.name || "Candidate"}</h3>
          {candidate.headline && (
            <p className="truncate text-sm text-primary">{candidate.headline}</p>
          )}
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{candidate.experience}</p>
        </div>

        <ScoreRing score={candidate.profileScore} />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {candidate.skills.slice(0, 6).map((skill) => (
          <span
            key={skill}
            className="rounded-full border border-border bg-muted/40 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground"
          >
            {skill}
          </span>
        ))}
        {candidate.skills.length > 6 && (
          <span className="rounded-full px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            +{candidate.skills.length - 6}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {candidate.location && (
          <span className="inline-flex items-center gap-1">
            <MapPin size={13} /> {candidate.location}
          </span>
        )}
        {candidate.education && (
          <span className="inline-flex items-center gap-1">
            <GraduationCap size={13} /> {candidate.education}
          </span>
        )}
      </div>

      {onMessage && (
        <button
          type="button"
          onClick={() => onMessage(candidate)}
          disabled={messaging}
          className="mt-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
        >
          {messaging ? <Loader2 size={16} className="animate-spin" /> : <MessageSquare size={16} />}
          Message
        </button>
      )}
    </article>
  );
}
