import type { Schema, Value } from "./api";

/** "home.hero.headlineEnd" → { key: "home.hero", field: "headlineEnd" } (longest registered key wins). */
export function keyForEditId(schema: Schema, id: string): { key: string; field: string | null } | null {
  const keys = Object.keys(schema).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (id === key) return { key, field: null };
    if (id.startsWith(`${key}.`)) {
      const field = id.slice(key.length + 1).split(".")[0];
      return { key, field: schema[key].fields[field] ? field : null };
    }
  }
  return null;
}

const channel = (v: number) => {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const luminance = (hex: string) => {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) return null;
  const [r, g, b] = m.slice(1).map((h) => channel(parseInt(h, 16)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/** WCAG 2 contrast ratio between two #rrggbb colours, or null if either is not a colour. */
export function contrastRatio(a: string, b: string): number | null {
  const la = luminance(a);
  const lb = luminance(b);
  if (la === null || lb === null) return null;
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
}

/** Fields whose draft differs from what is published (unset counts as "site default"). */
export function changedFields(draft: Value | null | undefined, published: Value | null | undefined): string[] {
  const d = draft ?? {};
  const p = published ?? {};
  return Array.from(new Set([...Object.keys(d), ...Object.keys(p)])).filter(
    (f) => JSON.stringify(d[f] ?? null) !== JSON.stringify(p[f] ?? null),
  );
}

/** A short human-readable version of a stored value, for diffs and history. */
export function valueText(v: unknown): string {
  if (v === undefined || v === null || v === "") return "(site default)";
  if (typeof v === "boolean") return v ? "on" : "off";
  if (Array.isArray(v)) return `${v.length} item${v.length === 1 ? "" : "s"}: ${v.map((x) => Object.values(x ?? {}).join(" · ")).join(" | ")}`;
  return String(v);
}
