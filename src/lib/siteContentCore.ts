/**
 * Site Studio content, shared by server and client code. Every component keeps
 * its current hardcoded copy as the DEFAULT; published values from the Studio
 * are laid over it field by field, after the same registry the API validates
 * with has dropped anything malformed. No content (API down, timeout, nothing
 * published) means the default renders exactly as before.
 */
import { cleanContent } from "../../backend/src/shared/siteContentSchema.js";

export type SiteContent = Record<string, Record<string, unknown>>;

/** Published (or, in Studio preview, draft) values over the component's defaults. */
export function getContent<T extends Record<string, unknown>>(content: SiteContent | undefined, key: string, defaults: T): T {
  const raw = content?.[key];
  if (!raw) return defaults;
  const clean = cleanContent(key, raw) as Record<string, unknown>;
  const merged: Record<string, unknown> = { ...defaults };
  for (const [field, value] of Object.entries(clean)) {
    // An emptied list falls back to the default rather than blanking the section.
    if (Array.isArray(value) && value.length === 0) continue;
    merged[field] = value;
  }
  return merged as T;
}

/** The attribute the Studio's click-to-edit looks for. Spread it onto an existing element. */
export const editable = (id: string) => ({ "data-rk-edit": id });

/** "#264a7f" → "216 54% 32%", the shape the site's CSS tokens use. */
export function hexToHslTriplet(hex: string): string | null {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) return null;
  const [r, g, b] = m.slice(1).map((h) => parseInt(h, 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60;
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

const DEFAULT_FONTS = new Set(["Inter", "Sora"]);
const FALLBACK_STACK = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

/**
 * CSS for a published theme, or "" when nothing is published (then the site's
 * own tokens apply untouched). Colours apply in light mode only; dark mode
 * keeps its tuned palette.
 */
export function themeCss(content: SiteContent | undefined): string {
  const t = getContent(content, "theme", {} as Record<string, unknown>);
  const light: string[] = [];
  const color = (tokens: string[], value: unknown) => {
    const hsl = typeof value === "string" ? hexToHslTriplet(value) : null;
    if (hsl) tokens.forEach((name) => light.push(`--${name}:${hsl}`));
  };
  color(["primary", "ring", "navy", "teal", "sidebar-primary", "sidebar-ring"], t.primary);
  color(["secondary", "accent", "teal-glow"], t.secondary);
  color(["background", "card", "popover"], t.background);
  color(["foreground", "card-foreground", "popover-foreground"], t.foreground);
  const both: string[] = [];
  if (typeof t.radius === "number") both.push(`--radius:${t.radius}rem`);
  if (typeof t.fontBody === "string") both.push(`--font-body:"${t.fontBody}", ${FALLBACK_STACK}`);
  if (typeof t.fontDisplay === "string") both.push(`--font-display:"${t.fontDisplay}", ${FALLBACK_STACK}`);
  return [
    light.length ? `html:root:not(.dark){${light.join(";")}}` : "",
    both.length ? `html:root{${both.join(";")}}` : "",
  ].join("");
}

/** Google Fonts stylesheet for theme fonts the site doesn't already bundle, or null. */
export function themeFontsHref(content: SiteContent | undefined): string | null {
  const t = getContent(content, "theme", {} as Record<string, unknown>);
  const families = [t.fontBody, t.fontDisplay].filter(
    (f): f is string => typeof f === "string" && !DEFAULT_FONTS.has(f),
  );
  if (!families.length) return null;
  const q = Array.from(new Set(families))
    .map((f) => `family=${f.replace(/ /g, "+")}:wght@400;500;600;700;800`)
    .join("&");
  return `https://fonts.googleapis.com/css2?${q}&display=swap`;
}
