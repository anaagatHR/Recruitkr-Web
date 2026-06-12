import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import ResetPassword from "@/screens/ResetPassword";

export const metadata: Metadata = buildMetadata({
  title: "Reset Password",
  description: "Set a new password for your RecruitKr account.",
  path: "/reset-password",
  noindex: true,
});

export default function Page() {
  return <ResetPassword />;
}
