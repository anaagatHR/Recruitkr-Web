"use client";
import { useEffect } from "react";

type PageSeoProps = {
  title: string;
  description: string;
  canonicalPath?: string;
  image?: string;
  imageAlt?: string;
  type?: "website" | "article";
  keywords?: string[];
  noindex?: boolean;
  publishedTime?: string | null;
  modifiedTime?: string | null;
  section?: string;
  tags?: string[];
  structuredData?: Record<string, unknown> | Array<Record<string, unknown>> | null;
};

const SITE_NAME = "RecruitKr";
const SITE_URL = "https://www.recruitkr.com";
const DEFAULT_IMAGE = `${SITE_URL}/favicon.png?v=5`;

const removeElement = (selector: string) => {
  const element = document.head.querySelector(selector);
  element?.remove();
};

const upsertMeta = (selector: string, attributes: Record<string, string>) => {
  let element = document.head.querySelector(selector) as HTMLMetaElement | null;

  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    element?.setAttribute(key, value);
  });
};

const upsertLink = (selector: string, attributes: Record<string, string>) => {
  let element = document.head.querySelector(selector) as HTMLLinkElement | null;

  if (!element) {
    element = document.createElement("link");
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    element?.setAttribute(key, value);
  });
};

const PageSeo = ({
  title,
  description,
  canonicalPath = "/",
  image,
  imageAlt,
  type = "website",
  keywords = [],
  noindex = false,
  publishedTime = null,
  modifiedTime = null,
  section,
  tags = [],
  structuredData = null,
}: PageSeoProps) => {
  useEffect(() => {
    const canonicalUrl = canonicalPath.startsWith("http")
      ? canonicalPath
      : `${SITE_URL}${canonicalPath.startsWith("/") ? canonicalPath : `/${canonicalPath}`}`;
    const resolvedImage = image?.trim() || DEFAULT_IMAGE;
    const robotsContent = noindex
      ? "noindex,nofollow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"
      : "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1";
    const normalizedKeywords = keywords
      .map((keyword) => keyword.trim())
      .filter(Boolean)
      .join(", ");

    document.title = title;

    upsertMeta('meta[name="description"]', {
      name: "description",
      content: description,
    });
    upsertMeta('meta[name="author"]', {
      name: "author",
      content: SITE_NAME,
    });
    upsertMeta('meta[name="robots"]', {
      name: "robots",
      content: robotsContent,
    });
    upsertMeta('meta[name="googlebot"]', {
      name: "googlebot",
      content: robotsContent,
    });
    if (normalizedKeywords) {
      upsertMeta('meta[name="keywords"]', {
        name: "keywords",
        content: normalizedKeywords,
      });
    } else {
      removeElement('meta[name="keywords"]');
    }
    upsertMeta('meta[property="og:title"]', {
      property: "og:title",
      content: title,
    });
    upsertMeta('meta[property="og:description"]', {
      property: "og:description",
      content: description,
    });
    upsertMeta('meta[property="og:type"]', {
      property: "og:type",
      content: type,
    });
    upsertMeta('meta[property="og:url"]', {
      property: "og:url",
      content: canonicalUrl,
    });
    upsertMeta('meta[property="og:image"]', {
      property: "og:image",
      content: resolvedImage,
    });
    upsertMeta('meta[property="og:site_name"]', {
      property: "og:site_name",
      content: SITE_NAME,
    });
    upsertMeta('meta[property="og:locale"]', {
      property: "og:locale",
      content: "en_IN",
    });
    upsertMeta('meta[property="og:image:alt"]', {
      property: "og:image:alt",
      content: imageAlt?.trim() || title,
    });
    upsertMeta('meta[name="twitter:card"]', {
      name: "twitter:card",
      content: "summary_large_image",
    });
    upsertMeta('meta[name="twitter:title"]', {
      name: "twitter:title",
      content: title,
    });
    upsertMeta('meta[name="twitter:description"]', {
      name: "twitter:description",
      content: description,
    });
    upsertMeta('meta[name="twitter:image"]', {
      name: "twitter:image",
      content: resolvedImage,
    });
    upsertMeta('meta[name="twitter:image:alt"]', {
      name: "twitter:image:alt",
      content: imageAlt?.trim() || title,
    });
    upsertLink('link[rel="canonical"]', {
      rel: "canonical",
      href: canonicalUrl,
    });

    if (type === "article" && publishedTime) {
      upsertMeta('meta[property="article:published_time"]', {
        property: "article:published_time",
        content: publishedTime,
      });
    } else {
      removeElement('meta[property="article:published_time"]');
    }

    if (type === "article" && modifiedTime) {
      upsertMeta('meta[property="article:modified_time"]', {
        property: "article:modified_time",
        content: modifiedTime,
      });
    } else {
      removeElement('meta[property="article:modified_time"]');
    }

    if (type === "article" && section?.trim()) {
      upsertMeta('meta[property="article:section"]', {
        property: "article:section",
        content: section.trim(),
      });
    } else {
      removeElement('meta[property="article:section"]');
    }

    const normalizedTags = tags.map((tag) => tag.trim()).filter(Boolean);
    const existingTagMetas = Array.from(document.head.querySelectorAll('meta[property="article:tag"]'));
    existingTagMetas.forEach((tagMeta) => tagMeta.remove());
    normalizedTags.forEach((tag) => {
      const meta = document.createElement("meta");
      meta.setAttribute("property", "article:tag");
      meta.setAttribute("content", tag);
      document.head.appendChild(meta);
    });

    const existingScript = document.getElementById("page-seo-structured-data");
    if (structuredData) {
      const script = existingScript || document.createElement("script");
      script.id = "page-seo-structured-data";
      script.setAttribute("type", "application/ld+json");
      script.textContent = JSON.stringify(structuredData);
      if (!existingScript) {
        document.head.appendChild(script);
      }
    } else if (existingScript) {
      existingScript.remove();
    }
  }, [
    canonicalPath,
    description,
    image,
    imageAlt,
    keywords,
    modifiedTime,
    noindex,
    publishedTime,
    section,
    structuredData,
    tags,
    title,
    type,
  ]);

  return null;
};

export default PageSeo;
