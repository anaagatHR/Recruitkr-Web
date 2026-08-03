#!/usr/bin/env node
/**
 * Push job URLs to the Google Indexing API.
 *
 * Google normally discovers pages by crawling the sitemap on its own schedule,
 * which can take days — too slow for a board where a listing is only relevant
 * for a few weeks. The Indexing API is the exception: it accepts direct
 * "this URL changed / this URL is gone" notifications, and JobPosting is one of
 * only two page types it officially supports. Postings submitted this way are
 * typically crawled within minutes.
 *
 *   https://developers.google.com/search/apis/indexing-api/v3/quickstart
 *
 * Setup (one time):
 *   1. Google Cloud console -> create a project -> enable "Indexing API".
 *   2. Create a service account, add a JSON key, download it.
 *   3. Search Console -> the recruitkr.com property -> Settings -> Users and
 *      permissions -> add the service account's client_email as an **Owner**.
 *      Without owner rights every call returns 403.
 *   4. Point GOOGLE_INDEXING_CREDENTIALS at the JSON key file.
 *
 * Usage:
 *   node scripts/google-indexing.mjs --dry-run        # list what would be sent
 *   node scripts/google-indexing.mjs                  # publish job URLs
 *   node scripts/google-indexing.mjs --limit=50
 *   node scripts/google-indexing.mjs --all            # every sitemap URL, not just jobs
 *   node scripts/google-indexing.mjs --type=URL_DELETED --url=https://…/jobs/abc
 *
 * Quota is 200 URLs/day per project by default; the script stops cleanly when
 * Google starts returning 429 rather than hammering a exhausted quota.
 */

import { createSign } from "node:crypto";
import { readFile } from "node:fs/promises";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const PUBLISH_URL = "https://indexing.googleapis.com/v3/urlNotifications/publish";
const SCOPE = "https://www.googleapis.com/auth/indexing";
const CONCURRENCY = 5;

// ---------------------------------------------------------------- arguments

const args = process.argv.slice(2);
const flag = (name) => args.some((a) => a === `--${name}`);
const value = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};

const DRY_RUN = flag("dry-run");
const ALL_URLS = flag("all");
const TYPE = value("type", "URL_UPDATED");
const LIMIT = Number(value("limit", "0")) || Infinity;
const SINGLE_URL = value("url", "");
const SITE_URL = (value("site", process.env.NEXT_PUBLIC_SITE_URL) || "https://www.recruitkr.com").replace(/\/$/, "");
const SITEMAP_URL = value("sitemap", `${SITE_URL}/sitemap.xml`);

if (!["URL_UPDATED", "URL_DELETED"].includes(TYPE)) {
  console.error(`--type must be URL_UPDATED or URL_DELETED (got "${TYPE}")`);
  process.exit(1);
}

// ---------------------------------------------------------------- auth

const base64url = (input) =>
  Buffer.from(input).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

async function loadCredentials() {
  const inline = process.env.GOOGLE_INDEXING_CREDENTIALS_JSON;
  const path = process.env.GOOGLE_INDEXING_CREDENTIALS || process.env.GOOGLE_APPLICATION_CREDENTIALS;

  let raw;
  if (inline) {
    raw = inline;
  } else if (path) {
    raw = await readFile(path, "utf8");
  } else {
    throw new Error(
      "No credentials. Set GOOGLE_INDEXING_CREDENTIALS to the service-account JSON key path, " +
        "or GOOGLE_INDEXING_CREDENTIALS_JSON to its contents.",
    );
  }

  const creds = JSON.parse(raw);
  if (!creds.client_email || !creds.private_key) {
    throw new Error("Credentials JSON is missing client_email / private_key — is it a service-account key?");
  }
  return creds;
}

/**
 * Exchange the service-account key for an access token using the JWT bearer
 * grant. Done by hand so the script needs no googleapis dependency.
 */
async function getAccessToken(creds) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64url(
    JSON.stringify({
      iss: creds.client_email,
      scope: SCOPE,
      aud: TOKEN_URL,
      iat: now,
      exp: now + 3600,
    }),
  );

  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claims}`);
  // Keys pasted through an env var usually arrive with literal \n sequences.
  const signature = signer.sign(creds.private_key.replace(/\\n/g, "\n"), "base64");
  const assertion = `${header}.${claims}.${signature.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")}`;

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.access_token) {
    throw new Error(`Token exchange failed (${res.status}): ${body.error_description || body.error || "unknown error"}`);
  }
  return body.access_token;
}

// ---------------------------------------------------------------- url source

/** Pull <loc> values out of the live sitemap, so this always matches what the site publishes. */
async function collectUrls() {
  if (SINGLE_URL) return [SINGLE_URL];

  const res = await fetch(SITEMAP_URL, { headers: { "User-Agent": "recruitkr-indexing-script" } });
  if (!res.ok) throw new Error(`Could not read ${SITEMAP_URL} (HTTP ${res.status})`);

  const xml = await res.text();
  const locs = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) =>
    m[1].replace(/&amp;/g, "&").trim(),
  );

  const urls = ALL_URLS ? locs : locs.filter((u) => /\/jobs\/[^/]+$/.test(u));
  return [...new Set(urls)];
}

// ---------------------------------------------------------------- publish

async function publish(url, token) {
  const res = await fetch(PUBLISH_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ url, type: TYPE }),
  });

  if (res.ok) return { url, ok: true };

  const body = await res.json().catch(() => ({}));
  return {
    url,
    ok: false,
    status: res.status,
    message: body?.error?.message || `HTTP ${res.status}`,
  };
}

async function main() {
  const urls = (await collectUrls()).slice(0, LIMIT === Infinity ? undefined : LIMIT);

  if (!urls.length) {
    console.log(`No URLs found in ${SITEMAP_URL}. Nothing to submit.`);
    return;
  }

  console.log(`${TYPE}: ${urls.length} URL(s) from ${SINGLE_URL ? "--url" : SITEMAP_URL}`);

  if (DRY_RUN) {
    urls.forEach((u) => console.log(`  would submit  ${u}`));
    console.log("\nDry run — nothing was sent.");
    return;
  }

  const token = await getAccessToken(await loadCredentials());

  const results = [];
  let quotaExhausted = false;
  const queue = [...urls];

  // A small worker pool: Google rate-limits this endpoint, and firing a few
  // thousand requests at once just earns 429s for most of them.
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
      while (queue.length && !quotaExhausted) {
        const url = queue.shift();
        const result = await publish(url, token);
        results.push(result);

        if (result.status === 429) {
          // Daily quota is gone; anything further would fail the same way.
          quotaExhausted = true;
          break;
        }
        console.log(result.ok ? `  ok    ${url}` : `  fail  ${url} — ${result.message}`);
      }
    }),
  );

  const ok = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok);

  console.log(`\nSubmitted ${ok}/${urls.length}.`);

  if (quotaExhausted) {
    const remaining = urls.length - results.length + failed.filter((r) => r.status === 429).length;
    console.log(
      `Daily quota reached — ${remaining} URL(s) not submitted. ` +
        `Re-run tomorrow, or request more quota in the Cloud console.`,
    );
  }

  if (failed.length) {
    const byMessage = new Map();
    failed.forEach((r) => byMessage.set(r.message, (byMessage.get(r.message) || 0) + 1));
    console.log("\nFailures:");
    for (const [message, count] of byMessage) console.log(`  ${count}x ${message}`);
    if (failed.some((r) => r.status === 403)) {
      console.log("\n403 usually means the service account is not an Owner of the Search Console property.");
    }
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
