import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import PrivacyPolicy from "@/screens/PrivacyPolicy";

export const metadata: Metadata = buildMetadata({
  title: "Privacy Policy",
  description:
    "How RecruitKr collects, uses, shares, protects and deletes personal information on recruitkr.com and the RecruitKR Android app.",
  path: "/privacy-policy",
});

export default function Page() {
  return <PrivacyPolicy />;
}
