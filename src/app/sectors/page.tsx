import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import Sectors from "@/screens/Sectors";

export const metadata: Metadata = buildMetadata({
  title: "Sectors We Hire For",
  description:
    "Industries RecruitKr recruits for: IT, BPO, banking and insurance, retail and FMCG, manufacturing and textiles, power, logistics, healthcare, hospitality and education.",
  path: "/sectors",
});

export default function Page() {
  return <Sectors />;
}
