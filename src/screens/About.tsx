import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DualCtaSection from "@/components/DualCtaSection";

/**
 * /about: who RecruitKr is. It used to render the same WhyUs screen as
 * /why-us, so Google saw two identical pages and folded /about into /why-us.
 * Keep the two distinct: this page is the company; /why-us is the pitch.
 */

const prose = "text-sm leading-relaxed text-muted-foreground md:text-base";

const LINKS = [
  { href: "/services", label: "Our services", text: "Recruitment, staffing, executive search, campus hiring, payroll and HR outsourcing." },
  { href: "/process", label: "How we hire", text: "The step-by-step process we follow for every hiring requirement." },
  { href: "/goal", label: "Our goal", text: "What we are building towards for candidates and employers." },
  { href: "/our-team", label: "Our team", text: "The recruiters and HR specialists behind RecruitKr." },
  { href: "/success-stories", label: "Success stories", text: "Candidates and employers we have helped." },
  { href: "/why-us", label: "Why RecruitKr", text: "What makes working with us different." },
];

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main id="main" className="pt-24">
        <section className="border-b border-border bg-muted/20 py-16">
          <div className="container mx-auto max-w-4xl px-4">
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">About us</p>
            <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">About RecruitKr</h1>
            <p className="mt-4 max-w-3xl text-base text-muted-foreground">
              RecruitKr is a recruitment and HR services company from Rajasthan. We connect job seekers with employers
              who are hiring, and we help businesses find, hire and manage the people they need to grow.
            </p>
          </div>
        </section>

        <section className="container mx-auto grid max-w-5xl gap-10 px-4 py-16 md:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Who we are</h2>
            <p className={prose}>
              RecruitKr is operated by Anaagat Humanpower Private Limited, a manpower consultancy and HR services
              company that works with startups, small and medium enterprises and established corporate employers
              across India. We started in Jaipur and still run our recruitment team from there, which is why we know
              the Rajasthan job market particularly well.
            </p>
            <p className={prose}>
              We are both a recruitment consultancy and an online job platform. Employers can post jobs and review
              applicants themselves, or hand a requirement to our recruiters, who source, screen and shortlist
              candidates for them. Job seekers build one profile, apply to verified openings and track every
              application from their dashboard.
            </p>
          </div>
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">What we believe</h2>
            <p className={prose}>
              Hiring should be fast for employers and fair for candidates. That is why candidates never pay a fee to
              apply or to be placed through RecruitKr, why we ask employers for real job details before we publish an
              opening, and why we show candidates exactly what an employer will see before they apply.
            </p>
            <p className={prose}>
              Our mission is to simplify hiring for businesses and help organisations build trained, reliable teams
              while reducing the cost and time it takes to hire. For job seekers, it is to make sure a good candidate
              is never held back by not knowing where the right opening is.
            </p>
          </div>
        </section>

        <section className="border-t border-border bg-muted/10">
          <div className="container mx-auto max-w-5xl px-4 py-16">
            <h2 className="text-2xl font-bold">Learn more about RecruitKr</h2>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="block h-full rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40">
                    <span className="font-semibold text-primary">{link.label}</span>
                    <span className="mt-1 block text-sm text-muted-foreground">{link.text}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <p className={`mt-8 ${prose}`}>
              Questions? Write to{" "}
              <a href="mailto:connect@recruitkr.com" className="text-primary hover:underline">
                connect@recruitkr.com
              </a>{" "}
              or visit our <Link href="/contact" className="text-primary hover:underline">contact page</Link>.
            </p>
          </div>
        </section>

        <DualCtaSection />
      </main>
      <Footer />
    </div>
  );
}
