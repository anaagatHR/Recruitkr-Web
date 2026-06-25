import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import Partners from "@/screens/Partners";

export const metadata: Metadata = buildMetadata({
  title: "Partners",
  description: "Partner with RecruitKr as a staffing agency, training institute, college or channel partner and grow across India.",
  path: "/partners",
});

export default function Page() {
  return <Partners />;
}
