export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.round(days / 30);
  return `${months}mo ago`;
}

/** Salary is in LPA. Above 200 LPA (₹2 crore) is a typing mistake, e.g. a monthly ₹14,000 typed as 14000. */
export const MAX_PLAUSIBLE_LPA = 200;
const plausible = (n?: number) => (n != null && n > 0 && n <= MAX_PLAUSIBLE_LPA ? n : undefined);

export function salaryLabel(rawMin?: number, rawMax?: number): string {
  // A wrong value is never shown ("₹14000L PA" went live once); the OS form now refuses it too.
  const min = plausible(rawMin), max = plausible(rawMax);
  if (min == null && max == null) return "Not disclosed";
  const fmt = (n: number) => (n < 1 ? `₹${Math.round(n * 100)}K` : `₹${+n.toFixed(2)}L`);
  if (min != null && max != null) return `${fmt(min)} - ${fmt(max)} PA`;
  return `${fmt((min ?? max) as number)} PA`;
}

export function isFresh(iso: string): boolean {
  return Date.now() - new Date(iso).getTime() < 24 * 3600 * 1000;
}
