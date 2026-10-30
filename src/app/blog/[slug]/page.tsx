import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { buildMetadata } from "@/lib/seo";
import { fetchBlogPost, fetchBlogPosts, type BlogPost } from "@/lib/blog";
import BlogPostApi from "@/screens/BlogPostApi";

export const revalidate = 600;

type Props = { params: Promise<{ slug: string }> | { slug: string } };

/**
 * `post` is null when the API is unreachable: the page then falls back to the
 * client fetch rather than 404ing a real article. `missing` means the API said
 * the post doesn't exist.
 */
const loadPost = cache(async (slug: string): Promise<{ post: BlogPost | null; missing: boolean }> => {
  try {
    return { post: await fetchBlogPost(slug), missing: false };
  } catch (error) {
    const status = (error as { status?: number })?.status;
    return { post: null, missing: status === 404 || status === 410 };
  }
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await Promise.resolve(params);
  const { post } = await loadPost(slug);
  const title = post?.title || slug.replace(/-/g, " ");
  return buildMetadata({
    title,
    description: post?.excerpt || `Read "${title}" on the RecruitKr blog - career and hiring insights.`,
    path: `/blog/${slug}`,
    type: "article",
    ...(post?.coverImage?.url ? { image: post.coverImage.url } : {}),
  });
}

export default async function Page({ params }: Props) {
  const { slug } = await Promise.resolve(params);
  const { post, missing } = await loadPost(slug);
  if (missing) notFound();

  const related = post
    ? (await fetchBlogPosts().catch(() => []))
        .filter((blog) => blog.slug !== slug && blog.tags.some((tag) => post.tags.includes(tag)))
        .slice(0, 3)
    : [];

  return <BlogPostApi initialPost={post} initialRelated={related} />;
}
