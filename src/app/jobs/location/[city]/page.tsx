import type { Metadata } from "next";
import { MapPin, Search } from "lucide-react";
import { buildMetadata } from "@/lib/seo";
import { fetchJobs } from "@/lib/jobs";
import { CITIES, citySlug, cityFromSlug, matchCity } from "@/lib/locations";
import { Link } from "@/compat/router";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import JobCard from "@/components/job/JobCard";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.recruitkr.com";

/** Pre-render the curated cities; other cities are still served on demand. */
export function generateStaticParams() {
  return CITIES.map((c) => ({ city: citySlug(c) }));
}

/** Keep the opening count fresh without rebuilding the site. */
export const revalidate = 600;

export async function generateMetadata({ params }: { params: { city: string } }): Promise<Metadata> {
  const city = cityFromSlug(params.city);
  const { jobs, live } = await fetchJobs();
  const count = live ? matchCity(jobs, city).length : null;

  /**
   * A city page with no openings is a doorway page: same layout, same copy,
   * nothing a searcher wants. Eleven of them (every city except Jaipur, which
   * is the only place jobs are currently posted) is enough thin content to drag
   * the whole domain down, so they are kept out of the index until they have
   * something to show.
   *
   * `live` guards against a backend outage — `fetchJobs` answers with seed data
   * when the API is unreachable, and noindexing a real city page because of a
   * transient failure is far more costly than briefly indexing an empty one.
   */
  const noindex = count === 0;

  // Every competitor ranking for "jobs in <city>" leads with the count
  // ("7,312+ Vacancies"). It is the clearest relevance and freshness signal
  // available in a title, and it is real data rather than a guess.
  const title = count ? `Jobs in ${city} — ${count} Verified Opening${count === 1 ? "" : "s"}` : `Jobs in ${city}`;

  return buildMetadata({
    title,
    description: count
      ? `${count} verified job opening${count === 1 ? "" : "s"} in ${city} across IT, healthcare, finance, sales and retail. Browse salaries and apply free on RecruitKr.`
      : `Find the latest verified job openings in ${city}. Browse roles across IT, healthcare, finance, sales, retail and more. Apply free on RecruitKr.`,
    path: `/jobs-in-${params.city}`,
    keywords: [`jobs in ${city}`, `${city} jobs`, `vacancies in ${city}`, `careers in ${city}`, `hiring in ${city}`, `${city} job openings`],
    noindex,
  });
}

export default async function Page({ params }: { params: { city: string } }) {
  const city = cityFromSlug(params.city);
  const { jobs } = await fetchJobs();
  const cityJobs = matchCity(jobs, city);

  // ItemList JSON-LD helps Google discover and group the city's job pages.
  const itemListLd = {
    "@context": "https://schema.org/",
    "@type": "ItemList",
    name: `Jobs in ${city}`,
    itemListElement: cityJobs.map((job, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/jobs/${job.id}`,
      name: `${job.title} at ${job.company}`,
    })),
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {cityJobs.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }}
        />
      )}

      <section className="border-b border-border bg-gradient-to-b from-primary/5 to-transparent">
        <div className="container mx-auto px-4 py-12">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <MapPin size={13} /> {city}
          </span>
          <h1 className="mt-4 font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
            Jobs in {city}
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            {cityJobs.length > 0
              ? `${cityJobs.length} verified opening${cityJobs.length === 1 ? "" : "s"} in ${city} across IT, healthcare, finance, sales and more. Browse freely — log in only when you're ready to apply.`
              : `We're adding fresh openings in ${city} every day. Browse all jobs across India while we update this list.`}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/jobs" className="btn-gradient inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold transition hover:scale-[1.02]">
              <Search size={16} /> Search all jobs
            </Link>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10">
        {cityJobs.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* h2: directly under the page h1, same as the main job board. */}
            {cityJobs.map((job) => (
              <JobCard key={job.id} job={job} headingLevel={2} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-10 text-center">
            <p className="text-muted-foreground">No openings listed in {city} right now.</p>
            <Link to="/jobs" className="btn-gradient mt-5 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold">
              Browse all jobs
            </Link>
          </div>
        )}
      </section>

      {/* Internal links to sibling city pages — good for SEO crawl depth */}
      <section className="container mx-auto px-4 pb-14">
        <h2 className="font-heading text-lg font-bold">Jobs in other cities</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {CITIES.filter((c) => citySlug(c) !== params.city).map((c) => (
            <Link
              key={c}
              to={`/jobs-in-${citySlug(c)}`}
              className="inline-flex min-h-[40px] items-center rounded-full border border-border px-4 py-2 text-sm text-muted-foreground transition hover:border-primary/40 hover:text-primary"
            >
              Jobs in {c}
            </Link>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
