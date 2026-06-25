import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import Training from "@/screens/Training";

export const metadata: Metadata = buildMetadata({
  title: "Training",
  description: "Industry-led training programs with mentorship, certification and placement support — get job-ready with RecruitKr.",
  path: "/training",
});

export default function Page() {
  return <Training />;
}
