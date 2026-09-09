import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Search } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ city: string }> | { city: string };
}

function cleanCityName(slug: string): string {
  if (!slug) return "All India";
  const decoded = decodeURIComponent(slug).replace(/^jobs-in-/, "").replace(/-/g, " ");
  return decoded.charAt(0).toUpperCase() + decoded.slice(1);
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const resolved = await Promise.resolve(props.params);
  const raw = resolved?.city || "";
  const name = cleanCityName(raw);

  return {
    title: `Jobs in ${name} — Verified Openings | RecruitKr`,
    description: `Explore verified job openings and vacancies in ${name}. Apply directly on RecruitKr.`,
    alternates: {
      canonical: `https://www.recruitkr.com/jobs/location/${raw.toLowerCase()}`,
    },
  };
}

export default async function Page(props: PageProps) {
  const resolved = await Promise.resolve(props.params);
  const rawCity = resolved?.city || "";
  const cityName = cleanCityName(rawCity);

  const locations = [
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
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      <main className="flex-grow">
        <section className="border-b border-border bg-muted/20 py-12">
          <div className="container mx-auto px-4">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <MapPin size={13} /> {cityName}
            </span>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Jobs in {cityName}
            </h1>
            <p className="mt-2 max-w-2xl text-muted-foreground text-sm sm:text-base">
              Verified job openings and career vacancies in {cityName}. Apply directly on RecruitKr.
            </p>
            <div className="mt-6">
              <Link
                href="/jobs"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow hover:opacity-90 transition"
              >
                <Search size={16} /> View all verified jobs
              </Link>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-12">
          <div className="rounded-2xl border border-border bg-card p-10 text-center max-w-xl mx-auto shadow-sm">
            <h2 className="text-lg font-bold">Hiring in {cityName}</h2>
            <p className="text-muted-foreground text-sm mt-2">
              We are actively matching talent with top employers across Rajasthan and pan-India. Browse all live openings to apply directly.
            </p>
            <Link
              href="/jobs"
              className="mt-5 inline-block rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground"
            >
              Browse All Live Listings
            </Link>
          </div>
        </section>

        <section className="container mx-auto px-4 pb-14">
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">
            Other Popular Cities
          </h2>
          <div className="flex flex-wrap gap-2">
            {locations.map((loc) => (
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
      </main>

      <Footer />
    </div>
  );
}
