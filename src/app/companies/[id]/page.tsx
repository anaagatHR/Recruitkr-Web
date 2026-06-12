import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { fetchCompanies } from "@/lib/jobs";
import CompanyDetailScreen from "@/screens/CompanyDetailScreen";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const { companies } = await fetchCompanies();
  const company = companies.find((c) => c.id === params.id);
  if (!company) {
    return buildMetadata({ title: "Company", description: "View this company on RecruitKr.", path: `/companies/${params.id}` });
  }
  return buildMetadata({
    title: `${company.name} - Reviews, Ratings & Jobs`,
    description: `${company.name} is rated ${company.rating}/5 from ${company.reviews} reviews. ${company.openJobs} open jobs in ${company.sector}. ${company.description}`,
    path: `/companies/${params.id}`,
    keywords: [company.name, company.sector, "reviews", "ratings", "jobs"],
  });
}

export default function Page() {
  return <CompanyDetailScreen />;
}
