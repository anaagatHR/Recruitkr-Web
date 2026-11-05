import crypto from 'node:crypto';

import { StatusCodes } from 'http-status-codes';

import { env } from '../config/env.js';
import { STUDIO_USER_ID } from '../middlewares/studioAuth.js';
import SiteContent from '../models/SiteContent.js';
import SiteContentRevision from '../models/SiteContentRevision.js';
import { User } from '../models/User.js';
import { SITE_CONTENT_SCHEMA, cleanContent, validateContent } from '../shared/siteContentSchema.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const PREVIEW_TTL_MS = 2 * 60 * 60 * 1000;

const isKey = (key) => Object.prototype.hasOwnProperty.call(SITE_CONTENT_SCHEMA, key);

const knownKey = (key) => {
  if (!isKey(key))
    throw new ApiError(StatusCodes.NOT_FOUND, `"${key}" is not an editable part of the site`);
  return key;
};

const mustBeValid = (key, value) => {
  const result = validateContent(key, value);
  if (!result.ok)
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Some fields are not valid', result.errors);
  return result.value;
};

const whoIs = async (req) => {
  if (req.user.id === STUDIO_USER_ID) return 'Site Studio (PIN)';
  const user = await User.findById(req.user.id).select('email').lean();
  return user?.email || req.user.id;
};

const sameJson = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

/** Tell the website to drop its cached content. A slow or missing site never fails a publish. */
export const revalidateSite = async () => {
  if (!env.SITE_REVALIDATE_URL || !env.REVALIDATE_SECRET) return false;
  try {
    const res = await fetch(env.SITE_REVALIDATE_URL, {
      method: 'POST',
      headers: { 'x-revalidate-secret': env.REVALIDATE_SECRET },
      signal: AbortSignal.timeout(4000),
    });
    return res.ok;
  } catch (error) {
    console.warn('[site-content] revalidate failed', {
      message: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
};

/** Publish one key's (already validated) value: new revision, then live. Returns the version. */
const publishOne = async (doc, value, by, note = '') => {
  const version = (doc.version || 0) + 1;
  const now = new Date();
  await SiteContentRevision.create({
    key: doc.key,
    version,
    value,
    publishedBy: by,
    note,
    createdAt: now,
  });
  await SiteContent.updateOne(
    { key: doc.key },
    { $set: { published: value, draft: value, version, publishedBy: by, publishedAt: now } },
    { upsert: true },
  );
  return version;
};

// --- Public -----------------------------------------------------------------

export const getPublished = asyncHandler(async (_req, res) => {
  const docs = await SiteContent.find({ published: { $ne: null } })
    .select('key published')
    .lean();
  const data = {};
  for (const doc of docs) if (isKey(doc.key)) data[doc.key] = cleanContent(doc.key, doc.published);
  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');
  res.json({ success: true, data });
});

const sign = (payload) =>
  crypto.createHmac('sha256', env.STUDIO_PREVIEW_SECRET).update(payload).digest('base64url');

export const makePreviewToken = (now = Date.now()) => {
  const payload = Buffer.from(JSON.stringify({ exp: now + PREVIEW_TTL_MS })).toString('base64url');
  return `${payload}.${sign(payload)}`;
};

export const verifyPreviewToken = (token, now = Date.now()) => {
  if (!env.STUDIO_PREVIEW_SECRET || typeof token !== 'string') return false;
  const [payload, mac] = token.split('.');
  if (!payload || !mac) return false;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(mac);
  if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) return false;
  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString()).exp > now;
  } catch {
    return false;
  }
};

/** Drafts (falling back to published) for the editor's live preview of the site. */
export const getPreview = asyncHandler(async (req, res) => {
  if (!verifyPreviewToken(req.query.token))
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Preview link expired');
  const docs = await SiteContent.find({}).select('key draft published').lean();
  const data = {};
  for (const doc of docs) {
    const value = doc.draft ?? doc.published;
    if (value && isKey(doc.key)) data[doc.key] = cleanContent(doc.key, value);
  }
  res.setHeader('Cache-Control', 'no-store');
  res.json({ success: true, data });
});

// --- Admin ------------------------------------------------------------------

export const createPreviewToken = asyncHandler(async (_req, res) => {
  if (!env.STUDIO_PREVIEW_SECRET) {
    throw new ApiError(
      StatusCodes.SERVICE_UNAVAILABLE,
      'Live preview is off: STUDIO_PREVIEW_SECRET is not set on the API',
    );
  }
  res.json({ success: true, data: { token: makePreviewToken(), expiresInMs: PREVIEW_TTL_MS } });
});

export const listContent = asyncHandler(async (_req, res) => {
  const docs = await SiteContent.find({}).lean();
  const items = {};
  for (const doc of docs) {
    if (!isKey(doc.key)) continue;
    items[doc.key] = {
      draft: doc.draft,
      published: doc.published,
      version: doc.version,
      updatedBy: doc.updatedBy,
      updatedAt: doc.updatedAt,
      publishedBy: doc.publishedBy,
      publishedAt: doc.publishedAt,
      hasChanges: doc.draft != null && !sameJson(doc.draft, doc.published),
    };
  }
  res.json({ success: true, data: { schema: SITE_CONTENT_SCHEMA, items } });
});

export const saveDraft = asyncHandler(async (req, res) => {
  const key = knownKey(req.params.key);
  const value = mustBeValid(key, req.body?.value);
  const by = await whoIs(req);
  await SiteContent.updateOne(
    { key },
    {
      $set: { draft: value, updatedBy: by, updatedAt: new Date() },
      $setOnInsert: { key, published: null, version: 0 },
    },
    { upsert: true },
  );
  res.json({ success: true, data: { key, draft: value } });
});

export const discardDraft = asyncHandler(async (req, res) => {
  const key = knownKey(req.params.key);
  const doc = await SiteContent.findOne({ key }).lean();
  if (!doc) throw new ApiError(StatusCodes.NOT_FOUND, 'Nothing saved for this part yet');
  await SiteContent.updateOne({ key }, { $set: { draft: doc.published } });
  res.json({ success: true, data: { key, draft: doc.published } });
});

export const publishKey = asyncHandler(async (req, res) => {
  const key = knownKey(req.params.key);
  const doc = await SiteContent.findOne({ key }).lean();
  if (!doc || doc.draft == null)
    throw new ApiError(StatusCodes.BAD_REQUEST, 'There is no draft to publish');
  const value = mustBeValid(key, doc.draft); // re-checked: the registry may have changed since it was saved
  const version = await publishOne(doc, value, await whoIs(req));
  const revalidated = await revalidateSite();
  res.json({ success: true, data: { key, version, revalidated } });
});

export const publishAll = asyncHandler(async (req, res) => {
  const docs = (await SiteContent.find({}).lean()).filter(
    (doc) => isKey(doc.key) && doc.draft != null && !sameJson(doc.draft, doc.published),
  );
  // All or nothing: one invalid draft stops the publish before anything changes.
  const errors = [];
  const values = docs.map((doc) => {
    const r = validateContent(doc.key, doc.draft);
    if (!r.ok) errors.push(...r.errors.map((e) => `${doc.key}: ${e}`));
    return r.value;
  });
  if (errors.length)
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Some drafts are not valid; nothing was published',
      errors,
    );
  const by = await whoIs(req);
  const published = [];
  for (let i = 0; i < docs.length; i += 1) {
    published.push({ key: docs[i].key, version: await publishOne(docs[i], values[i], by) });
  }
  const revalidated = published.length ? await revalidateSite() : false;
  res.json({ success: true, data: { published, revalidated } });
});

export const listRevisions = asyncHandler(async (req, res) => {
  const key = knownKey(req.params.key);
  const revisions = await SiteContentRevision.find({ key }).sort({ version: -1 }).limit(50).lean();
  res.json({ success: true, data: revisions });
});

export const rollback = asyncHandler(async (req, res) => {
  const key = knownKey(req.params.key);
  if (!/^[a-f0-9]{24}$/i.test(req.params.revisionId))
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid revision');
  const revision = await SiteContentRevision.findOne({ _id: req.params.revisionId, key }).lean();
  if (!revision) throw new ApiError(StatusCodes.NOT_FOUND, 'Revision not found');
  const result = validateContent(key, revision.value);
  if (!result.ok) {
    throw new ApiError(
      StatusCodes.CONFLICT,
      'This old version no longer fits the editor and cannot be restored',
      result.errors,
    );
  }
  const doc = (await SiteContent.findOne({ key }).lean()) || { key, version: 0 };
  const version = await publishOne(
    doc,
    result.value,
    await whoIs(req),
    `Restored version ${revision.version}`,
  );
  const revalidated = await revalidateSite();
  res.json({ success: true, data: { key, version, restored: revision.version, revalidated } });
});
