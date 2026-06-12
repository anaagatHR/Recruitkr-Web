import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import ForgotPassword from "@/screens/ForgotPassword";

export const metadata: Metadata = buildMetadata({
  title: "Forgot Password",
  description: "Reset your RecruitKr account password.",
  path: "/forgot-password",
  noindex: true,
});

export default function Page() {
  return <ForgotPassword />;
}
