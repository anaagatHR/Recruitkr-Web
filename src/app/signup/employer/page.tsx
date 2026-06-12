import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import SignupScreen from "@/screens/SignupScreen";

export const metadata: Metadata = buildMetadata({
  title: "Employer Sign Up Free",
  description: "Create a free RecruitKr employer account in seconds - just your name, email, mobile and password - and start posting jobs.",
  path: "/signup/employer",
});

export default function Page() {
  return <SignupScreen role="client" />;
}
