"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, MapPin, Users } from "lucide-react";
import { useNavigate } from "@/compat/router";
import { cn } from "@/lib/utils";
import SearchBar from "@/components/search/SearchBar";
import CandidateCard from "@/components/search/CandidateCard";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  fetchCandidateSuggestions,
  searchCandidates,
  startDirectChat,
  type CandidateFacets,
  type CandidateResult,
  type SearchMeta,
} from "@/lib/search";

const PAGE_SIZE = 12;
const EXPERIENCE_OPTIONS = [
  { value: "", label: "All" },
  { value: "fresher", label: "Fresher" },
  { value: "experienced", label: "Experienced" },
];

type CandidateSearchProps = {
  /** When provided, opening a chat is handled in-dashboard; otherwise we route to /messages. */
  onOpenChat?: (conversationId: string) => void;
  className?: string;
};

const CardSkeleton = () => (
  <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
    <div className="flex items-start gap-4">
      <div className="skeleton h-14 w-14 rounded-2xl" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-4 w-2/3 rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
        <div className="skeleton h-3 w-1/3 rounded" />
      </div>
      <div className="skeleton h-12 w-12 rounded-full" />
    </div>
    <div className="mt-4 flex gap-1.5">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="skeleton h-5 w-14 rounded-full" />
      ))}
    </div>
    <div className="skeleton mt-4 h-10 w-full rounded-xl" />
  </div>
);

export default function CandidateSearch({ onOpenChat, className }: CandidateSearchProps) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [experience, setExperience] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [location, setLocation] = useState("");

  const [candidates, setCandidates] = useState<CandidateResult[]>([]);
  const [facets, setFacets] = useState<CandidateFacets>({ skills: [], experience: [] });
  const [meta, setMeta] = useState<SearchMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [messagingId, setMessagingId] = useState<string | null>(null);

  const debouncedQ = useDebouncedValue(q, 300);
  const debouncedLocation = useDebouncedValue(location, 300);
  const reqId = useRef(0);
  const skillsParam = skills.join(",");

  const runSearch = useCallback(
    async (page: number, append: boolean) => {
      const myReq = ++reqId.current;
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError("");
      try {
        const res = await searchCandidates({
          q: debouncedQ,
          experience,
          skills: skillsParam,
          location: debouncedLocation,
          page,
          limit: PAGE_SIZE,
        });
        if (myReq !== reqId.current) return; // a newer search superseded this one
        setMeta(res.meta);
        if (res.facets.skills.length || res.facets.experience.length) setFacets(res.facets);
        setCandidates((prev) => (append ? [...prev, ...res.candidates] : res.candidates));
      } catch {
        if (myReq === reqId.current) setError("Couldn't load candidates. Please try again.");
      } finally {
        if (myReq === reqId.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [debouncedQ, experience, skillsParam, debouncedLocation],
  );

  // Re-run from page 1 whenever any filter changes (instant search).
  useEffect(() => {
    void runSearch(1, false);
  }, [runSearch]);

  const toggleSkill = (skill: string) =>
    setSkills((prev) => (prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]));

  const handleMessage = async (candidate: CandidateResult) => {
    setMessagingId(candidate.id);
    setError("");
    try {
      const conv = await startDirectChat(candidate.id);
      if (onOpenChat) onOpenChat(conv.id);
      else navigate(`/messages?c=${conv.id}`);
    } catch {
      setError("Couldn't start the chat. Please try again.");
    } finally {
      setMessagingId(null);
    }
  };

  const canLoadMore = meta ? meta.page < meta.totalPages : false;

  return (
    <div className={cn("w-full", className)}>
      {/* Search + filters */}
      <div className="space-y-4">
        <SearchBar
          value={q}
          onChange={setQ}
          fetchSuggestions={fetchCandidateSuggestions}
          placeholder="Search candidates by name, skill, or role…"
        />

        <div className="flex flex-wrap items-center gap-2">
          {EXPERIENCE_OPTIONS.map((opt) => (
            <button
              key={opt.value || "all"}
              type="button"
              onClick={() => setExperience(opt.value)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition",
                experience === opt.value
                  ? "border-transparent bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {opt.label}
            </button>
          ))}

          <div className="relative ml-auto w-full sm:w-56">
            <MapPin
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={15}
            />
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Location"
              className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* Skill facets */}
        {facets.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {facets.skills.slice(0, 12).map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => toggleSkill(f.value)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[11px] font-medium transition",
                  skills.includes(f.value)
                    ? "border-transparent bg-primary/15 text-primary"
                    : "border-border bg-muted/30 text-muted-foreground hover:text-foreground",
                )}
              >
                {f.value} <span className="opacity-60">{f.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Result count */}
      {!loading && meta && (
        <p className="mt-5 text-sm text-muted-foreground">
          {meta.total} candidate{meta.total === 1 ? "" : "s"}
          {meta.engine === "mongo" && <span className="ml-2 opacity-60">(search index offline)</span>}
        </p>
      )}

      {error && (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      {/* Results */}
      {loading ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : candidates.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <Users className="mx-auto mb-4 text-muted-foreground" size={40} />
          <p className="text-sm text-muted-foreground">No candidates match your filters yet.</p>
        </div>
      ) : (
        <>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {candidates.map((candidate) => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                onMessage={handleMessage}
                messaging={messagingId === candidate.id}
              />
            ))}
          </div>

          {canLoadMore && (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                disabled={loadingMore}
                onClick={() => meta && runSearch(meta.page + 1, true)}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted disabled:opacity-60"
              >
                {loadingMore && <Loader2 size={15} className="animate-spin" />}
                Load more
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
