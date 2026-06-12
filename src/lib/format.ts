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

export function salaryLabel(min?: number, max?: number): string {
  if (min == null && max == null) return "Not disclosed";
  const fmt = (n: number) => (n < 1 ? `₹${Math.round(n * 100)}K` : `₹${n}L`);
  if (min != null && max != null) return `${fmt(min)} - ${fmt(max)} PA`;
  return `${fmt((min ?? max) as number)} PA`;
}

export function isFresh(iso: string): boolean {
  return Date.now() - new Date(iso).getTime() < 24 * 3600 * 1000;
}
