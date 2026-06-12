import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import Internship from "@/screens/Internship";

export const metadata: Metadata = buildMetadata({
  title: "Internships",
  description: "Kickstart your career with hands-on internships across top companies and sectors via RecruitKr.",
  path: "/internship",
  keywords: ["internships", "internship jobs", "fresher jobs", "student jobs"],
});

export default function Page() {
  return <Internship />;
}
