import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const publicDir = path.join(projectRoot, "public");
const sitemapPath = path.join(publicDir, "sitemap.xml");
const siteUrl = "https://www.recruitkr.com";

const staticRoutes = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/services", changefreq: "monthly", priority: "0.9" },
  { path: "/services/recruitment", changefreq: "monthly", priority: "0.8" },
  { path: "/services/payroll", changefreq: "monthly", priority: "0.8" },
  { path: "/services/staffing", changefreq: "monthly", priority: "0.8" },
  { path: "/services/gig", changefreq: "monthly", priority: "0.8" },
  { path: "/services/hr", changefreq: "monthly", priority: "0.8" },
  { path: "/services/career", changefreq: "monthly", priority: "0.8" },
  { path: "/sectors", changefreq: "monthly", priority: "0.7" },
  { path: "/process", changefreq: "monthly", priority: "0.7" },
  { path: "/why-us", changefreq: "monthly", priority: "0.7" },
  { path: "/our-team", changefreq: "monthly", priority: "0.7" },
  { path: "/contact", changefreq: "monthly", priority: "0.7" },
  { path: "/faqs", changefreq: "monthly", priority: "0.6" },
  { path: "/blog", changefreq: "weekly", priority: "0.8" },
];

const normalizeSlug = (slug, title, index) => {
  const source = `${slug || title || `blog-post-${index + 1}`}`.trim().toLowerCase();

  return (
    source
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/-{2,}/g, "-")
      .replace(/(^-|-$)/g, "") || `blog-post-${index + 1}`
  );
};

const getIsoDate = (input) => {
  const date = input ? new Date(input) : new Date();
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }

  return date.toISOString().slice(0, 10);
};

const xmlEscape = (value) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const readEnvFile = async (filename) => {
  try {
    return await readFile(path.join(projectRoot, filename), "utf8");
  } catch {
    return "";
  }
};

const parseEnv = (content) =>
  content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .reduce((acc, line) => {
      const separatorIndex = line.indexOf("=");
      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim();
      acc[key] = value.replace(/^['"]|['"]$/g, "");
      return acc;
    }, {});

const resolveApiRoot = async () => {
  const envFromFiles = {
    ...parseEnv(await readEnvFile(".env")),
    ...parseEnv(await readEnvFile(".env.local")),
  };
  const rawApiUrl = process.env.VITE_API_URL || envFromFiles.VITE_API_URL || "";
  if (!rawApiUrl) return null;

  return rawApiUrl.replace(/\/api\/v\d+$/, "").replace(/\/$/, "");
};

const fetchPublishedBlogs = async () => {
  const apiRoot = await resolveApiRoot();
  if (!apiRoot) return [];

  try {
    const response = await fetch(`${apiRoot}/api/blogposts?published=true`);
    if (!response.ok) return [];

    const payload = await response.json();
    const posts = Array.isArray(payload?.blogPosts) ? payload.blogPosts : [];

    return posts.map((post, index) => ({
      slug: normalizeSlug(post?.slug, post?.title, index),
      lastmod: getIsoDate(post?.updatedAt || post?.publishedAt || post?.createdAt),
    }));
  } catch (error) {
    console.warn("[sitemap] unable to fetch published blogs; using static routes only", error instanceof Error ? error.message : error);
    return [];
  }
};

const buildUrlEntry = ({ loc, lastmod, changefreq, priority }) => `  <url>
    <loc>${xmlEscape(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;

const generateSitemapXml = async () => {
  const today = getIsoDate();
  const blogEntries = await fetchPublishedBlogs();
  const entries = [
    ...staticRoutes.map((route) =>
      buildUrlEntry({
        loc: `${siteUrl}${route.path}`,
        lastmod: today,
        changefreq: route.changefreq,
        priority: route.priority,
      }),
    ),
    ...blogEntries.map((blog) =>
      buildUrlEntry({
        loc: `${siteUrl}/blog/${blog.slug}`,
        lastmod: blog.lastmod,
        changefreq: "weekly",
        priority: "0.7",
      }),
    ),
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>
`;
};

const xml = await generateSitemapXml();
await writeFile(sitemapPath, xml, "utf8");
console.info(`[sitemap] wrote ${sitemapPath}`);
