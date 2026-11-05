import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import PartnerApply from "@/screens/PartnerApply";

export const metadata: Metadata = buildMetadata({
  title: "Partner with RecruitKr",
  description:
    "Companies, staffing agencies, training institutes, college placement cells and freelance recruiters: tell us about your organisation and our partnerships team will contact you within one business day.",
  path: "/partners/apply",
});

export default function Page() {
  return <PartnerApply />;
}
