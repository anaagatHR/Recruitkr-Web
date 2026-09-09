import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Search } from "lucide-react";
import { fetchJobs } from "@/lib/jobs";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import JobCard from "@/components/job/JobCard";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.recruitkr.com";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Inline clean function: Zero dependency, never crashes
function getCleanCity(slug: string): string {
  if (!slug) return "All India";
  const decoded = decodeURIComponent(slug).replace(/^jobs-in-/, "").replace(/-/g, " ");
  return decoded.charAt(0).toUpperCase() + decoded.slice(1);
}

export async function generateMetadata({
  params,
}: {
  params: any;
}): Promise<Metadata> {
  const resolved = await Promise.resolve(params);
  const cityParam = resolved?.city || "";
  const cityName = getCleanCity(cityParam);

  return {
    title: `Jobs in ${cityName} — Verified Openings | RecruitKr`,
    description: `Find latest verified job openings and career vacancies in ${cityName}. Apply online for free on RecruitKr.`,
    alternates: {
      canonical: `${SITE_URL}/jobs/location/${cityParam.toLowerCase()}`,
    },
  };
}

export default async function Page({
  params,
}: {
  params: any;
}) {
  const resolved = await Promise.resolve(params);
  const cityParam = resolved?.city || "";
  const cityName = getCleanCity(cityParam);

  let cityJobs: any[] = [];

  try {
    const res = await fetchJobs();
    const allJobs = Array.isArray(res?.jobs) ? res.jobs : (Array.isArray(res) ? res : []);
    
    // Pure inline case-insensitive match
    const target = cityName.toLowerCase();
    cityJobs = allJobs.filter((job: any) => {
      const loc = String(job?.city || job?.location || "").toLowerCase();
      return loc.includes(target) || target.includes(loc);
    });
  } catch (err) {
    console.error("Fetch error on location page:", err);
    cityJobs = [];
  }

  const popularLocations = [
    { name: "Jaipur", slug: "jaipur" },
    { name: "Jodhpur", slug: "jodhpur" },
    { name: "Kota", slug: "kota" },
    { name: "Udaipur", slug: "udaipur" },
    { name: "Ajmer", slug: "ajmer" },
    { name: "Bhilwara", slug: "bhilwara" },
    { name: "Delhi NCR", slug: "delhi" },
    { name: "Mumbai", slug: "mumbai" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <section className="border-b border-border bg-muted/20 py-12">
        <div className="container mx-auto px-4">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium">
            <MapPin size={13} /> {cityName}
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Jobs in {cityName}
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground text-sm sm:text-base">
            {cityJobs.length > 0
              ? `Currently showing ${cityJobs.length} verified opening${cityJobs.length === 1 ? "" : "s"} in ${cityName}.`
              : `We are actively onboarding employers in ${cityName}. Explore openings across India or check back soon.`}
          </p>
          <div className="mt-6">
            <Link
              href="/jobs"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow hover:opacity-90 transition"
            >
              <Search size={16} /> Search all jobs
            </Link>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10">
        {cityJobs.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cityJobs.map((job: any) => (
              <JobCard key={job.id || job._id} job={job} headingLevel={2} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-10 text-center max-w-lg mx-auto shadow-sm">
            <p className="text-muted-foreground font-medium">
              No active openings listed in {cityName} right now.
            </p>
            <Link
              href="/jobs"
              className="mt-4 inline-block text-sm font-semibold text-primary underline underline-offset-4"
            >
              Browse all live jobs
            </Link>
          </div>
        )}
      </section>

      <section className="container mx-auto px-4 pb-14">
        <h2 className="text-lg font-bold mb-4">Jobs in other locations</h2>
        <div className="flex flex-wrap gap-2">
          {popularLocations.map((loc) => (
            <Link
              key={loc.slug}
              href={`/jobs/location/${loc.slug}`}
              className="rounded-full border border-border px-4 py-1.5 text-xs font-medium text-muted-foreground hover:border-primary hover:text-primary transition"
            >
              Jobs in {loc.name}
            </Link>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
