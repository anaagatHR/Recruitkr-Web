"use client";

import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "@/compat/router";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  CalendarClock,
  Clock3,
  Flame,
  Lock,
  MapPin,
  Share2,
  Users,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import JobDescription from "@/components/job/JobDescription";
import StarRating from "@/components/job/StarRating";
import { applyToJobRequest, daysUntilDeadline, displayCompany, fetchJob, isExpired, pluralize, type Job } from "@/lib/jobs";
import { relativeTime, salaryLabel, isFresh } from "@/lib/format";
import { getSession } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

export default function JobDetailScreen({ initialJob = null }: { initialJob?: Job | null }) {
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  // Seeded from the server render so the job is in the first paint (and in the
  // HTML crawlers read) instead of appearing after a client fetch.
  const [job, setJob] = useState<Job | null>(initialJob);
  const [loading, setLoading] = useState(!initialJob);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  const initialJobId = initialJob?.id;

  useEffect(() => {
    // The server already resolved this exact job — refetching would only
    // re-render identical data. A client-side hop to a different job leaves the
    // ids mismatched, so that still fetches.
    if (initialJobId && initialJobId === params.id) {
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    fetchJob(params.id).then((j) => {
      if (active) {
        setJob(j);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [params.id, initialJobId]);

  const handleApply = async () => {
    const session = getSession();
    if (!session) {
      // Apply requires login. Send them to login and bring them back here.
      navigate(`/login?redirect=${encodeURIComponent(`/jobs/${params.id}`)}`);
      return;
    }
    setApplying(true);
    try {
      await applyToJobRequest(params.id);
      setApplied(true);
      toast({ title: "Application submitted", description: "We've shared your profile with the employer." });
    } catch (err) {
      const { status, code } = (err as { status?: number; code?: string }) ?? {};
      if (code === "ALREADY_APPLIED") {
        setApplied(true);
        toast({ title: "Already applied", description: "You've already applied to this job." });
        return;
      }
      if (code === "PROFILE_INCOMPLETE") {
        toast({
          title: "Complete your profile to apply",
          description: "Employers need your name, phone, skills and resume. Finish your profile, then apply.",
        });
        navigate("/dashboard/candidate?tab=profile");
        return;
      }
      // Session expired / not authenticated — send them to log in, then back here.
      if (status === 401) {
        navigate(`/login?redirect=${encodeURIComponent(`/jobs/${params.id}`)}`);
        return;
      }
      // Only candidates can apply (e.g. a client/employer account is signed in).
      if (status === 403) {
        toast({
          variant: "destructive",
          title: "Candidate account required",
          description: "Sign in with a candidate account to apply for jobs.",
        });
        return;
      }
      // Surface the real failure instead of pretending the application went through.
      toast({
        variant: "destructive",
        title: "Couldn't submit application",
        description: (err as { message?: string })?.message || "Please try again in a moment.",
      });
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main id="main">
        <div className="container mx-auto px-4 pt-28">
          <div className="h-72 animate-pulse rounded-2xl border border-border bg-muted/50" />
        </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main id="main">
        <div className="container mx-auto px-4 pb-20 pt-32 text-center">
          <h1 className="font-heading text-2xl font-bold">Job not found</h1>
          <Link to="/jobs" className="mt-4 inline-block text-primary hover:underline">
            Browse all jobs
          </Link>
        </div>
        </main>
        <Footer />
      </div>
    );
  }

  const loggedIn = Boolean(getSession());
  const company = displayCompany(job);
  const hasCompany = Boolean(job.company?.trim());
  const expired = isExpired(job) || job.canApply === false;
  const closesIn = daysUntilDeadline(job);
  // Social proof only when it IS proof. "0 applicants" read as "nobody wants
  // this job" on every listing (the audit's #5); the fire emoji on 0 was worse.
  const applicants = job.applicants ?? 0;
  const socialProof =
    applicants >= 20
      ? `🔥 ${applicants} applicants · posted ${relativeTime(job.postedAt)}`
      : applicants >= 5
        ? `${applicants} applicants · posted ${relativeTime(job.postedAt)}`
        : `Be among the first to apply · posted ${relativeTime(job.postedAt)}`;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main id="main">
      <div className="container mx-auto max-w-5xl px-4 pb-20 pt-24">
        {/* min-h-[44px] is the touch target, not the text size: this rendered
            20px tall, under the 24px WCAG 2.5.8 minimum and well under the 44px
            comfortable size. The margin drops from 6 to 3 so the extra height
            is absorbed and the gap below the link looks unchanged. */}
        <Link
          to="/jobs"
          className="mb-3 inline-flex min-h-[44px] items-center gap-2 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft size={16} /> Back to jobs
        </Link>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Main */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex flex-wrap items-center gap-2">
                {isFresh(job.postedAt) && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-secondary/15 px-2.5 py-0.5 text-xs font-semibold text-secondary">
                    <Clock3 size={12} /> New today
                  </span>
                )}
                {job.applicants >= 40 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-600">
                    <Flame size={12} /> High demand
                  </span>
                )}
              </div>
              <h1 className="mt-3 font-heading text-2xl font-bold sm:text-3xl">{job.title}</h1>
              {job.companyId ? (
                <Link
                  to={`/companies/${job.companyId}`}
                  className="mt-1 inline-flex items-center gap-2 text-base text-muted-foreground hover:text-primary"
                >
                  <Building2 size={16} /> {company}
                </Link>
              ) : (
                <p className={`mt-1 inline-flex items-center gap-2 text-base text-muted-foreground ${hasCompany ? "" : "italic"}`}>
                  <Building2 size={16} /> {company}
                  {!hasCompany && (
                    <span className="not-italic text-xs text-muted-foreground/80">(employer name shared after shortlisting)</span>
                  )}
                </p>
              )}
              {job.companyRating != null && <StarRating value={job.companyRating} className="mt-2" />}

              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5"><MapPin size={15} /> {job.location}</span>
                <span className="inline-flex items-center gap-1.5"><Briefcase size={15} /> {job.experience}</span>
                <span className="inline-flex items-center gap-1.5"><Users size={15} /> {pluralize(job.openings, "opening")}</span>
                {closesIn !== undefined && (
                  <span className={`inline-flex items-center gap-1.5 ${expired ? "text-rose-600" : closesIn <= 7 ? "text-rose-600" : ""}`}>
                    <CalendarClock size={15} />
                    {expired
                      ? "Applications closed"
                      : closesIn === 0
                        ? "Closes today"
                        : `Closes in ${pluralize(closesIn, "day")}`}
                  </span>
                )}
                <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-foreground/80">{job.type}</span>
                <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-foreground/80">{job.workMode}</span>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="font-heading text-lg font-bold">Job description</h2>
              {job.description ? (
                <JobDescription text={job.description} className="mt-3" />
              ) : (
                <p className="mt-3 text-sm italic leading-relaxed text-muted-foreground">
                  The employer hasn&apos;t added a detailed description yet. Apply and the recruiter will
                  share the full role details with you.
                </p>
              )}
              {job.skills.length > 0 && (
                <>
                  <h3 className="mt-6 font-semibold text-foreground">Key skills</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {job.skills.map((s) => (
                      <span key={s} className="rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-foreground/80">
                        {s}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Sidebar / Apply */}
          <aside className="space-y-4 lg:sticky lg:top-24 lg:h-fit">
            <div className="rounded-2xl border border-border bg-card p-6">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Salary</p>
              <p className="mt-1 text-xl font-bold text-foreground">{salaryLabel(job.salaryMin, job.salaryMax)}</p>

              <div
                className={`mt-4 rounded-xl px-3 py-2 text-sm font-medium ${
                  applicants >= 20 ? "bg-orange-50 text-orange-700" : "bg-muted text-muted-foreground"
                }`}
              >
                {socialProof}
              </div>

              {expired ? (
                <div className="mt-4 rounded-xl bg-muted px-4 py-3 text-center text-sm font-semibold text-muted-foreground">
                  This opening is no longer accepting applications.
                  <Link to="/jobs" className="mt-1 block text-xs font-medium text-primary hover:underline">
                    See similar open roles →
                  </Link>
                </div>
              ) : applied ? (
                <div className="mt-4 rounded-xl bg-secondary/10 px-4 py-3 text-center text-sm font-semibold text-secondary">
                  ✓ Application submitted
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={applying}
                  className="btn-gradient mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold transition hover:scale-[1.02] disabled:opacity-60"
                >
                  {!loggedIn && <Lock size={15} />}
                  {applying ? "Submitting..." : loggedIn ? "Apply now" : "Sign in to apply"}
                </button>
              )}

              {!loggedIn && !expired && (
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  Free for job seekers &middot; takes under a minute.{" "}
                  <Link
                    to={`/signup?redirect=${encodeURIComponent(`/jobs/${params.id}`)}`}
                    className="font-medium text-primary hover:underline"
                  >
                    Create an account
                  </Link>
                </p>
              )}

              <button
                type="button"
                onClick={() => {
                  if (typeof navigator !== "undefined" && navigator.share) {
                    void navigator.share({ title: job.title, url: window.location.href });
                  }
                }}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                <Share2 size={15} /> Share job
              </button>
            </div>
          </aside>
        </div>
      </div>
      </main>
      <Footer />
    </div>
  );
}
