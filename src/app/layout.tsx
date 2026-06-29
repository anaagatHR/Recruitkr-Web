import type { Metadata, Viewport } from "next";
import "@/index.css";
import AnalyticsTracker from "@/components/AnalyticsTracker";
import ApiKeepAlive from "@/components/ApiKeepAlive";
import JoinPrompt from "@/components/JoinPrompt";
import MobileBottomNav from "@/components/MobileBottomNav";
import RecruitKrBot from "@/components/RecruitKrBot";
import ThemeProvider from "@/components/ThemeProvider";
import { Toaster } from "@/components/ui/toaster";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.recruitkr.com";

const SITE_NAME = "RecruitKr";

const TITLE = "RecruitKr | Find Jobs Across India";

const DESCRIPTION =
  "Find jobs that match your skills and experience. Explore opportunities across India, connect with employers, and apply with ease on RecruitKr.";

export const viewport: Viewport = {
  themeColor: "#264a7f",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: TITLE,
    template: "%s | RecruitKr",
  },

  description: DESCRIPTION,

  applicationName: SITE_NAME,

  authors: [
    {
      name: SITE_NAME,
      url: SITE_URL,
    },
  ],

  generator: "Next.js",

  keywords: [
    "jobs in India",
    "find jobs",
    "job search",
    "careers",
    "job portal",
    "apply for jobs",
    "remote jobs",
    "fresher jobs",
    "hiring",
    "RecruitKr",
  ],

  alternates: {
    canonical: "/",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  openGraph: {
    type: "website",
    locale: "en_IN",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: "/favicon.png",
        alt: SITE_NAME,
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    site: "@Recruitkr",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/favicon.png"],
  },

  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE_URL}/jobs?search={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/favicon.png`,
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />

        <ThemeProvider>
          <AnalyticsTracker />
          <ApiKeepAlive />
          <RecruitKrBot />
          <JoinPrompt />
          {children}
          <MobileBottomNav />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}