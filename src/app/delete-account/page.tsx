import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import DeleteAccount from "@/screens/DeleteAccount";

export const metadata: Metadata = buildMetadata({
  title: "Delete Your Account",
  description:
    "How to delete your RecruitKR app or recruitkr.com account, what data is deleted and what is kept.",
  path: "/delete-account",
});

export default function Page() {
  return <DeleteAccount />;
}
