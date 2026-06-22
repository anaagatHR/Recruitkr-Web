import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import MyApplications from "@/screens/MyApplications";

export const metadata: Metadata = buildMetadata({
  title: "My Applications",
  description: "Track your job applications and chat with employers on RecruitKr.",
  path: "/applications",
  noindex: true,
});

export default function Page() {
  return <MyApplications />;
}
