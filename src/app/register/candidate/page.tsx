import { redirect } from "next/navigation";

// The old long candidate registration form was retired in favour of the modern,
// minimal /signup flow (email + password; the rest is completed from the
// dashboard). Keep this route as a redirect so old links/bookmarks still work.
export default function Page() {
  redirect("/signup");
}
