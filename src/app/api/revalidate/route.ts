import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Called by the API after a Site Studio publish so the change shows at once
 * instead of after the 5-minute refresh. Needs REVALIDATE_SECRET (the same
 * value as the API's) in the x-revalidate-secret header.
 */
export async function POST(req: NextRequest) {
  const secret = Buffer.from(process.env.REVALIDATE_SECRET || "");
  const given = Buffer.from(req.headers.get("x-revalidate-secret") || "");
  const ok = secret.length >= 16 && given.length === secret.length && timingSafeEqual(given, secret);
  if (!ok) return NextResponse.json({ revalidated: false }, { status: 401 });
  revalidateTag("site-content");
  return NextResponse.json({ revalidated: true });
}
