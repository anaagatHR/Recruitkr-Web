import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { fetchCompanies } from "@/lib/jobs";
import CompaniesScreen from "@/screens/CompaniesScreen";

export const metadata: Metadata = buildMetadata({
  title: "Company Reviews & Ratings",
  description:
    "Explore verified companies, read employee ratings and reviews, and discover open jobs before you apply on RecruitKr.",
  path: "/companies",
  keywords: ["company reviews", "company ratings", "best companies to work for", "employer ratings"],
});

export const revalidate = 60;

export default async function Page() {
  const { companies } = await fetchCompanies();
  return <CompaniesScreen initialCompanies={companies} />;
}
