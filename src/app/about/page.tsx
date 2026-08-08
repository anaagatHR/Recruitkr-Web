import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import WhyUs from "@/screens/WhyUs";

export const metadata: Metadata = buildMetadata({
  // "About RecruitKr" rendered as "About RecruitKr | RecruitKr" once the root
  // layout's title template appended the brand.
  title: "About Us",
  description:
    "RecruitKr is your end-to-end hiring and HR partner - connecting talent with verified companies across India.",
  path: "/about",
});

export default function Page() {
  return <WhyUs />;
}
