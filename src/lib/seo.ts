import type { Metadata } from "next";

type PageSeoInput = {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  image?: string;
  noindex?: boolean;
  type?: "website" | "article";
};

/**
 * Builds a complete, SEO-rich Metadata object for a route segment.
 * Title is passed bare; the root layout's template appends "| RecruitKr".
 */
export function buildMetadata({
  title,
  description,
  path,
  keywords,
  image = "/favicon.png",
  noindex = false,
  type = "website",
}: PageSeoInput): Metadata {
  return {
    title,
    description,
    keywords,
    alternates: { canonical: path },
    robots: noindex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      type,
      url: path,
      title,
      description,
      images: [{ url: image, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}
