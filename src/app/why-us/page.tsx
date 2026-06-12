import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import WhyUs from "@/screens/WhyUs";

export const metadata: Metadata = buildMetadata({
  title: "About Us",
  description:
    "Why candidates and employers choose RecruitKr - speed, transparency, verified companies and an end-to-end hiring partner you can trust.",
  path: "/why-us",
});

export default function Page() {
  return <WhyUs />;
}
