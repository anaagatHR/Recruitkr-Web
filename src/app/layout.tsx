import type { Metadata, Viewport } from "next";
import { Inter, Sora } from "next/font/google";
import "@/index.css";
import AnalyticsTracker from "@/components/AnalyticsTracker";
import ApiKeepAlive from "@/components/ApiKeepAlive";
import JoinPrompt from "@/components/JoinPrompt";
import MobileBottomNav from "@/components/MobileBottomNav";
import ThemeProvider from "@/components/ThemeProvider";
import { Toaster } from "@/components/ui/toaster";

// Body / UI text — Inter: clean, neutral, legible at every size.
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
});

// Display / headings — Sora: geometric, confident, a little dramatic.
// Gives the whole site a distinct, modern voice (not the OS default font).
const sora = Sora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-display",
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.recruitkr.com";

const SITE_NAME = "RecruitKr";

const TITLE =  "Find Jobs in India | Fresher, Remote & Private Jobs | RecruitKr";
const DESCRIPTION =
  "Find verified jobs across India including fresher jobs, private jobs, remote jobs, internships and work from home opportunities. Apply directly with trusted employers on RecruitKr.";
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
  "jobs in india",
  "latest jobs",
  "private jobs",
  "government jobs",
  "fresher jobs",
  "internships",
  "remote jobs",
  "work from home jobs",
  "part time jobs",
  "full time jobs",
  "job portal india",
  "recruitment",
  "career opportunities",
  "RecruitKr",
],

  alternates: {
    canonical: "/",
  },

  // Google Search Console ownership. Emitted as
  // <meta name="google-site-verification" content="..."> on every page, which
  // is what Search Console's "HTML tag" method checks for. Keep it in the root
  // layout: verification is re-checked periodically, and it must survive `/`
  // redirecting to /jobs.
  verification: {
    google:  "5m8uJ9_amWtMM_haIq7hZqy0I0w309RJo19IbwgcDr0",
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
    <html lang="en" className={`${inter.variable} ${sora.variable}`}>
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
          <JoinPrompt />
          {children}
          <MobileBottomNav />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}