const base64ImagePattern = /<img[^>]+src=["']data:image\/[^"']+["'][^>]*>/gi;
const imageSrcPattern = /<img[^>]+src=(["'])([^"']+)\1[^>]*>/gi;

const decodeHtmlEntities = (html: string) =>
  html
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&amp;/gi, "&");

export const stripBase64Images = (html: string) => html.replace(base64ImagePattern, "");

export const cleanBlogHtml = (html: string) =>
  stripBase64Images(decodeHtmlEntities(html))
    .replace(/&nbsp;|\u00A0/g, " ")
    .replace(/\sstyle="[^"]*"/gi, "")
    .replace(/\sclass="[^"]*"/gi, "")
    .replace(/\sid="[^"]*"/gi, "")
    .replace(/<span>(.*?)<\/span>/gi, "$1")
    .replace(/<p>\s*<\/p>/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();

export const paragraphsToHtml = (paragraphs: string[] = []) =>
  paragraphs
    .filter(Boolean)
    .map((paragraph) => `<p>${paragraph}</p>`)
    .join("");

export const normalizeBlogAssetUrl = (rawUrl?: string | null, assetBaseUrl = "") => {
  const trimmedUrl = rawUrl?.trim();

  if (!trimmedUrl) return null;
  if (!assetBaseUrl) return trimmedUrl;

  if (trimmedUrl.startsWith("/api/blogposts/images/")) {
    return `${assetBaseUrl.replace(/\/$/, "")}${trimmedUrl}`;
  }

  try {
    const parsed = new URL(trimmedUrl);
    if (parsed.pathname.startsWith("/api/blogposts/images/")) {
      return `${assetBaseUrl.replace(/\/$/, "")}${parsed.pathname}`;
    }
  } catch {
    return trimmedUrl;
  }

  return trimmedUrl;
};

export const normalizeBlogImageUrls = (html: string, assetBaseUrl = "") =>
  html.replace(/<img([^>]*?)src=(["'])([^"']+)\2([^>]*)>/gi, (_match, beforeSrc, quote, rawSrc, afterSrc) => {
    const trimmedSrc = rawSrc.trim();

    if (!trimmedSrc || trimmedSrc.startsWith("data:image/") || trimmedSrc.startsWith("blob:")) {
      return "";
    }

    let normalizedSrc = trimmedSrc;

    normalizedSrc = normalizeBlogAssetUrl(trimmedSrc, assetBaseUrl) || trimmedSrc;

    const normalizedAttributes = `${beforeSrc}${afterSrc}`
      .replace(/\sloading=(["']).*?\1/gi, "")
      .replace(/\sdecoding=(["']).*?\1/gi, "")
      .replace(/\sfetchpriority=(["']).*?\1/gi, "")
      .replace(/\swidth=(["']).*?\1/gi, "")
      .replace(/\sheight=(["']).*?\1/gi, "");

    return `<img${normalizedAttributes} src=${quote}${normalizedSrc}${quote} loading="lazy" decoding="async" width="1200" height="675">`;
  });

export const getFirstImageFromBlogHtml = (html: string, assetBaseUrl = "") => {
  const match = html.match(/<img[^>]+src=(["'])([^"']+)\1/i);
  if (!match?.[2]) return null;

  return normalizeBlogAssetUrl(match[2], assetBaseUrl);
};

export const extractImageUrlsFromBlogHtml = (html: string) =>
  Array.from(html.matchAll(imageSrcPattern), (match) => match[2]?.trim()).filter(
    (value): value is string => Boolean(value),
  );

export const getRenderableBlogHtml = (contentHtml?: string, content: string[] = [], assetBaseUrl = "") =>
  normalizeBlogImageUrls(cleanBlogHtml(contentHtml?.trim() || "") || paragraphsToHtml(content), assetBaseUrl);

export const getPlainTextFromHtml = (html: string) =>
  html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
