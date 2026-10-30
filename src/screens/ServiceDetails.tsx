import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DualCtaSection from "@/components/DualCtaSection";
import { services, type Service } from "@/lib/services";
import { CITIES, cityHeading, cityPath } from "@/lib/locations";

/**
 * Server component on purpose: the whole service write-up has to be in the
 * first HTML response for crawlers. (The old client version fetched the
 * service from useParams and rendered nothing useful server-side.)
 */

const toKebab = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const prose = "text-sm leading-relaxed text-muted-foreground md:text-base";

export default function ServiceDetails({ service }: { service: Service }) {
  const Icon = service.icon;
  const cities = service.cities.map((slug) => CITIES.find((c) => c.slug === slug)).filter((c) => c !== undefined);
  const others = services.filter((s) => s.id !== service.id);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main id="main" className="pb-20 pt-28">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8">
              <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <Link href="/services" className="hover:text-foreground">
                  Services
                </Link>
                <span aria-hidden>/</span>
                <span className="text-foreground">{service.cardTitle}</span>
              </nav>

              <div className="mt-4 flex items-start gap-4">
                <div className="inline-flex rounded-2xl bg-primary/10 p-3 text-primary">
                  <Icon size={28} aria-hidden />
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl">{service.title}</h1>
                  <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground md:text-base">
                    {service.subtitle}
                  </p>
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <Link
                      href="/contact"
                      className="btn-gradient inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-semibold transition-transform hover:scale-105"
                    >
                      Talk to us
                    </Link>
                    <Link
                      href="/services"
                      className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                    >
                      Explore other services
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
              <article className="space-y-8">
                <section className="rounded-2xl border border-border bg-card p-6 md:p-8">
                  <div className="space-y-4">
                    {service.intro.map((p) => (
                      <p key={p} className={prose}>
                        {p}
                      </p>
                    ))}
                  </div>
                </section>

                {service.blocks.map((block) => (
                  <section
                    key={block.title}
                    id={toKebab(block.title)}
                    className="scroll-mt-28 rounded-2xl border border-border bg-card p-6 md:p-8"
                  >
                    <h2 className="text-xl font-bold tracking-tight md:text-2xl">{block.title}</h2>

                    {block.kind === "paragraphs" && (
                      <div className="mt-4 space-y-4">
                        {block.paragraphs.map((p) => (
                          <p key={p} className={prose}>
                            {p}
                          </p>
                        ))}
                      </div>
                    )}

                    {block.kind === "labeled" && (
                      <dl className="mt-5 grid gap-4 md:grid-cols-2">
                        {block.items.map((item) => (
                          <div key={item.label} className="rounded-xl border border-border bg-muted/20 p-4">
                            <dt className="text-sm font-semibold text-foreground">{item.label}</dt>
                            <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.description}</dd>
                          </div>
                        ))}
                      </dl>
                    )}

                    {block.kind === "bullets" && (
                      <ul className="mt-5 grid gap-3 md:grid-cols-2">
                        {block.items.map((item) => (
                          <li key={item} className="rounded-xl border border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}

                    {block.kind === "steps" && (
                      <ol className="mt-5 space-y-3">
                        {block.items.map((item, index) => (
                          <li
                            key={item}
                            className="flex gap-3 rounded-xl border border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground"
                          >
                            <span className="mt-0.5 inline-flex h-6 w-6 flex-none items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                              {index + 1}
                            </span>
                            <span className="leading-relaxed">{item}</span>
                          </li>
                        ))}
                      </ol>
                    )}
                  </section>
                ))}

                {service.closing && (
                  <section className="rounded-2xl border border-border bg-muted/30 p-6 md:p-8">
                    <div className="space-y-4">
                      {service.closing.map((p) => (
                        <p key={p} className={prose}>
                          {p}
                        </p>
                      ))}
                    </div>
                  </section>
                )}

                <section aria-labelledby="related" className="rounded-2xl border border-border bg-card p-6 md:p-8">
                  <h2 id="related" className="text-xl font-bold tracking-tight md:text-2xl">
                    Jobs and locations
                  </h2>
                  <p className={`mt-3 ${prose}`}>
                    See the roles we are hiring for right now, or browse openings by city.
                  </p>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    <li>
                      <Link href="/jobs" className="inline-block rounded-full border border-border px-4 py-1.5 text-sm font-medium text-primary hover:border-primary">
                        All open jobs
                      </Link>
                    </li>
                    {cities.map((city) => (
                      <li key={city.slug}>
                        <Link
                          href={cityPath(city.slug)}
                          className="inline-block rounded-full border border-border px-4 py-1.5 text-sm font-medium text-primary hover:border-primary"
                        >
                          {cityHeading(city)}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              </article>

              <aside className="space-y-6">
                <div className="rounded-2xl border border-border bg-card p-6 lg:sticky lg:top-28">
                  <p className="text-sm font-semibold text-foreground">On this page</p>
                  <ul className="mt-4 space-y-2 text-sm">
                    {service.blocks.map((block) => (
                      <li key={block.title}>
                        <a
                          href={`#${toKebab(block.title)}`}
                          className="block rounded-lg px-2 py-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          {block.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-6 text-sm font-semibold text-foreground">Other services</p>
                  <ul className="mt-3 space-y-2 text-sm">
                    {others.map((s) => (
                      <li key={s.id}>
                        <Link href={`/services/${s.id}`} className="block rounded-lg px-2 py-1 text-primary hover:bg-muted">
                          {s.cardTitle}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </main>

      <DualCtaSection />
      <Footer />
    </div>
  );
}
