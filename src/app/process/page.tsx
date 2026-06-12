import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import Process from "@/screens/Process";

export const metadata: Metadata = buildMetadata({
  title: "Our Hiring Process",
  description:
    "A transparent, candidate-first hiring process - from sourcing and screening to interviews, offers and onboarding.",
  path: "/process",
});

export default function Page() {
  return <Process />;
}
