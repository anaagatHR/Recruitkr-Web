import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import Blog from "@/screens/Blog";

export const metadata: Metadata = buildMetadata({
  title: "Career & Hiring Blog",
  description: "Career advice, hiring trends, salary guides and job-search tips from the RecruitKr team.",
  path: "/blog",
  keywords: ["career advice", "hiring trends", "job search tips", "resume tips"],
});

export default function Page() {
  return <Blog />;
}
