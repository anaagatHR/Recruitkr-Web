import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import Assessment from "@/screens/Assessment";

export const metadata: Metadata = buildMetadata({
  title: "Assessment",
  description: "Screen candidates with role-based skill, coding and aptitude assessments — auto-scored and ranked — on RecruitKr.",
  path: "/assessment",
});

export default function Page() {
  return <Assessment />;
}
