"use client";

import { useEffect, useState } from "react";
import { Link, useParams } from "@/compat/router";
import { ArrowLeft, BadgeCheck, Building2, MapPin } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import StarRating from "@/components/job/StarRating";
import JobCard from "@/components/job/JobCard";
import { fetchCompanies, fetchJobs, type Company, type Job } from "@/lib/jobs";

export default function CompanyDetailScreen() {
  const params = useParams<{ id: string }>();
  const [company, setCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([fetchCompanies(), fetchJobs()]).then(([{ companies }, { jobs }]) => {
      if (!active) return;
      setCompany(companies.find((c) => c.id === params.id) ?? null);
      setJobs(jobs.filter((j) => j.companyId === params.id));
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [params.id]);

  if (!loading && !company) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pb-20 pt-32 text-center">
          <h1 className="font-heading text-2xl font-bold">Company not found</h1>
          <Link to="/jobs" className="mt-4 inline-block text-primary hover:underline">
            Browse all jobs
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto max-w-5xl px-4 pb-20 pt-24">
        <Link to="/jobs" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft size={16} /> Back to jobs
        </Link>

        {loading || !company ? (
          <div className="h-40 animate-pulse rounded-2xl border border-border bg-muted/50" />
        ) : (
          <>
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-muted text-2xl font-bold text-primary">
                  {(company.name?.trim().charAt(0) || "?").toUpperCase()}
                </div>
                <div>
                  <h1 className="flex items-center gap-2 font-heading text-2xl font-bold">
                    {company.name}
                    {company.verified && <BadgeCheck size={20} className="text-secondary" />}
                  </h1>
                  <p className="text-sm text-muted-foreground">{company.sector}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-4">
                    <StarRating value={company.rating} reviews={company.reviews} />
                    <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin size={14} /> {company.location}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                      <Building2 size={14} /> {company.openJobs} open jobs
                    </span>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{company.description}</p>
            </div>

            <h2 className="mb-4 mt-10 font-heading text-xl font-bold">Open positions</h2>
            {jobs.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">
                No live openings listed right now. Check back soon.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {jobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
