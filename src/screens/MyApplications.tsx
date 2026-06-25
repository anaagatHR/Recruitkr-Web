"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Briefcase, Building2, Loader2, MessageCircle, Search } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link, useNavigate } from "@/compat/router";
import { getSession } from "@/lib/auth";
import { useServerEvents } from "@/hooks/useServerEvents";
import {
  ApplicationStatus,
  ConversationSummary,
  fetchConversations,
} from "@/lib/messages";

const POLL_MS = 20000;

const SSE_EVENTS = [
  "connected",
  "heartbeat",
  "message",
  "conversation-created",
  "application-updated",
  "presence",
];

const STATUS_LABELS: Record<Exclude<ApplicationStatus, "">, string> = {
  applied: "Applied",
  "under-review": "Under Review",
  screening: "Shortlisted",
  interview: "Interview",
  offer: "Offer",
  hired: "Hired",
  rejected: "Rejected",
};

const STATUS_CLASSES: Record<Exclude<ApplicationStatus, "">, string> = {
  applied:
    "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-600/40 dark:bg-slate-500/15 dark:text-slate-200",
  "under-review":
    "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/15 dark:text-sky-300",
  screening:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300",
  interview:
    "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/15 dark:text-violet-300",
  offer:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300",
  hired:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300",
  rejected:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-300",
};

const formatTime = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const sameDay = d.toDateString() === new Date().toDateString();
  return sameDay
    ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString([], { month: "short", day: "numeric" });
};

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "?";

const StatusBadge = ({ status }: { status: ApplicationStatus }) => {
  if (!status) return null;
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
        STATUS_CLASSES[status as Exclude<ApplicationStatus, "">] ||
        "border-slate-200 bg-slate-100 text-slate-700"
      }`}
    >
      {STATUS_LABELS[status as Exclude<ApplicationStatus, "">] || status.replace(/-/g, " ")}
    </span>
  );
};

const Logo = ({ name, url }: { name: string; url?: string }) =>
  url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={name}
      className="h-14 w-14 shrink-0 rounded-xl border border-border object-cover"
    />
  ) : (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg font-bold text-primary">
      {initialsOf(name)}
    </div>
  );

const MyApplications = () => {
  const navigate = useNavigate();
  const session = typeof window !== "undefined" ? getSession() : null;
  const myRole = session?.user.role;
  const isClient = myRole === "client";

  const [authChecked, setAuthChecked] = useState(false);
  const [items, setItems] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!session) {
      navigate("/login?redirect=/applications");
      return;
    }
    setAuthChecked(true);
  }, [navigate, session]);

  const load = useCallback(async () => {
    try {
      const list = await fetchConversations();
      setItems(list);
    } catch {
      /* keep what we have */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authChecked) return;
    void load();
    const id = window.setInterval(load, POLL_MS);
    return () => window.clearInterval(id);
  }, [authChecked, load]);

  // Refresh on any relevant real-time event (new message, status change, etc.).
  const onEvent = useCallback(() => void load(), [load]);
  useServerEvents({ enabled: authChecked, eventNames: SSE_EVENTS, onEvent });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((c) =>
      [
        isClient ? c.candidateName : c.companyName,
        c.jobTitle,
        c.lastMessage,
      ].some((v) => (v || "").toLowerCase().includes(q)),
    );
  }, [items, search, isClient]);

  const openChat = (id: string) => navigate(`/messages?c=${id}`);

  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={28} />
      </div>
    );
  }

  return (
<div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
    <Navbar />

    <main className="container mx-auto flex-1 px-4 pb-16 pt-24">
    <div className="mx-auto max-w-7xl">

        {/* Header */}
     <header className="mb-8 rounded-3xl border border-border/40 bg-card/60 p-6 backdrop-blur-xl shadow-sm">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {isClient ? "Applicants" : "My Applications"}
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            {isClient
              ? "Candidates who applied to your jobs. Tap a card to open the chat."
              : "Track your applications and chat with employers. Tap a card to open the chat."}
          </p>

          {/* Search */}
          <div className="relative mt-6">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={18}
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                isClient
                  ? "Search candidates or jobs..."
                  : "Search companies or jobs..."
              }
          className="w-full rounded-2xl border border-border/50 bg-background/70 backdrop-blur-xl py-3.5 pl-12 pr-4 text-sm shadow-lg transition-all focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none"
            />
          </div>
        </header>

        {/* Loading */}
        {loading ? (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <li
                key={i}
                className="rounded-3xl border border-border bg-card p-5 shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="skeleton h-16 w-16 rounded-2xl" />

                  <div className="flex-1 space-y-3">
                    <div className="skeleton h-4 w-3/4" />
                    <div className="skeleton h-3 w-1/2" />
                    <div className="skeleton h-3 w-2/3" />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center shadow-sm">
            <Briefcase
              className="mx-auto mb-4 text-muted-foreground"
              size={40}
            />

            <p className="text-sm text-muted-foreground">
              {search
                ? "No results match your search."
                : isClient
                ? "No applicants yet. They'll appear here once candidates apply."
                : "No applications yet. Apply to a job and it appears here with a chat."}
            </p>

            {!isClient && !search && (
              <Link
                to="/jobs"
                className="btn-gradient mt-5 inline-block rounded-xl px-5 py-2.5 text-sm font-semibold"
              >
                Browse Jobs
              </Link>
            )}
          </div>
        ) : (
        <ul className="space-y-4">
            {filtered.map((c) => {
              const title = isClient
                ? c.candidateName || "Candidate"
                : c.companyName || "Employer";

              const logoUrl = isClient
                ? c.withPhotoUrl
                : c.companyLogoUrl;

              return (
                <li key={c.id}>
                  <button
                    onClick={() => openChat(c.id)}
                 className="group relative flex w-full items-center gap-5 overflow-hidden rounded-[30px] border border-white/10 bg-card/70 backdrop-blur-xl p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_20px_60px_rgba(0,0,0,0.15)]"
                  >
                    {/* Avatar */}
                   <div className="relative z-10 shrink-0">
                      <Logo name={title} url={logoUrl} />

                      {c.online && (
                    <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-background bg-green-500 animate-pulse shadow-[0_0_15px_rgba(34,197,94,0.8)]" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                 <h3 className="truncate text-lg font-bold text-foreground">
                          {title}
                        </h3>

                        <span className="shrink-0 text-[11px] text-muted-foreground">
                          {formatTime(c.lastMessageAt)}
                        </span>
                      </div>

                      {c.jobTitle && (
                        <div className="mt-1 flex items-center gap-1 text-sm text-primary">
                          <Building2
                            size={14}
                            className="shrink-0"
                          />
                          <span className="truncate">
                            {c.jobTitle}
                          </span>
                        </div>
                      )}

                      <div className="mt-3 flex items-start gap-2">
                        <MessageCircle
                          size={14}
                          className="mt-0.5 shrink-0 text-muted-foreground"
                        />

                       <p className="truncate text-sm text-muted-foreground">
                          {c.lastSenderRole === "system"
                            ? "📋 "
                            : ""}
                          {c.lastMessage || "Open chat"}
                        </p>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <StatusBadge status={c.status} />

                        {c.online && (
                     <span className="rounded-full bg-green-500/10 px-2 py-1 text-[11px] font-semibold text-green-500">
                            Online
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Unread Badge */}
                    {c.unread > 0 && (
                  <span className="absolute right-5 top-5 flex h-7 min-w-7 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-violet-600 px-2 text-xs font-bold text-white shadow-lg">
                        {c.unread}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
 
      <Footer />
    </div>
  );
};

export default MyApplications;
