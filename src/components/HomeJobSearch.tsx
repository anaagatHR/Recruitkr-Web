"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Link, useNavigate } from "@/compat/router";

const popularSearches = ["Frontend", "Nurse", "Sales", "Finance", "Remote", "Internship"];

export default function HomeJobSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const goSearch = () => {
    navigate(query.trim() ? `/jobs?search=${encodeURIComponent(query.trim())}` : "/jobs");
  };

  return (
    <section className="border-b border-border bg-background py-10">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-2 shadow-lg sm:flex-row">
            <div className="flex flex-1 items-center gap-2 rounded-xl px-3">
              <Search size={18} className="text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && goSearch()}
                placeholder="Search jobs by title, skill or company"
                className="w-full bg-transparent py-3 text-sm outline-none"
              />
            </div>
            <button
              type="button"
              onClick={goSearch}
              className="btn-gradient rounded-xl px-6 py-3 text-sm font-bold transition hover:scale-[1.02]"
            >
              Search jobs
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground">
            <span>Popular:</span>
            {popularSearches.map((term) => (
              <Link
                key={term}
                to={`/jobs?search=${encodeURIComponent(term)}`}
                className="rounded-full border border-border px-3 py-1 transition hover:border-primary/40 hover:text-primary"
              >
                {term}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
