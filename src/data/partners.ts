/**
 * Hiring-partner logos shown on the home page, checked into the repo.
 *
 * The marquee's first choice is always the backend (`GET /uploads/logos`), which
 * is what the CRM manages. This list is the fallback for when that endpoint is
 * empty or unreachable — a live site with no backend still shows its partners,
 * and you can add one without a deploy of the API.
 *
 * To add a company:
 *   1. Drop the logo in `public/assets/partners/` (SVG or transparent PNG,
 *      roughly 200×80, dark artwork — the marquee greyscales it until hover).
 *   2. Add a row below with the company's real name and that path.
 *
 * Only add companies that are genuinely hiring partners. This list is presented
 * to visitors under "Companies Working With Us", so an invented name here is a
 * false claim about who works with RecruitKr — leave it empty rather than fill
 * it with placeholders. An empty list simply hides the section.
 */
export type PartnerLogo = {
  /** The company's real name — used as the image's alt text. */
  name: string;
  /** Path under /public, e.g. "/assets/partners/acme.png". */
  url: string;
};

export const PARTNER_LOGOS: PartnerLogo[] = [
  // { name: "Acme Corp", url: "/assets/partners/acme.png" },
];
