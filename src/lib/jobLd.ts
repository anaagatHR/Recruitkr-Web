import { displayCompany, formatExperience, hasRealDescription, jobPath, PLACEHOLDER_LOCATION, type Job } from "@/lib/jobs";
import { CITIES, HOME_CITY, HOME_REGION } from "@/lib/locations";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.recruitkr.com";

/** schema.org JobPosting employmentType enum. */
const EMPLOYMENT_TYPE: Record<Job["type"], string> = {
  "Full-time": "FULL_TIME",
  "Part-time": "PART_TIME",
  Contract: "CONTRACTOR",
  Internship: "INTERN",
  Remote: "FULL_TIME",
};

/**
 * Salary is stored in LPA (lakhs per annum); convert to absolute INR per year.
 * Values above 200 LPA (₹2 crore) are data-entry errors, e.g. a monthly
 * ₹25,000 typed into the LPA field, which would publish ₹250 crore a year.
 * Those are omitted rather than published.
 */
const MAX_PLAUSIBLE_LPA = 200;
const toAnnualInr = (lpa?: number) =>
  lpa != null && lpa > 0 && lpa <= MAX_PLAUSIBLE_LPA ? Math.round(lpa * 100000) : undefined;

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** The posting's own write-up as HTML, which is the form Google asks for. */
const descriptionHtml = (job: Job) => {
  const list = (title: string, items?: string[]) =>
    items?.length ? `<h3>${title}</h3><ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : "";
  return [
    job.description
      .split(/\n\s*\n/)
      .map((para) => para.trim())
      .filter(Boolean)
      .map((para) => `<p>${escapeHtml(para).replace(/\n/g, "<br>")}</p>`)
      .join(""),
    list("Responsibilities", job.responsibilities),
    list("Requirements", job.requirements),
    job.qualification ? `<p><strong>Qualification:</strong> ${escapeHtml(job.qualification)}</p>` : "",
  ].join("");
};

/**
 * Google recommends validThrough; we don't store an expiry, so derive one.
 *
 * A date that has already passed is worse than no date at all: Google treats
 * the posting as expired and removes it from job search, so every listing older
 * than the window would silently drop out even though it is still open on the
 * board. validThrough is optional, so we omit it once the derived date lapses.
 */
const expiryDate = (iso: string, days = 45) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return undefined;
  d.setDate(d.getDate() + days);
  return d.getTime() > Date.now() ? d.toISOString() : undefined;
};

/**
 * For a listing saved without a description: a summary built only from fields
 * that hold real values. Placeholders such as "Location not shared" or
 * "Not specified" are left out rather than printed.
 */
const fallbackDescription = (job: Job, area?: string) =>
  [
    `${job.title} at ${displayCompany(job)}${area ? ` in ${area}` : ""}.`,
    `${job.type} role, ${job.workMode.toLowerCase()}.`,
    formatExperience(job.experience) ? `${formatExperience(job.experience)}.` : "",
    job.skills.length ? `Skills: ${job.skills.join(", ")}.` : "",
    job.openings > 1 ? `${job.openings} openings.` : "",
  ]
    .filter(Boolean)
    .join(" ");

/**
 * Builds a Google-compatible JobPosting JSON-LD object for a single job.
 * This is what makes a job eligible to appear in Google's job search
 * (the "jobs in <city>" experience). See:
 * https://developers.google.com/search/docs/appearance/structured-data/job-posting
 */
export function jobPostingJsonLd(job: Job): Record<string, unknown> {
  const isRemote = job.workMode === "Remote";
  const area = job.location && job.location !== PLACEHOLDER_LOCATION ? job.location : undefined;
  // A known city name ("Bengaluru") is the locality itself. Anything else is a
  // Jaipur neighborhood (e.g. "Mansarovar"), which is how most jobs are saved.
  const city = area
    ? CITIES.find((c) => c.slug !== "remote" && c.match.some((m) => area.toLowerCase().includes(m)))
    : undefined;
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
    // The generated summary is only for postings saved without a write-up;
    // those pages are noindexed (see isIndexableJob), so it never reaches
    // Google as a rich result.
    description: hasRealDescription(job) ? descriptionHtml(job) : fallbackDescription(job, area),
    datePosted: job.postedAt,
    // A real employer deadline wins; otherwise the derived 45-day window.
    validThrough:
      job.applicationDeadline && Date.parse(job.applicationDeadline) > Date.now()
        ? job.applicationDeadline
        : expiryDate(job.postedAt),
    employmentType: EMPLOYMENT_TYPE[job.type] ?? "FULL_TIME",
    industry: job.sector,
    url: `${SITE_URL}${jobPath(job)}`,
    directApply: true,
    identifier: {
      "@type": "PropertyValue",
      name: "RecruitKr",
      value: job.id,
    },
    hiringOrganization: {
      "@type": "Organization",
      name: displayCompany(job),
      sameAs: job.companyId ? `${SITE_URL}/companies/${job.companyId}` : SITE_URL,
      ...(job.companyLogo ? { logo: job.companyLogo } : {}),
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        ...(area && !city && !isRemote ? { streetAddress: area } : {}),
        addressLocality: city ? city.name.replace(/ NCR$/, "") : HOME_CITY,
        addressRegion: city ? city.region : HOME_REGION,
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
