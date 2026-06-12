import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import CandidateDashboard from "@/screens/CandidateDashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Candidate Dashboard",
  description: "Manage your RecruitKr profile, resume and job applications.",
  path: "/dashboard/candidate",
  noindex: true,
});

export default function Page() {
  return <CandidateDashboard />;
}
