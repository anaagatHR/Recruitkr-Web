import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DualCtaSection from "@/components/DualCtaSection";
import { cityHeading, cityPath, getCity } from "@/lib/locations";

type Sector = { name: string; text: string; services: string[]; cities: string[] };

const SERVICE_NAMES: Record<string, string> = {
  recruitment: "Recruitment",
  staffing: "Staffing",
  "workforce-solutions": "Workforce solutions",
  "executive-search": "Executive search",
  "campus-recruitment": "Campus recruitment",
  gig: "Gig talent",
};

const SECTORS: Sector[] = [
  {
    name: "IT and ITES",
    text: "Software developers, testers, technical support and IT operations staff for product companies, service firms and in-house technology teams.",
    services: ["recruitment", "gig", "campus-recruitment"],
    cities: ["jaipur", "bengaluru", "hyderabad", "noida"],
  },
  {
    name: "BPO and customer support",
    text: "Voice and non-voice support executives, telecallers, team leaders and quality analysts, often hired in batches for new processes.",
    services: ["staffing", "workforce-solutions"],
    cities: ["jaipur", "noida", "gurugram", "remote"],
  },
  {
    name: "Banking and insurance",
    text: "Relationship managers, sales officers, branch operations and collections staff for banks, NBFCs and insurers expanding their branch networks.",
    services: ["recruitment", "executive-search"],
    cities: ["jaipur", "mumbai", "kolkata"],
  },
  {
    name: "Retail and FMCG",
    text: "Store managers, sales associates, promoters, distributor sales representatives and area sales managers for organised retail and consumer brands.",
    services: ["staffing", "workforce-solutions", "recruitment"],
    cities: ["jaipur", "delhi", "kolkata", "mumbai"],
  },
  {
    name: "Manufacturing and textiles",
    text: "Machine operators, production and quality supervisors, maintenance technicians and plant leadership for engineering, textile and process plants.",
    services: ["workforce-solutions", "campus-recruitment", "executive-search"],
    cities: ["bhilwara", "pune", "jodhpur", "gurugram"],
  },
  {
    name: "Power and energy",
    text: "Plant operators, electrical and mechanical technicians, safety officers and engineers for power generation and renewable energy projects.",
    services: ["recruitment", "staffing"],
    cities: ["kota", "jaipur", "jodhpur"],
  },
  {
    name: "Logistics and warehousing",
    text: "Warehouse associates, inventory controllers, fleet coordinators, delivery staff and supply-chain managers for e-commerce and distribution companies.",
    services: ["workforce-solutions", "staffing"],
    cities: ["jaipur", "delhi", "kolkata", "pune"],
  },
  {
    name: "Healthcare",
    text: "Nurses, pharmacists, lab technicians, front-office and billing staff for hospitals, clinics, diagnostic chains and pharma companies.",
    services: ["recruitment", "staffing"],
    cities: ["jaipur", "hyderabad", "delhi"],
  },
  {
    name: "Hospitality and tourism",
    text: "Front-office executives, chefs, housekeeping and guest-relations staff for hotels, resorts and travel businesses, including seasonal peaks.",
    services: ["staffing", "workforce-solutions"],
    cities: ["udaipur", "jaipur", "jodhpur", "ajmer"],
  },
  {
    name: "Education",
    text: "Teachers, counsellors, academic coordinators, admissions and administrative staff for schools, colleges and coaching institutes.",
    services: ["recruitment", "campus-recruitment"],
    cities: ["kota", "ajmer", "jaipur"],
  },
];

const prose = "text-sm leading-relaxed text-muted-foreground md:text-base";

export default function Sectors() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main id="main" className="pt-24">
        <section className="border-b border-border bg-muted/20 py-16">
          <div className="container mx-auto max-w-4xl px-4 text-center">
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">Industries</p>
            <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">Sectors We Hire For</h1>
            <p className="mx-auto mt-4 max-w-3xl text-base text-muted-foreground">
              Every industry hires differently. A textile mill in Bhilwara needs shift operators who can start next
              week; a bank in Mumbai needs relationship managers who already know the local market. RecruitKr&apos;s
              recruiters specialise by sector, so the candidates you meet already understand the work.
            </p>
          </div>
        </section>

        <section className="container mx-auto max-w-5xl px-4 py-16">
          <div className="grid gap-6 md:grid-cols-2">
            {SECTORS.map((sector) => (
              <article key={sector.name} className="rounded-2xl border border-border bg-card p-6">
                <h2 className="text-lg font-bold">{sector.name}</h2>
                <p className={`mt-2 ${prose}`}>{sector.text}</p>
                <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Services</p>
                <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm">
                  {sector.services.map((id) => (
                    <li key={id}>
                      <Link href={`/services/${id}`} className="text-primary hover:underline">
                        {SERVICE_NAMES[id]}
                      </Link>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Jobs by city</p>
                <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm">
                  {sector.cities.map((slug) => {
                    const city = getCity(slug);
                    return city ? (
                      <li key={slug}>
                        <Link href={cityPath(slug)} className="text-primary hover:underline">
                          {cityHeading(city)}
                        </Link>
                      </li>
                    ) : null;
                  })}
                </ul>
              </article>
            ))}
          </div>

          <div className="mx-auto mt-12 max-w-3xl space-y-4">
            <h2 className="text-2xl font-bold">Not sure where your role fits?</h2>
            <p className={prose}>
              Many roles cut across sectors: accountants, HR executives, sales staff and office administrators are
              needed everywhere. Tell us what you are hiring for and we will match you with the recruiter who knows
              that role best. Job seekers can browse <Link href="/jobs" className="text-primary hover:underline">all open jobs</Link>{" "}
              or create a free profile to be considered as new openings arrive.
            </p>
          </div>
        </section>

        <DualCtaSection />
      </main>
      <Footer />
    </div>
  );
}
