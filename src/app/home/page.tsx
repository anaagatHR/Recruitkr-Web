import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import Index from "@/screens/Index";

/**
 * The marketing home page. It used to render at `/`; `/` now forwards to the
 * job board (see src/app/page.tsx), so it needs a path and metadata of its own
 * — it can no longer inherit the root layout's defaults as the site root.
 */
export const metadata: Metadata = buildMetadata({
  title: "RecruitKr | Hiring & Job Search Partner Across India",
  description:
    "RecruitKr connects candidates with verified employers across India — recruitment, staffing and HR support from first interview to retention.",
  path: "/home",
  keywords: [
    "recruitment agency India",
    "hiring partner",
    "staffing company",
    "HR services",
    "job consultancy",
    "placement services",
  ],
});

export default function Page() {
  return <Index />;
}
