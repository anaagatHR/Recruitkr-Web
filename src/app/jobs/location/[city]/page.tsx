import type { Metadata } from "next";
import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import JobCard from "@/components/job/JobCard";
import { buildMetadata } from "@/lib/seo";
import { fetchAllJobs, isOpen, jobPath, pluralize, type Job } from "@/lib/jobs";
import { CITIES, cityHeading, cityPath, getCity, matchCity, MIN_INDEXABLE_CITY_ROLES, type City } from "@/lib/locations";
import { services } from "@/lib/services";

/**
 * Served at /jobs-in-<city> via the rewrite in next.config.mjs; this route's
 * own URL (/jobs/location/<city>) 301s there, so it never competes with it.
 */
export const revalidate = 600;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.recruitkr.com";
const MAX_LISTED = 30;

type Props = { params: Promise<{ city: string }> | { city: string } };

const cityOf = async (params: Props["params"]) => getCity((await Promise.resolve(params))?.city || "");

/** Open jobs, fetched once per request for both metadata and page. */
const loadOpenJobs = cache(async (): Promise<Job[]> => {
  try {
    const { jobs, live } = await fetchAllJobs();
    // Seed fallback jobs are fictional; never list them as real openings.
    return live ? jobs.filter(isOpen) : [];
  } catch {
    return []; // backend down: the page still renders its city content
  }
});

const cityRoles = async (city: City) => matchCity(await loadOpenJobs(), city);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const city = await cityOf(params);
  if (!city) return {};
  return buildMetadata({
    // Bare title: the root layout template appends "| RecruitKr" exactly once.
    title: `${cityHeading(city)} — Verified Openings`,
    description: `${cityHeading(city)} on RecruitKr: openings in ${city.sectors
      .slice(0, 3)
      .join(", ")
      .toLowerCase()} and more. Apply free with verified employers.`,
    path: cityPath(city.slug),
    // Too few real roles and the page is mostly shared boilerplate: keep it
    // crawlable (footer-linked, `follow`) but out of the index until the city
    // has substance. Flips back automatically as jobs are posted. The sitemap
    // applies the same threshold.
    noindex: (await cityRoles(city)).length < MIN_INDEXABLE_CITY_ROLES,
  });
}

export default async function Page({ params }: Props) {
  const city = await cityOf(params);
  if (!city) notFound();

  const open = await loadOpenJobs();
  const matched = await cityRoles(city);
  const listed = matched.slice(0, MAX_LISTED);
  // An empty city still links to real jobs, so the page is never a dead end —
  // but below the city's own content, never as the main thing on the page.
  const fallback = matched.length ? [] : open.slice(0, 6);
  const heading = cityHeading(city);

  // Only real listings for this city; never the cross-site fallback.
  const itemList = listed.length
    ? {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: heading,
        numberOfItems: listed.length,
        itemListElement: listed.map((job, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: `${SITE_URL}${jobPath(job)}`,
          name: job.title,
        })),
      }
    : null;

  const relatedServices = services.filter((s) => s.cities.includes(city.slug)).slice(0, 4);

  const openings = (listed.length > 0 || fallback.length > 0) && (
    <section aria-labelledby="openings" className="container mx-auto px-4 py-10">
      <h2 id="openings" className="text-xl font-bold">
        {listed.length ? "Current openings" : "Latest openings across RecruitKr"}
      </h2>
      {!listed.length && (
        <p className="mt-1 text-sm text-muted-foreground">These roles are in other cities or open to candidates anywhere.</p>
      )}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(listed.length ? listed : fallback).map((job) => (
          <JobCard key={job.id} job={job} headingLevel={3} />
        ))}
      </div>
      <p className="mt-6 text-sm">
        <Link href="/jobs" className="font-semibold text-primary hover:underline">
          Browse all jobs on RecruitKr →
        </Link>
      </p>
    </section>
  );

  const market = (
    <section aria-labelledby="market" className="border-t border-border bg-muted/10">
      <div className="container mx-auto grid gap-10 px-4 py-12 lg:grid-cols-[1fr_320px]">
        <div className="max-w-3xl space-y-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
          <h2 id="market" className="text-xl font-bold text-foreground">
            {city.slug === "remote" ? "About remote jobs" : `Hiring in ${city.name}`}
          </h2>
          {city.intro.map((p) => (
            <p key={p}>{p}</p>
          ))}
          <h3 className="pt-2 text-base font-semibold text-foreground">
            {city.slug === "remote" ? "Common remote roles" : `Sectors we hire for in ${city.name}`}
          </h3>
          <ul className="flex flex-wrap gap-2">
            {city.sectors.map((sector) => (
              <li key={sector} className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground/80">
                {sector}
              </li>
            ))}
          </ul>
        </div>

        <aside className="space-y-6 text-sm">
          {relatedServices.length > 0 && (
            <div>
              <h2 className="font-semibold text-foreground">For employers</h2>
              <ul className="mt-2 space-y-1.5">
                {relatedServices.map((s) => (
                  <li key={s.id}>
                    <Link href={`/services/${s.id}`} className="text-primary hover:underline">
                      {s.cardTitle}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div>
            <h2 className="font-semibold text-foreground">Nearby and related cities</h2>
            <ul className="mt-2 space-y-1.5">
              {city.nearby.map((slug) => {
                const other = CITIES.find((c) => c.slug === slug);
                return other ? (
                  <li key={slug}>
                    <Link href={cityPath(slug)} className="text-primary hover:underline">
                      {cityHeading(other)}
                    </Link>
                  </li>
                ) : null;
              })}
            </ul>
          </div>
        </aside>
      </div>
    </section>
  );

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {itemList && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />
      )}
      <Navbar />

      <main id="main" className="flex-grow pt-16 sm:pt-20">
        <section className="border-b border-border bg-muted/20 py-12">
          <div className="container mx-auto px-4">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <MapPin size={13} aria-hidden /> {city.name === "Remote" ? "Work from anywhere" : `${city.name}, ${city.region}`}
            </span>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">{heading}</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
              {matched.length
                ? `${pluralize(matched.length, "open role")} from verified employers. Applying is always free.`
                : `No open roles in ${city.name} right now. New openings are added every week.`}
            </p>
          </div>
        </section>

        {/* A city with roles leads with them; an empty one leads with its own
            market content and shows the cross-site fallback after it. */}
        {matched.length ? (
          <>
            {openings}
            {market}
          </>
        ) : (
          <>
            {market}
            {openings}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
