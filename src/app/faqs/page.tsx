import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import FAQs from "@/screens/FAQs";

export const metadata: Metadata = buildMetadata({
  title: "Frequently Asked Questions",
  description: "Answers to common questions about applying for jobs, hiring, and using RecruitKr.",
  path: "/faqs",
});

export default function Page() {
  return <FAQs />;
}
