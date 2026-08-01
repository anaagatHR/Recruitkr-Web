"use client";

import { useEffect, useState } from "react";

import { apiGet } from "@/lib/api";
import { PARTNER_LOGOS } from "@/data/partners";

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
  // Seeded from the checked-in list so the section still has something to show
  // when the CRM endpoint is empty or the backend is down. A successful call
  // with logos in it replaces this; a failed or empty one leaves it in place.
  // See src/data/partners.ts — it ships empty, and an empty list hides the
  // section rather than filling it with invented employers.
  const [logos, setLogos] = useState<CompanyLogo[]>(PARTNER_LOGOS);

  useEffect(() => {
    let active = true;
    apiGet<{ data: CompanyLogo[] }>("/uploads/logos")
      .then((res) => {
        const fromApi = Array.isArray(res?.data) ? res.data : [];
        if (active && fromApi.length > 0) setLogos(fromApi);
      })
      .catch(() => {
        /* keep whatever the static list provided */
      });
    return () => {
      active = false;
    };
  }, []);

  if (logos.length === 0) return null;

  return (
    // Tinted band between the white hero and the white job grid: the logo wall
    // is a trust strip, not a content section, and the change of surface is
    // what stops it reading as a stray row of images. Same py-14 sm:py-20
    // rhythm and eyebrow → heading → subtitle header as every other section.
    <section className="border-y border-slate-100 bg-slate-50/70 py-12 sm:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#264a7f]/20 bg-[#264a7f]/10 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#264a7f]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#264a7f]" />
            Hiring partners
          </span>
          <h2 className="mt-4 font-heading text-2xl font-extrabold tracking-tight text-slate-900 sm:mt-5 sm:text-3xl lg:text-4xl">
            Companies Working With Us
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
            Teams across India hire through RecruitKr — every role on the board comes from a verified employer.
          </p>
        </div>

        <div className="company-marquee-pause relative mt-8 overflow-hidden sm:mt-12">
          {/* Fades have to match the section's own tint, not white, or they
              read as pale rectangles sitting on top of the band. */}
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-slate-50 to-transparent sm:w-20" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-slate-50 to-transparent sm:w-20" />

          {/* Desaturated by default so a wall of clashing brand colours doesn't
              pull attention off the copy; each logo comes back to full colour
              on hover. Gaps and heights are tuned down for phones — at gap-12
              only two logos fitted on screen at a time. */}
          <div className="flex w-max animate-company-scroll items-center gap-8 sm:gap-16 lg:gap-20">
            {[...logos, ...logos].map((company, index) => (
              <img
                key={`${company.fileId ?? company.url}-${index}`}
                src={company.url}
                alt={labelFromName(company.name)}
                loading="lazy"
                className="h-10 w-auto shrink-0 object-contain opacity-75 grayscale transition duration-300 hover:opacity-100 hover:grayscale-0 sm:h-16 lg:h-20"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
