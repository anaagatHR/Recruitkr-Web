import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import ClientDashboard from "@/screens/ClientDashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Employer Dashboard",
  description: "Post jobs, manage candidates and track hiring on RecruitKr.",
  path: "/dashboard/client",
  noindex: true,
});

export default function Page() {
  return <ClientDashboard />;
}
