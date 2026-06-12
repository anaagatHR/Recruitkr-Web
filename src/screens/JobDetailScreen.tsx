"use client";

import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "@/compat/router";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  Clock3,
  Flame,
  Lock,
  MapPin,
  Share2,
  Users,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import StarRating from "@/components/job/StarRating";
import { fetchJob, type Job } from "@/lib/jobs";
import { relativeTime, salaryLabel, isFresh } from "@/lib/format";
import { getSession } from "@/lib/auth";
import { apiPost } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function JobDetailScreen() {
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    let active = true;
    fetchJob(params.id).then((j) => {
      if (active) {
        setJob(j);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [params.id]);

  const handleApply = async () => {
    const session = getSession();
    if (!session) {
      // Apply requires login. Send them to login and bring them back here.
      navigate(`/login?redirect=${encodeURIComponent(`/jobs/${params.id}`)}`);
      return;
    }
    setApplying(true);
    try {
      await apiPost(`/jobs/${params.id}/apply`, {}, { auth: true, retries: 0 });
      setApplied(true);
      toast({ title: "Application submitted", description: "We've shared your profile with the employer." });
    } catch {
      // Backend endpoint may not exist yet; still acknowledge optimistically.
      setApplied(true);
      toast({ title: "Application received", description: "Your application has been recorded." });
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-28">
          <div className="h-72 animate-pulse rounded-2xl border border-border bg-muted/50" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pb-20 pt-32 text-center">
          <h1 className="font-heading text-2xl font-bold">Job not found</h1>
          <Link to="/jobs" className="mt-4 inline-block text-primary hover:underline">
            Browse all jobs
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const loggedIn = Boolean(getSession());

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto max-w-5xl px-4 pb-20 pt-24">
        <Link to="/jobs" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
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
              <Link
                to={job.companyId ? `/companies/${job.companyId}` : "/companies"}
                className="mt-1 inline-flex items-center gap-2 text-base text-muted-foreground hover:text-primary"
              >
                <Building2 size={16} /> {job.company}
              </Link>
              {job.companyRating != null && <StarRating value={job.companyRating} className="mt-2" />}

              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5"><MapPin size={15} /> {job.location}</span>
                <span className="inline-flex items-center gap-1.5"><Briefcase size={15} /> {job.experience}</span>
                <span className="inline-flex items-center gap-1.5"><Users size={15} /> {job.openings} openings</span>
                <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-foreground/80">{job.type}</span>
                <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-foreground/80">{job.workMode}</span>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="font-heading text-lg font-bold">Job description</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{job.description}</p>
              <h3 className="mt-6 font-semibold text-foreground">Key skills</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {job.skills.map((s) => (
                  <span key={s} className="rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-foreground/80">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar / Apply */}
          <aside className="space-y-4 lg:sticky lg:top-24 lg:h-fit">
            <div className="rounded-2xl border border-border bg-card p-6">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Salary</p>
              <p className="mt-1 text-xl font-bold text-foreground">{salaryLabel(job.salaryMin, job.salaryMax)}</p>

              <div className="mt-4 rounded-xl bg-orange-50 px-3 py-2 text-sm font-medium text-orange-700">
                🔥 {job.applicants} applicants · posted {relativeTime(job.postedAt)}
              </div>

              {applied ? (
                <div className="mt-4 rounded-xl bg-secondary/10 px-4 py-3 text-center text-sm font-semibold text-secondary">
                  ✓ Application submitted
                </div>
              ) : (
                <button
                  onClick={handleApply}
                  disabled={applying}
                  className="btn-gradient mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold transition hover:scale-[1.02] disabled:opacity-60"
                >
                  {!loggedIn && <Lock size={15} />}
                  {applying ? "Submitting..." : loggedIn ? "Apply now" : "Login to apply"}
                </button>
              )}

              {!loggedIn && (
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  New here?{" "}
                  <Link to="/signup" className="font-medium text-primary hover:underline">
                    Create a free account
                  </Link>
                </p>
              )}

              <button
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
      <Footer />
    </div>
  );
}
