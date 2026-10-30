import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { fetchBlogPosts } from "@/lib/blog";
import Blog from "@/screens/Blog";

export const revalidate = 600;

const loadPosts = () => fetchBlogPosts().catch(() => []);

export async function generateMetadata(): Promise<Metadata> {
  const posts = await loadPosts();
  return buildMetadata({
    title: "Career & Hiring Blog",
    description: "Career advice, hiring trends, salary guides and job-search tips from the RecruitKr team.",
    path: "/blog",
    // An index with no posts is a thin page; keep it out of the index until
    // there is something to list (the sitemap applies the same rule).
    noindex: posts.length === 0,
    keywords: ["career advice", "hiring trends", "job search tips", "resume tips", "interview tips", "salary guides", "HR insights"],
  });
}

export default async function Page() {
  // Server-rendered so the post list is in the HTML; it used to load only in
  // the browser, leaving crawlers an empty shell.
  return <Blog initialPosts={await loadPosts()} />;
}
