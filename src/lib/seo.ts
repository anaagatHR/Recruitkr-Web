import type { Metadata } from "next";

const SITE_NAME = "RecruitKr";

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
  // The root layout's `template` only rewrites `metadata.title` — it never
  // touches openGraph/twitter. So the brand has to be appended by hand here,
  // or social cards would show a bare "Browse Jobs" with no company name.
  const socialTitle = `${title} | ${SITE_NAME}`;

  return {
    title,
    description,
    keywords,
    alternates: { canonical: path },
    // `follow` stays true even when noindexed: these pages (an empty city
    // landing page, a job page rendered during a backend outage) still carry
    // links to real jobs. `nofollow` would keep Google's crawler from
    // following them, stranding the pages behind them.
    robots: noindex
      ? { index: false, follow: true }
      : { index: true, follow: true },
    openGraph: {
      type,
      url: path,
      title: socialTitle,
      description,
      images: [{ url: image, alt: socialTitle }],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [image],
    },
  };
}
