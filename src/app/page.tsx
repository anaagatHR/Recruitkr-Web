import { redirect } from "next/navigation";

/**
 * The site opens on the job board, not on the marketing page.
 *
 * `/` no longer renders anything of its own — it forwards to `/jobs`, and the
 * marketing home page it used to render now lives at `/home` (reachable from
 * the logo and from "Home" in the nav).
 *
 * `redirect()` issues a temporary 307 rather than a permanent 308 on purpose:
 * browsers and CDNs cache a 308 indefinitely, so a visitor who loaded `/` once
 * could never see a different `/` again without clearing their cache. Move this
 * to a `permanent: true` entry in next.config.mjs only once it's settled.
 */
export default function Page() {
  redirect("/jobs");
}
