"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CompanyCard from "@/components/job/CompanyCard";
import { fetchCompanies, type Company } from "@/lib/jobs";

export default function CompaniesScreen({ initialCompanies = [] }: { initialCompanies?: Company[] }) {
  const [companies, setCompanies] = useState<Company[]>(initialCompanies);
  const [loading, setLoading] = useState(initialCompanies.length === 0);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"rating" | "jobs">("rating");

  useEffect(() => {
    // Server already provided companies — render them instantly, no client refetch.
    if (initialCompanies.length > 0) return;
    let active = true;
    fetchCompanies().then(({ companies }) => {
      if (active) {
        setCompanies(companies);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...companies]
      .filter((c) => !q || c.name.toLowerCase().includes(q) || c.sector.toLowerCase().includes(q))
      .sort((a, b) => (sort === "rating" ? b.rating - a.rating : b.openJobs - a.openJobs));
  }, [companies, query, sort]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="border-b border-border bg-muted/40 pt-24 pb-8">
        <div className="container mx-auto px-4">
          <h1 className="font-heading text-2xl font-bold sm:text-3xl">Explore companies & reviews</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            See ratings, reviews and open roles from verified employers before you apply.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-card px-3">
              <Search size={18} className="text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search company or sector"
                className="w-full bg-transparent py-3 text-sm outline-none"
              />
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as "rating" | "jobs")}
              className="rounded-xl border border-border bg-card px-3 py-3 text-sm outline-none"
            >
              <option value="rating">Top rated</option>
              <option value="jobs">Most jobs</option>
            </select>
          </div>
        </div>
      </section>

      <section className="py-10">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-48 animate-pulse rounded-2xl border border-border bg-muted/50" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((company) => (
                <CompanyCard key={company.id} company={company} />
              ))}
            </div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
}
