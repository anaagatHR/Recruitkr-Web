import { cache } from "react";
import { API_BASE } from "@/lib/api";
import type { SiteContent } from "@/lib/siteContentCore";

export { getContent, editable } from "@/lib/siteContentCore";
export type { SiteContent } from "@/lib/siteContentCore";

/**
 * Everything published in Site Studio, for server components. Cached under the
 * `site-content` tag (a Studio publish calls /api/revalidate to drop it) and
 * refreshed every 5 minutes regardless. Any failure, including a slow API (2s),
 * returns {} so every page renders its built-in defaults.
 */
export const getPublishedContent = cache(async (): Promise<SiteContent> => {
  try {
    const res = await fetch(`${API_BASE}/site-content/published`, {
      next: { tags: ["site-content"], revalidate: 300 },
      signal: AbortSignal.timeout(2000),
    });
    if (!res.ok) return {};
    const json = await res.json();
    return json && typeof json.data === "object" && !Array.isArray(json.data) ? (json.data as SiteContent) : {};
  } catch {
    return {};
  }
});
