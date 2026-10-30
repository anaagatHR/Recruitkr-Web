import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import About from "@/screens/About";

export const metadata: Metadata = buildMetadata({
  // "About RecruitKr" rendered as "About RecruitKr | RecruitKr" once the root
  // layout's title template appended the brand.
  title: "About Us",
  description:
    "About RecruitKr: a Jaipur-based recruitment and HR services company run by Anaagat Humanpower Private Limited, connecting job seekers and employers across India.",
  path: "/about",
});

export default function Page() {
  return <About />;
}
