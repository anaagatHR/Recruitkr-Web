"use client";
import { useEffect, useState } from "react";
import { Link, useParams } from "@/compat/router";

import BlogCard from "@/components/blogCard";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import PageSeo from "@/components/PageSeo";
import { API_ROOT } from "@/lib/api";
import { getRenderableBlogHtml } from "@/lib/blogHtml";
import { fetchBlogPost, fetchBlogPosts, getCachedBlogPosts, type BlogPost } from "@/lib/blog";

const detailPlaceholderImageClass =
  "flex w-full items-end rounded-xl bg-[radial-gradient(circle_at_top,_rgba(38,74,127,0.96),_rgba(38,74,127,0.82)_42%,_rgba(105,164,79,0.9)_100%)] p-6 text-2xl font-bold leading-tight text-white";
const SITE_URL = "https://www.recruitkr.com";

const BlogPostApi = () => {
  const { slug } = useParams();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedBlogs, setRelatedBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const publishedDate = post?.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString()
    : null;
  const seoDescription = post?.excerpt?.trim() || "Read the latest hiring and workforce insights from RecruitKr.";
  const canonicalPath = post?.slug ? `/blog/${post.slug}` : "/blog";
  const articleStructuredData = post
    ? [
        {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: post.title,
        description: seoDescription,
        image: post.coverImage?.url ? [post.coverImage.url] : undefined,
        author: {
          "@type": "Person",
          name: post.authorName || "RecruitKr Editorial",
        },
        publisher: {
          "@type": "Organization",
          name: "RecruitKr",
          logo: {
            "@type": "ImageObject",
            url: "https://www.recruitkr.com/favicon.png?v=5",
          },
        },
        datePublished: post.publishedAt || undefined,
        dateModified: post.updatedAt || post.publishedAt || undefined,
        mainEntityOfPage: `${SITE_URL}${canonicalPath}`,
        keywords: post.tags.join(", "),
        articleSection: post.tags[0] || "Recruitment",
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: SITE_URL,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Blog",
            item: `${SITE_URL}/blog`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: post.title,
            item: `${SITE_URL}${canonicalPath}`,
          },
        ],
      }
    ]
    : null;

  useEffect(() => {
    const loadPost = async () => {
      if (!slug) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        const cachedBlogs = getCachedBlogPosts();
        const [data, allBlogs] = await Promise.all([
          fetchBlogPost(slug),
          cachedBlogs.length > 0 ? Promise.resolve(cachedBlogs) : fetchBlogPosts(),
        ]);
        setPost(data);
        setRelatedBlogs(
          allBlogs
            .filter((blog) => blog.slug !== slug)
            .filter((blog) =>
              blog.tags.some((tag) => data.tags.includes(tag)),
            )
            .slice(0, 3),
        );
      } catch (err) {
        setPost(null);
        setRelatedBlogs([]);
        setError(err instanceof Error ? err.message : "Failed to load blog post");
      } finally {
        setLoading(false);
      }
    };

    void loadPost();
  }, [slug]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[linear-gradient(180deg,#f7fafc_0%,#ffffff_22%,#f7fbff_100%)]">
      <PageSeo
        title={post ? `${post.title} | RecruitKr Blog` : "RecruitKr Blog"}
        description={seoDescription}
        canonicalPath={canonicalPath}
        image={post?.coverImage?.url || undefined}
        imageAlt={post?.title || "RecruitKr blog post"}
        keywords={post?.tags?.length ? post.tags : ["RecruitKr blog", "recruitment insights"]}
        type="article"
        publishedTime={post?.publishedAt || null}
        modifiedTime={post?.updatedAt || post?.publishedAt || null}
        section={post?.tags?.[0] || "RecruitKr Journal"}
        tags={post?.tags || []}
        structuredData={articleStructuredData}
      />
      <Navbar />

      <main className="py-6 pt-28">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          {loading ? (
            <div className="rounded-xl border border-border bg-white p-8 text-center shadow-sm">
              <p className="text-sm text-muted-foreground">Loading blog post...</p>
            </div>
          ) : !post ? (
            <div className="rounded-xl border border-border bg-white p-8 text-center shadow-sm">
              <h1 className="text-3xl font-bold">Post not found</h1>
              <p className="mt-2 text-sm text-muted-foreground">{error || "Post not found."}</p>
              <Link
                to="/blog"
                className="btn-gradient mt-6 inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold transition-transform hover:scale-105"
              >
                Back to Blog
              </Link>
            </div>
          ) : (
            <article className="space-y-5 sm:space-y-6">
              <div className="rounded-2xl border border-[#264a7f]/10 bg-white p-4 shadow-sm sm:p-5">
                {post.coverImage?.url ? (
                  <img
                    src={post.coverImage.url}
                    alt={post.title}
                    width={1200}
                    height={675}
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                    className="h-48 w-full rounded-xl object-cover sm:h-56"
                  />
                ) : (
                  <div className={`${detailPlaceholderImageClass} h-48 sm:h-56`}>{post.title}</div>
                )}

                <div className="mt-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                    {post.tags[0] || "RecruitKr Journal"}
                  </p>
                  <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 sm:text-[2rem]">
                    {post.title}
                  </h1>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    <span className="font-medium text-slate-700">{post.authorName || "RecruitKr Editorial"}</span>
                    {publishedDate && (
                      <>
                        <span>&bull;</span>
                        <time dateTime={post.publishedAt ?? ""}>{publishedDate}</time>
                      </>
                    )}
                    <span>&bull;</span>
                    <span>{post.readingTime}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-white p-4 shadow-sm sm:p-6">
                {post.excerpt && (
                  <p className="text-sm leading-relaxed text-gray-700">{post.excerpt}</p>
                )}

                <div
                  className="blog-prose prose prose-sm mt-4 max-w-none overflow-hidden break-words text-slate-700 prose-headings:mt-4 prose-headings:scroll-mt-28 prose-headings:font-semibold prose-headings:text-slate-900 prose-h2:text-xl prose-h3:text-lg prose-p:mt-2 prose-p:text-sm prose-p:leading-relaxed prose-ul:mt-3 prose-ul:pl-5 prose-ol:mt-3 prose-ol:pl-5 prose-li:mt-1 prose-img:my-4 prose-img:w-full prose-img:max-w-full prose-img:rounded-xl prose-img:object-contain prose-a:text-primary md:prose-base"
                  dangerouslySetInnerHTML={{
                    __html: getRenderableBlogHtml(post.contentHtml, post.content, API_ROOT),
                  }}
                />

                <div className="mt-8 border-t border-border pt-6">
                  <Link
                    to="/blog"
                    className="inline-flex items-center justify-center rounded-lg border border-[#264a7f]/15 bg-white px-4 py-2 text-sm font-semibold text-[#264a7f] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#264a7f]/5"
                  >
                    Back to Blog
                  </Link>
                </div>
              </div>

              <section className="rounded-2xl border border-border bg-white p-4 shadow-sm sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-slate-900">Related Blogs</h2>
                  <Link
                    to="/blog"
                    className="text-sm font-medium text-primary transition hover:underline"
                  >
                    View all
                  </Link>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {relatedBlogs.map((relatedBlog) => (
                    <BlogCard key={relatedBlog.slug} blog={relatedBlog} />
                  ))}
                </div>

                {relatedBlogs.length === 0 && (
                  <p className="mt-4 text-sm text-muted-foreground">
                    No related blogs available right now.
                  </p>
                )}
              </section>
            </article>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BlogPostApi;
