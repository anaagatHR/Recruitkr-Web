"use client";

import { CheckCircle2 } from "lucide-react";

import type { CompletionField, CompletionGroup, CompletionResult } from "@/lib/profileCompletion";

const GROUPS: Array<{ key: CompletionGroup; label: string }> = [
  { key: "identity", label: "Identity" },
  { key: "professional", label: "Professional" },
  { key: "preferences", label: "Preferences" },
  { key: "proof", label: "Proof" },
];

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const GAP = 1.2; // percentage points left blank between segments

type Props = CompletionResult & {
  /** Jump to (and focus) the editor control for a checklist item. */
  onSelectField: (key: string) => void;
  /** Shown once the candidate can apply. */
  onBrowseJobs?: () => void;
  headingId: string;
  /** "live" while recomputed from unsaved edits; the server still decides. */
  live?: boolean;
};

/**
 * Segmented completion ring + point-valued checklist (audit §6.2).
 * Colour is never the only cue: the score, the threshold and "Ready to apply"
 * are always stated in text (WCAG 1.4.1).
 */
const ProfileCompletionCard = ({ score, threshold, canApply, fields, onSelectField, onBrowseJobs, headingId, live }: Props) => {
  const ready = canApply;
  const tone = score >= threshold ? "#15803d" : "#b45309";

  const groups = GROUPS.map(({ key, label }) => {
    const items = fields.filter((field) => field.group === key);
    return {
      key,
      label,
      max: items.reduce((sum, field) => sum + field.weight, 0),
      earned: items.reduce((sum, field) => sum + field.points, 0),
    };
  });

  let offset = 0;
  const arcs = groups.map((group) => {
    const start = offset;
    offset += group.max;
    const length = Math.max(0, group.max - GAP);
    return { ...group, start, length, filled: group.max ? (group.earned / group.max) * length : 0 };
  });

  // Anything still worth points, required first, biggest gain first.
  const todo = fields
    .filter((field) => field.points < field.weight)
    .sort((a, b) => Number(b.required) - Number(a.required) || b.weight - b.points - (a.weight - a.points));
  const required = todo.filter((field) => field.required && !field.satisfied);
  const boosts = todo.filter((field) => !(field.required && !field.satisfied));

  const arcProps = (start: number, length: number) => ({
    strokeDasharray: `${(length / 100) * CIRCUMFERENCE} ${CIRCUMFERENCE}`,
    strokeDashoffset: -(start / 100) * CIRCUMFERENCE,
  });
  const tickAngle = (threshold / 100) * 2 * Math.PI;

  const renderItem = (field: CompletionField) => {
    const gain = field.weight - field.points;
    const verb = field.satisfied ? "Improve" : "Add";
    return (
      <li key={field.key}>
        <button
          type="button"
          onClick={() => onSelectField(field.key)}
          className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#264a7f] dark:text-foreground dark:hover:bg-muted/40"
        >
          <span>
            {verb} {field.label.charAt(0).toLowerCase() + field.label.slice(1)}
          </span>
          <span className="shrink-0 font-semibold text-[#264a7f] dark:text-[#7da7df]">+{gain}%</span>
        </button>
      </li>
    );
  };

  return (
    <section
      aria-labelledby={headingId}
      className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.05)] dark:border-border dark:bg-card"
    >
      <h2 id={headingId} className="text-base font-bold text-slate-900 dark:text-foreground">
        Profile strength
      </h2>

      <div className="mt-4 flex flex-col items-center gap-5 sm:flex-row sm:items-start">
        <svg viewBox="0 0 120 120" className="h-36 w-36 shrink-0" role="img" aria-labelledby={`${headingId}-ring`}>
          <title id={`${headingId}-ring`}>
            {`Profile ${score}% complete. ${threshold}% needed to apply. ` +
              groups.map((g) => `${g.label} ${g.earned} of ${g.max}.`).join(" ")}
          </title>
          <g transform="rotate(-90 60 60)">
            {arcs.map((arc) => (
              <circle
                key={`${arc.key}-track`}
                cx="60"
                cy="60"
                r={RADIUS}
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="10"
                {...arcProps(arc.start, arc.length)}
              />
            ))}
            {arcs.map((arc) =>
              arc.filled > 0 ? (
                <circle
                  key={`${arc.key}-fill`}
                  cx="60"
                  cy="60"
                  r={RADIUS}
                  fill="none"
                  stroke={tone}
                  strokeWidth="10"
                  {...arcProps(arc.start, arc.filled)}
                />
              ) : null,
            )}
            {/* Threshold tick: the goal is visible, not just the number. */}
            <line
              x1={60 + (RADIUS - 9) * Math.cos(tickAngle)}
              y1={60 + (RADIUS - 9) * Math.sin(tickAngle)}
              x2={60 + (RADIUS + 9) * Math.cos(tickAngle)}
              y2={60 + (RADIUS + 9) * Math.sin(tickAngle)}
              stroke="#0f172a"
              strokeWidth="2"
            />
          </g>
          <text x="60" y="58" textAnchor="middle" className="fill-slate-900 text-[22px] font-bold dark:fill-white">
            {score}%
          </text>
          <text x="60" y="76" textAnchor="middle" className="fill-slate-500 text-[9px]">
            {threshold}% to apply
          </text>
        </svg>

        <div className="w-full min-w-0 flex-1">
          {/* Always rendered so score changes are announced politely (not on mount). */}
          <p role="status" className="text-sm font-semibold" style={{ color: tone }}>
            {ready ? (
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 size={16} aria-hidden="true" /> Ready to apply — {score}%
              </span>
            ) : (
              `${score}% — you need ${threshold}% and every required item to apply`
            )}
            {live ? <span className="sr-only"> (unsaved changes)</span> : null}
          </p>

          <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-muted-foreground">
            {groups.map((group) => (
              <li key={group.key}>
                {group.label}: {group.earned}/{group.max}
              </li>
            ))}
          </ul>

          {ready && onBrowseJobs ? (
            <button
              type="button"
              onClick={onBrowseJobs}
              className="mt-3 rounded-lg bg-[#15803d] px-3 py-2 text-sm font-semibold text-white"
            >
              You can now apply to any job — browse jobs
            </button>
          ) : null}

          {required.length > 0 && (
            <>
              <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Required to apply</h3>
              <ul className="mt-1 space-y-0.5">{required.map(renderItem)}</ul>
            </>
          )}
          {boosts.length > 0 && (
            <>
              <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Boost your profile</h3>
              <ul className="mt-1 space-y-0.5">{boosts.slice(0, 6).map(renderItem)}</ul>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default ProfileCompletionCard;
