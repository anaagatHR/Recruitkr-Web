import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import WhyUs from "@/screens/WhyUs";

export const metadata: Metadata = buildMetadata({
  title: "About RecruitKr",
  description:
    "RecruitKr is your end-to-end hiring and HR partner - connecting talent with verified companies across India.",
  path: "/about",
});

export default function Page() {
  return <WhyUs />;
}
