import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import ForCandidates from "@/screens/ForCandidates";

export const metadata: Metadata = buildMetadata({
  title: "For Candidates",
  description:
    "Apply to verified jobs in one tap, chat directly with employers, and track every application in real time on RecruitKr.",
  path: "/candidates",
  keywords: [
    "jobs for candidates",
    "verified jobs",
    "job search",
    "career opportunities",
    "RecruitKr",
  ],
});

export default function Page() {
  return <ForCandidates />;
}
