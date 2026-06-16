import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import SuccessStories from "@/screens/SuccessStories";

export const metadata: Metadata = buildMetadata({
  title: "Success Stories",
  description:
    "Real career transformations, candidate placements, and startup hiring wins powered by RecruitKr.",
  path: "/success-stories",
});

export default function Page() {
  return <SuccessStories />;
}
