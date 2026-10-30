import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

type LinkCount = { label: string; href: string; count: number };

/**
 * /jobs?type=…/?mode=… with no current openings. A real page (200, noindex,
 * follow) rather than a 404: the homepage links to every filter, and a hard
 * 404 there is a dead link. It points visitors at the filters and cities that
 * do have roles right now.
 */
export default function EmptyJobFilter({
  label,
  filters,
  cities,
}: {
  /** e.g. "Internship", "Remote", "Contract · Remote" */
  label: string;
  filters: LinkCount[];
  cities: LinkCount[];
}) {
  const chip =
    "inline-flex min-h-[40px] items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main id="main" className="container mx-auto max-w-3xl px-4 pb-20 pt-28">
        <h1 className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">{label} jobs</h1>
        <p className="mt-3 text-base text-muted-foreground">
          There are no {label.toLowerCase()} openings on RecruitKr right now. New roles are added every week, so check
          back soon, or browse the roles that are open today.
        </p>

        {filters.length > 0 && (
          <section aria-labelledby="open-filters" className="mt-10">
            <h2 id="open-filters" className="text-lg font-bold">
              Job types with open roles
            </h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {filters.map((f) => (
                <li key={f.href}>
                  <Link href={f.href} className={chip}>
                    {f.label} <span className="text-muted-foreground">({f.count})</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {cities.length > 0 && (
          <section aria-labelledby="open-cities" className="mt-8">
            <h2 id="open-cities" className="text-lg font-bold">
              Cities with open roles
            </h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {cities.map((c) => (
                <li key={c.href}>
                  <Link href={c.href} className={chip}>
                    {c.label} <span className="text-muted-foreground">({c.count})</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="mt-10">
          <Link href="/jobs" className="btn-gradient inline-flex items-center rounded-xl px-6 py-3 text-sm font-semibold">
            See all open jobs
          </Link>
        </p>
      </main>
      <Footer />
    </div>
  );
}
