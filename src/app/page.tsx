import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import Index from "@/screens/Index";

/**
 * The marketing home page, served at `/` itself. It briefly lived at /home
 * behind a `/` → /home redirect, which split the homepage across two URLs in
 * Google; /home now 301s here (next.config.mjs).
 */
const base = buildMetadata({
  // Bare: used for the social title ("... | RecruitKr"); the <title> is set below.
  title: "Hiring & Job Search Partner Across India",
  description:
    "RecruitKr connects candidates with verified employers across India — recruitment, staffing and HR support from first interview to retention.",
  path: "/",
  keywords: [
    "recruitment agency India",
    "hiring partner",
    "staffing company",
    "HR services",
    "job consultancy",
    "placement services",
  ],
});

export const metadata: Metadata = {
  ...base,
  // The layout's "%s | RecruitKr" template only applies to child segments, not
  // to the page beside it, so the homepage spells its full title out.
  title: { absolute: "RecruitKr: Hiring & Job Search Partner Across India" },
  // Absolute with the trailing slash: a relative "/" resolves to the bare origin.
  alternates: { canonical: "https://www.recruitkr.com/" },
};

export default function Page() {
  return <Index />;
}
