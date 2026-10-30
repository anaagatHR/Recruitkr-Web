import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import TermsAndConditions from "@/screens/TermsAndConditions";

export const metadata: Metadata = buildMetadata({
  title: "Terms & Conditions",
  description:
    "The terms for using RecruitKr: how the platform works for candidates and employers, how candidate data is used, fees, fraud warnings and grievance contact.",
  path: "/terms",
});

export default function Page() {
  return <TermsAndConditions />;
}
