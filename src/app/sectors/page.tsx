import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import Sectors from "@/screens/Sectors";

export const metadata: Metadata = buildMetadata({
  title: "Sectors We Hire For",
  description:
    "RecruitKr recruits across IT, Healthcare, Banking, Retail, Manufacturing, Logistics and more - matching the right talent to every industry.",
  path: "/sectors",
  keywords: ["IT jobs", "healthcare jobs", "banking jobs", "manufacturing jobs", "industry hiring"],
});

export default function Page() {
  return <Sectors />;
}
