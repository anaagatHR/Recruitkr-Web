import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DualCtaSection from "@/components/DualCtaSection";
import { services } from "@/lib/services";

const prose = "text-sm leading-relaxed text-muted-foreground md:text-base";

/** /services index: every service, linked, with enough context to stand on its own. */
export default function Services() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main id="main" className="pt-24">
        <section className="border-b border-border bg-muted/20 py-16">
          <div className="container mx-auto max-w-4xl px-4 text-center">
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">What we do</p>
            <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">Recruitment and HR Services</h1>
            <p className="mx-auto mt-4 max-w-3xl text-base text-muted-foreground">
              RecruitKr is a recruitment and HR services company from Rajasthan, run by Anaagat Humanpower Private
              Limited. We help startups, small and medium businesses and large employers hire, manage and grow their
              teams across India, from a single urgent hire to a workforce of hundreds.
            </p>
          </div>
        </section>

        <section className="container mx-auto px-4 py-16">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <Link
                  key={service.id}
                  href={`/services/${service.id}`}
                  className="group rounded-xl border border-border bg-card p-8 transition-colors hover:border-primary/40"
                >
                  <div className="mb-5 inline-flex rounded-lg bg-primary/10 p-3 text-primary">
                    <Icon size={28} aria-hidden />
                  </div>
                  <h2 className="mb-2 text-xl font-bold text-foreground group-hover:text-primary">{service.cardTitle}</h2>
                  <p className="text-sm leading-relaxed text-muted-foreground">{service.cardDescription}</p>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="border-t border-border bg-muted/10">
          <div className="container mx-auto grid max-w-5xl gap-10 px-4 py-16 md:grid-cols-2">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">How we work with employers</h2>
              <p className={prose}>
                Every engagement starts with a conversation about the roles you need to fill, the skills and
                experience that matter, your budget and your timeline. From there we recommend the right model:
                direct recruitment for permanent hires, staffing or a managed workforce when you need flexibility,
                executive search for senior appointments, and campus drives for fresher intakes.
              </p>
              <p className={prose}>
                Not sure which model fits? Many clients combine them: a permanent core team hired through
                recruitment, seasonal or project staff through a managed workforce, and payroll handled by us for
                both. We will recommend the mix that keeps your costs predictable and your positions filled.
              </p>
              <p className={prose}>
                Our recruiters source candidates from our own database, job portals, referrals and direct outreach,
                then screen them on skills, experience and fit before you see a single profile. You interview a short
                list rather than a pile of resumes, and we coordinate interviews, offers and joining.
              </p>
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Who we work with</h2>
              <p className={prose}>
                We support startups building their first teams, growing SMEs that have outgrown informal hiring, and
                established companies that need volume hiring or HR outsourcing. Our clients hire across IT, BPO,
                retail, banking and insurance, manufacturing, logistics, healthcare, hospitality and FMCG.
              </p>
              <p className={prose}>
                We are based in Jaipur and know the Rajasthan job market closely, including Jodhpur, Kota, Udaipur,
                Ajmer and Bhilwara, and we also hire for employers in Delhi NCR, Mumbai, Pune, Bengaluru, Hyderabad and
                other cities. Candidates never pay a fee to be placed through RecruitKr.
              </p>
              <p className="text-sm">
                <Link href="/sectors" className="font-semibold text-primary hover:underline">
                  See the sectors we serve →
                </Link>
              </p>
            </div>
          </div>
        </section>

        <DualCtaSection />
      </main>
      <Footer />
    </div>
  );
}
