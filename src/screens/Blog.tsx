"use client";
import { startTransition, useEffect, useState } from "react";
import { Search, Sparkles } from "lucide-react";

import BlogCard from "@/components/blogCard";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import PageSeo from "@/components/PageSeo";
import { fetchBlogPosts, getCachedBlogPosts, type BlogPost } from "@/lib/blog";

const INITIAL_BLOG_COUNT = 6;
const BLOG_COUNT_STEP = 6;
const SITE_URL = "https://www.recruitkr.com";

const Blog = () => {
  // Seed empty to match the server render; the sessionStorage cache is read in
  // an effect after mount so the first client render stays identical to SSR
  // (reading the cache during render causes a hydration mismatch on <select>).
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [visibleCount, setVisibleCount] = useState(INITIAL_BLOG_COUNT);

  const loadPosts = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetchBlogPosts();
      startTransition(() => {
        setBlogs(response);
        setVisibleCount(INITIAL_BLOG_COUNT);
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load blog posts";
      console.error("[BlogPage] failed to load blogs", err);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Show cached posts instantly (client-only), then refresh from the API.
    const cached = getCachedBlogPosts();
    if (cached.length > 0) {
      setBlogs(cached);
      setLoading(false);
    }
    void loadPosts();
  }, []);

  useEffect(() => {
    setVisibleCount(INITIAL_BLOG_COUNT);
  }, [searchQuery, selectedCategory]);

  const categories = ["All", ...Array.from(new Set(blogs.flatMap((blog) => blog.tags).filter(Boolean)))];
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredBlogs = blogs.filter((blog) => {
    const matchesSearch =
      normalizedQuery.length === 0 ||
      blog.title.toLowerCase().includes(normalizedQuery);
    const matchesCategory =
      selectedCategory === "All" || blog.tags.includes(selectedCategory);

    return matchesSearch && matchesCategory;
  });
  const displayedBlogs = filteredBlogs.slice(0, visibleCount);
  const hasMoreBlogs = visibleCount < filteredBlogs.length;
  const pageStructuredData = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "RecruitKr Journal",
      description: "Hiring, recruitment, staffing, payroll, and employer branding insights from RecruitKr.",
      url: `${SITE_URL}/blog`,
      isPartOf: {
        "@type": "WebSite",
        name: "RecruitKr",
        url: SITE_URL,
      },
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
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: blogs.slice(0, 10).map((blog, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${SITE_URL}/blog/${blog.slug}`,
        name: blog.title,
      })),
    },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden bg-[linear-gradient(180deg,#f7fafc_0%,#ffffff_22%,#f7fbff_100%)]">
      <PageSeo
        title="RecruitKr Blog | Hiring, Recruitment and HR Insights"
        description="Read RecruitKr blog articles on hiring, recruitment strategy, employer branding, staffing, payroll, and workforce growth."
        canonicalPath="/blog"
        keywords={[
          "RecruitKr blog",
          "hiring blog India",
          "recruitment insights",
          "staffing blog",
          "payroll and HR articles",
          "employer branding blog",
        ]}
        type="website"
        structuredData={pageStructuredData}
      />
      <Navbar />

      <main className="pt-28 pb-20">
        <div className="container mx-auto px-4 sm:px-6">
          <header className="mx-auto max-w-3xl text-center">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              <Sparkles size={14} /> Insights
            </p>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
              RecruitKr{" "}
              <span className="bg-gradient-to-r from-[#264a7f] via-[#69a44f] to-[#e59f56] bg-clip-text text-transparent">
                Journal
              </span>
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-base">
              Thoughtful notes on hiring, growth, employer branding, and better teams.
            </p>
          </header>

          <section className="mx-auto mt-8 max-w-6xl rounded-[28px] border border-[#264a7f]/10 bg-white/90 p-4 shadow-[0_24px_80px_rgba(38,74,127,0.08)] backdrop-blur sm:mt-10 sm:p-5">
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
              <label className="flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3">
                <Search size={18} className="shrink-0 text-muted-foreground" />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search by title"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </label>

              <select
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value)}
                className="rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </section>

          {error && (
            <div className="mx-auto mt-10 max-w-2xl rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <p>{error}</p>
              <button
                type="button"
                onClick={() => void loadPosts()}
                className="mt-3 inline-flex rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
              >
                Retry
              </button>
            </div>
          )}

          {loading ? (
            <div className="mx-auto mt-10 grid max-w-6xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-5 lg:gap-6">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="overflow-hidden rounded-[24px] border border-border bg-card"
                >
                  <div className="h-44 animate-pulse bg-muted" />
                  <div className="space-y-3 p-4 sm:p-5">
                    <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
                    <div className="h-5 w-4/5 animate-pulse rounded bg-muted" />
                    <div className="h-4 w-full animate-pulse rounded bg-muted" />
                    <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="mx-auto mt-8 flex max-w-6xl flex-col items-start justify-between gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center">
                <p>
                  {filteredBlogs.length} article{filteredBlogs.length === 1 ? "" : "s"} found
                </p>
                {(searchQuery || selectedCategory !== "All") && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("All");
                      setVisibleCount(INITIAL_BLOG_COUNT);
                    }}
                    className="rounded-full border border-border bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-foreground transition hover:border-primary/40 hover:text-primary"
                  >
                    Clear Filters
                  </button>
                )}
              </div>

              <section className="mx-auto mt-6 grid max-w-6xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-5 lg:gap-6">
                {displayedBlogs.map((post, index) => (
                  <BlogCard key={post.slug} blog={post} prioritizeImage={index < 3} />
                ))}

                {filteredBlogs.length === 0 && (
                  <div className="col-span-full rounded-[28px] border border-dashed border-border bg-white p-10 text-center text-sm text-muted-foreground shadow-[0_18px_60px_rgba(15,23,42,0.05)]">
                    <p className="text-base font-semibold text-foreground">No blogs available</p>
                    <p className="mt-2">
                      Try a different search term or switch the category filter back to `All`.
                    </p>
                  </div>
                )}
              </section>

              {filteredBlogs.length > INITIAL_BLOG_COUNT && (
                <div className="mx-auto mt-8 flex max-w-6xl justify-center">
                  {hasMoreBlogs ? (
                    <button
                      type="button"
                      onClick={() => setVisibleCount((current) => Math.min(current + BLOG_COUNT_STEP, filteredBlogs.length))}
                      className="btn-gradient rounded-full px-6 py-3 text-sm font-semibold transition-transform hover:scale-[1.02]"
                    >
                      Show More Articles
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setVisibleCount(INITIAL_BLOG_COUNT)}
                      className="rounded-full border border-border bg-white px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary"
                    >
                      Show Less
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Blog;

