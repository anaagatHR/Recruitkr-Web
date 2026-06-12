import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import Services from "@/screens/Services";

export const metadata: Metadata = buildMetadata({
  title: "HR & Recruitment Services",
  description:
    "End-to-end recruitment, payroll, staffing, gig placement, HR solutions and career counselling for startups, MSMEs and enterprises across India.",
  path: "/services",
  keywords: ["recruitment services", "payroll", "staffing", "gig placement", "HR solutions"],
});

export default function Page() {
  return <Services />;
}
