import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import OurTeam from "@/screens/OurTeam";

export const metadata: Metadata = buildMetadata({
  title: "Our Team",
  description: "Meet the people behind RecruitKr - recruiters and HR experts dedicated to better hiring.",
  path: "/our-team",
});

export default function Page() {
  return <OurTeam />;
}
