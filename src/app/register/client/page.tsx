import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import SignupScreen from "@/screens/SignupScreen";

export const metadata: Metadata = buildMetadata({
  title: "Register as an Employer",
  description: "Create an employer account on RecruitKr to post jobs and hire verified talent.",
  path: "/register/client",
  noindex: true,
});

export default function Page() {
  return <SignupScreen role="client" />;
}
