import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import Messages from "@/screens/Messages";

export const metadata: Metadata = buildMetadata({
  title: "Messages",
  description: "Chat with employers and candidates on RecruitKr.",
  path: "/messages",
  noindex: true,
});

export default function Page() {
  return <Messages />;
}
