import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import Goal from "@/screens/Goal";

export const metadata: Metadata = buildMetadata({
  title: "Our Goal — Building The Workforce Of Tomorrow",
  description:
    "RecruitKr connects talent with opportunity through free training, internships, and real-world experience — building a future-ready workforce.",
  path: "/goal",
});

export default function Page() {
  return <Goal />;
}
