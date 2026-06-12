import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import SignupScreen from "@/screens/SignupScreen";

export const metadata: Metadata = buildMetadata({
  title: "Sign Up Free",
  description: "Create a free RecruitKr account in seconds - just your name, email, mobile and password - and start applying to jobs.",
  path: "/signup",
});

export default function Page() {
  return <SignupScreen />;
}
