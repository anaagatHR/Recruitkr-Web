import { apiGet } from "@/lib/api";
import { apiPatch, apiPost } from "@/lib/api";
import { API_ROOT } from "@/lib/api";
import {
  getRenderableBlogHtml,
  normalizeBlogAssetUrl,
} from "@/lib/blogHtml";

const BLOG_CACHE_KEY = "recruitkr.blog.cache.v1";
const BLOG_CACHE_TTL_MS = 5 * 60 * 1000;

export type BlogImageAsset = {
  url: string;
  fileId: string;
  name: string;
  size: number;
  type: string;
};

export type BlogPost = {
  _id?: string;
  slug: string;
  title: string;
  excerpt: string;
  authorName?: string;
  coverImage?: BlogImageAsset | null;
  contentHtml?: string;
  publishedAt: string | null;
  readingTime: string;
  tags: string[];
  content: string[];
  contentImages: BlogImageAsset[];
  status?: "draft" | "published";
  createdAt?: string | null;
  updatedAt?: string | null;
};

type BlogListResponse = {
  success: boolean;
  blogPosts?: Partial<BlogPost>[];
  meta?: {
    count?: number;
  };
};

type BlogDetailResponse = {
  success: boolean;
  data: BlogPost;
};

type AdminBlogListResponse = {
  success: boolean;
  blogPosts?: Partial<BlogPost>[];
  meta?: {
    count?: number;
  };
};

export type BlogEditorPayload = {
  title: string;
  slug?: string;
  excerpt: string;
  authorName?: string;
  coverImage?: BlogImageAsset | null;
  contentHtml: string;
  contentImages: BlogImageAsset[];
  tags: string[];
  readingTime: string;
  status: "draft" | "published";
  publishedAt?: string | null;
};

const normalizeBlogImageAsset = (asset?: Partial<BlogImageAsset> | string | null): BlogImageAsset | null => {
  if (!asset) return null;

  if (typeof asset === "string") {
    const normalizedUrl = normalizeBlogAssetUrl(asset, API_ROOT);
    return normalizedUrl
      ? {
          url: normalizedUrl,
          fileId: "",
          name: "legacy-blog-image",
          size: 1,
          type: "image/*",
        }
      : null;
  }

  const normalizedUrl = normalizeBlogAssetUrl(asset.url, API_ROOT);
  const fileId = asset.fileId?.trim();
  const name = asset.name?.trim();
  const type = asset.type?.trim();
  const size = Number(asset.size);

  if (!normalizedUrl || !fileId || !name || !type || !Number.isFinite(size) || size <= 0) {
    return null;
  }

  return {
    url: normalizedUrl,
    fileId,
    name,
    size,
    type,
  };
};

const normalizeSlug = (slug?: string | null, fallbackTitle?: string | null, index = 0) => {
  const source = (slug?.trim() || fallbackTitle?.trim() || `blog-post-${index + 1}`).toLowerCase();

  const normalized = source
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/(^-|-$)/g, "");

  return normalized || `blog-post-${index + 1}`;
};

const compareByPublishedDateDesc = (a: BlogPost, b: BlogPost) => {
  const aTime = Date.parse(a.publishedAt || a.updatedAt || a.createdAt || "");
  const bTime = Date.parse(b.publishedAt || b.updatedAt || b.createdAt || "");

  if (Number.isFinite(aTime) && Number.isFinite(bTime)) {
    return bTime - aTime;
  }

  if (Number.isFinite(aTime)) return -1;
  if (Number.isFinite(bTime)) return 1;
  return a.title.localeCompare(b.title);
};

const normalizeBlogPost = (post: Partial<BlogPost>, index = 0): BlogPost => {
  const renderedContentHtml = getRenderableBlogHtml(
    post.contentHtml,
    Array.isArray(post.content) ? post.content : [],
    API_ROOT,
  );
  const normalizedCoverImage = normalizeBlogImageAsset(post.coverImage);
  const normalizedContentImages = Array.isArray(post.contentImages)
    ? post.contentImages.map((asset) => normalizeBlogImageAsset(asset)).filter(Boolean) as BlogImageAsset[]
    : [];

  return {
    _id: post._id,
    slug: normalizeSlug(post.slug, post.title, index),
    title: post.title?.trim() || "Untitled blog post",
    excerpt: post.excerpt?.trim() || "No description available.",
    authorName: post.authorName?.trim() || "RecruitKr Editorial",
    coverImage: normalizedCoverImage,
    contentHtml: renderedContentHtml,
    publishedAt: post.publishedAt ?? null,
    readingTime: post.readingTime?.trim() || "5 min read",
    tags: Array.isArray(post.tags) ? post.tags.filter(Boolean) : [],
    content: Array.isArray(post.content) ? post.content.filter(Boolean) : [],
    contentImages: normalizedContentImages,
    status: post.status,
    createdAt: post.createdAt ?? null,
    updatedAt: post.updatedAt ?? null,
  };
};

const persistBlogCache = (posts: BlogPost[]) => {
  if (typeof window === "undefined") return;

  try {
    sessionStorage.setItem(
      BLOG_CACHE_KEY,
      JSON.stringify({
        savedAt: Date.now(),
        posts,
      }),
    );
  } catch (error) {
    console.warn("[blog] unable to persist blog cache", error);
    try {
      sessionStorage.removeItem(BLOG_CACHE_KEY);
    } catch {
      // Ignore storage cleanup failures.
    }
  }
};

export const getCachedBlogPosts = (): BlogPost[] => {
  if (typeof window === "undefined") return [];

  try {
    const raw = sessionStorage.getItem(BLOG_CACHE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as {
      savedAt?: number;
      posts?: BlogPost[];
    };

    if (!parsed?.savedAt || Date.now() - parsed.savedAt > BLOG_CACHE_TTL_MS) {
      sessionStorage.removeItem(BLOG_CACHE_KEY);
      return [];
    }

    return Array.isArray(parsed.posts) ? parsed.posts : [];
  } catch {
    return [];
  }
};

export const fetchBlogPosts = async () => {
  const response = await apiGet<BlogListResponse>("/api/blogposts?published=true");

  const rawPosts = Array.isArray(response.blogPosts)
    ? response.blogPosts
    : [];

  const posts = Array.isArray(rawPosts)
    ? rawPosts.map((post, index) => normalizeBlogPost(post, index))
    : [];
  posts.sort(compareByPublishedDateDesc);
  persistBlogCache(posts);
  console.info("[blog] fetched blog posts", {
    count: posts.length,
    slugs: posts.map((post) => post.slug),
    responseMeta: response.meta ?? null,
  });
  return posts;
};

export const fetchBlogPost = async (slug: string) => {
  const response = await apiGet<BlogDetailResponse>(`/api/blogposts/${slug}`);
  const post = normalizeBlogPost(response.data);
  console.info("[blog] fetched single blog post", {
    slug: post.slug,
    title: post.title,
  });
  return post;
};

export const fetchAdminBlogPosts = async () => {
  const response = await apiGet<AdminBlogListResponse>("/blogs/admin/all", true);
  const posts = Array.isArray(response.blogPosts)
    ? response.blogPosts.map((post, index) => normalizeBlogPost(post, index))
    : [];
  return posts;
};

export const createAdminBlogPost = async (payload: BlogEditorPayload) => {
  const response = await apiPost<BlogDetailResponse>("/blogs", payload, true);
  return normalizeBlogPost(response.data);
};

export const updateAdminBlogPost = async (blogId: string, payload: Partial<BlogEditorPayload>) => {
  const response = await apiPatch<BlogDetailResponse>(`/blogs/${blogId}`, payload, true);
  return normalizeBlogPost(response.data);
};

export const uploadBlogEditorImage = async (file: File) => {
  const formData = new FormData();
  formData.append("image", file);

  const response = await apiPost<{
    success?: boolean;
    data?: Partial<BlogImageAsset>;
  }>("/api/blogposts/images", formData, true);

  const asset = normalizeBlogImageAsset(response.data);
  if (!response.success || !asset) {
    throw new Error("Failed to upload blog image");
  }

  return asset;
};
