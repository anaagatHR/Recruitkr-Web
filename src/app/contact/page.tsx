import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import Contact from "@/screens/Contact";

export const metadata: Metadata = buildMetadata({
  title: "Contact Us",
  description: "Get in touch with RecruitKr for hiring, careers, payroll and staffing enquiries.",
  path: "/contact",
});

export default function Page() {
  return <Contact />;
}
