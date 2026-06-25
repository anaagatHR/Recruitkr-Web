import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import ForEmployers from "@/screens/ForEmployers";

export const metadata: Metadata = buildMetadata({
  title: "For Employers",
  description: "Post jobs, search verified candidates, chat instantly and schedule interviews — your whole hiring pipeline in one place on RecruitKr.",
  path: "/employers",
});

export default function Page() {
  return <ForEmployers />;
}
