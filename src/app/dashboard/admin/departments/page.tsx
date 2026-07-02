import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import AdminDepartments from "@/screens/AdminDepartments";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Admin · Departments",
  description: "Manage internship departments and their heads.",
  path: "/dashboard/admin/departments",
  noindex: true,
});

export default function Page() {
  return <AdminDepartments />;
}
