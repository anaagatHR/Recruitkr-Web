import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import Login from "@/screens/Login";

export const metadata: Metadata = buildMetadata({
  title: "Login",
  description: "Log in to your RecruitKr account to apply for jobs and track your applications.",
  path: "/login",
  noindex: true,
});

export default function Page() {
  return <Login />;
}
