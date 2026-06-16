"use client";

import { useEffect, useState } from "react";

import { apiGet } from "@/lib/api";

type CompanyLogo = {
  name: string;
  url: string;
  fileId?: string;
};

// Turns "gau-organics.png" -> "Gau Organics" for the alt text.
const labelFromName = (name: string) =>
  name
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

export default function PartnerCompanies() {
  const [logos, setLogos] = useState<CompanyLogo[]>([]);

  useEffect(() => {
    let active = true;
    apiGet<{ data: CompanyLogo[] }>("/uploads/logos")
      .then((res) => {
        if (active) setLogos(Array.isArray(res?.data) ? res.data : []);
      })
      .catch(() => {
        if (active) setLogos([]);
      });
    return () => {
      active = false;
    };
  }, []);

  if (logos.length === 0) return null;

  return (
    <section className="bg-white py-4 sm:py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center md:mb-10">
          <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">
            Companies Working With Us
          </h2>
        </div>

        <div className="company-marquee-pause relative overflow-hidden">
          {/* Soft fade edges */}
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-white to-transparent sm:w-20" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-white to-transparent sm:w-20" />

          <div className="flex w-max animate-company-scroll items-center gap-12 sm:gap-20">
            {[...logos, ...logos].map((company, index) => (
              <img
                key={`${company.fileId ?? company.url}-${index}`}
                src={company.url}
                alt={labelFromName(company.name)}
                loading="lazy"
                className="h-14 w-auto shrink-0 object-contain sm:h-20 lg:h-24"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
