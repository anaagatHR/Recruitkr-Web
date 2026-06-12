import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import CandidateRegister from "@/screens/CandidateRegister";

export const metadata: Metadata = buildMetadata({
  title: "Complete Candidate Profile",
  description: "Add your full professional profile and resume to get matched with the best jobs on RecruitKr.",
  path: "/register/candidate",
  noindex: true,
});

export default function Page() {
  return <CandidateRegister />;
}
