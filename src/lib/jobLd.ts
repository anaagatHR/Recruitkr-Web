import type { Job } from "@/lib/jobs";
import { HOME_CITY, HOME_REGION } from "@/lib/locations";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.recruitkr.com";

/** schema.org JobPosting employmentType enum. */
const EMPLOYMENT_TYPE: Record<Job["type"], string> = {
  "Full-time": "FULL_TIME",
  "Part-time": "PART_TIME",
  Contract: "CONTRACTOR",
  Internship: "INTERN",
  Remote: "FULL_TIME",
};

/** Salary is stored in LPA (lakhs per annum); convert to absolute INR per year. */
const toAnnualInr = (lpa?: number) => (lpa != null && lpa > 0 ? Math.round(lpa * 100000) : undefined);

/** Google recommends validThrough; we don't store an expiry, so derive one. */
const expiryDate = (iso: string, days = 45) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return undefined;
  d.setDate(d.getDate() + days);
  return d.toISOString();
};

/**
 * Builds a Google-compatible JobPosting JSON-LD object for a single job.
 * This is what makes a job eligible to appear in Google's job search
 * (the "jobs in <city>" experience). See:
 * https://developers.google.com/search/docs/appearance/structured-data/job-posting
 */
export function jobPostingJsonLd(job: Job): Record<string, unknown> {
  const isRemote = job.workMode === "Remote";
  // `location` holds a neighborhood (e.g. "Mansarovar"); resolve to Jaipur, Rajasthan.
  const area = job.location && !/^location not shared$/i.test(job.location) ? job.location : undefined;
  const minInr = toAnnualInr(job.salaryMin);
  const maxInr = toAnnualInr(job.salaryMax);

  const baseSalary =
    minInr || maxInr
      ? {
          "@type": "MonetaryAmount",
          currency: "INR",
          value: {
            "@type": "QuantitativeValue",
            ...(minInr ? { minValue: minInr } : {}),
            ...(maxInr ? { maxValue: maxInr } : {}),
            unitText: "YEAR",
          },
        }
      : undefined;

  const ld: Record<string, unknown> = {
    "@context": "https://schema.org/",
    "@type": "JobPosting",
    title: job.title,
    description: job.description || `${job.title} at ${job.company} in ${job.location}. ${job.experience} experience.`,
    datePosted: job.postedAt,
    validThrough: expiryDate(job.postedAt),
    employmentType: EMPLOYMENT_TYPE[job.type] ?? "FULL_TIME",
    industry: job.sector,
    url: `${SITE_URL}/jobs/${job.id}`,
    directApply: true,
    identifier: {
      "@type": "PropertyValue",
      name: "RecruitKr",
      value: job.id,
    },
    hiringOrganization: {
      "@type": "Organization",
      name: job.company,
      sameAs: job.companyId ? `${SITE_URL}/companies/${job.companyId}` : SITE_URL,
      ...(job.companyLogo ? { logo: job.companyLogo } : {}),
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        ...(area && !isRemote ? { streetAddress: area } : {}),
        addressLocality: HOME_CITY,
        addressRegion: HOME_REGION,
        addressCountry: "IN",
      },
    },
    ...(baseSalary ? { baseSalary } : {}),
    ...(job.skills?.length ? { skills: job.skills.join(", ") } : {}),
  };

  if (isRemote) {
    ld.jobLocationType = "TELECOMMUTE";
    ld.applicantLocationRequirements = { "@type": "Country", name: "India" };
  }

  return ld;
}
