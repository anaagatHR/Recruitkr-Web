import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import ServiceDetails from "@/screens/ServiceDetails";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const name = params.id.replace(/-/g, " ");
  return buildMetadata({
    title: `${name} Service`,
    description: `Learn how RecruitKr's ${name} offering helps you hire, manage and scale your workforce.`,
    path: `/services/${params.id}`,
  });
}

export default function Page() {
  return <ServiceDetails />;
}
