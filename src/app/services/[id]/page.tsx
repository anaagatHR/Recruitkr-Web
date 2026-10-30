import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildMetadata } from "@/lib/seo";
import { getService, services } from "@/lib/services";
import ServiceDetails from "@/screens/ServiceDetails";

type Props = { params: Promise<{ id: string }> | { id: string } };

// Only the services in lib/services exist; any other /services/<x> is a real 404.
export const dynamicParams = false;
export const generateStaticParams = () => services.map((s) => ({ id: s.id }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const service = getService((await Promise.resolve(params)).id);
  if (!service) return {};
  return buildMetadata({
    title: service.title,
    description: service.metaDescription,
    path: `/services/${service.id}`,
  });
}

export default async function Page({ params }: Props) {
  const service = getService((await Promise.resolve(params)).id);
  if (!service) notFound();
  return <ServiceDetails service={service} />;
}
