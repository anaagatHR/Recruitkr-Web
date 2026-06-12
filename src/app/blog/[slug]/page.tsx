import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import BlogPostApi from "@/screens/BlogPostApi";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const title = params.slug.replace(/-/g, " ");
  return buildMetadata({
    title,
    description: `Read "${title}" on the RecruitKr blog - career and hiring insights.`,
    path: `/blog/${params.slug}`,
    type: "article",
  });
}

export default function Page() {
  return <BlogPostApi />;
}
