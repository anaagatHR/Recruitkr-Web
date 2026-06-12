/**
 * The portal currently lists jobs only in Jaipur; the backend stores a
 * neighborhood (e.g. "Mansarovar") in `location`, not a city name. So we treat
 * Jaipur as the home city: its landing page lists every job, and JobPosting
 * structured data resolves to Jaipur, Rajasthan. Add a real `city` field later
 * to generalize beyond this.
 */
export const HOME_CITY = "Jaipur";
export const HOME_REGION = "Rajasthan";

/** Cities we publish dedicated "Jobs in <city>" SEO landing pages for. */
export const CITIES = [
  "Jaipur",
  "Mumbai",
  "Delhi",
  "Bengaluru",
  "Hyderabad",
  "Pune",
  "Gurugram",
  "Chennai",
  "Kolkata",
  "Noida",
  "Ahmedabad",
  "Remote",
] as const;

/** "New Delhi" -> "new-delhi" */
export const citySlug = (city: string) => city.toLowerCase().trim().replace(/\s+/g, "-");

/** "new-delhi" -> "New Delhi" */
export const cityFromSlug = (slug: string) =>
  slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();

/**
 * Jobs for a city landing page. The home city (Jaipur) returns every job, since
 * `location` holds a neighborhood rather than the city name. Other cities match
 * by substring (and will be empty until jobs there exist).
 */
export const matchCity = <T extends { location: string }>(jobs: T[], city: string): T[] => {
  if (city.toLowerCase() === HOME_CITY.toLowerCase()) return jobs;
  const needle = city.toLowerCase();
  return jobs.filter((j) => j.location.toLowerCase().includes(needle));
};
