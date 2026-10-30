import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import Services from "@/screens/Services";

export const metadata: Metadata = buildMetadata({
  title: "Recruitment, Staffing & HR Services",
  description:
    "RecruitKr's recruitment and HR services: permanent hiring, staffing, executive search, campus recruitment, workforce outsourcing, payroll and career counselling.",
  path: "/services",
});

export default function Page() {
  return <Services />;
}
