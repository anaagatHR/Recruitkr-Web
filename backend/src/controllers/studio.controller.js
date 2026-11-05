import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import { STUDIO_MEDIA_LIMITS } from '../middlewares/upload.js';
import Team from '../models/OurTeam.js';
import { listImageKitFiles, uploadBufferToImageKit } from '../services/imagekit.js';
import { sanitizeSvg } from '../shared/siteContentSchema.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

import { clearTeamCache, toAbsoluteAssetUrl } from './teamController.js';

const SITE_FOLDER = '/recruitkr/site';
const TEAM_FOLDER = '/recruitkr/team';
const MB = 1024 * 1024;
const EXT = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
};

/** The real type of a file from its first bytes; the name and the browser's claim are not trusted. */
export const sniffMediaType = (buf) => {
  if (!Buffer.isBuffer(buf) || buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
    return 'image/png';
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP')
    return 'image/webp';
  if (buf.toString('ascii', 4, 8) === 'ftyp') return 'video/mp4';
  if (buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) return 'video/webm';
  const head = buf.subarray(0, 4096).toString('utf8').replace(/^﻿/, '').trimStart();
  if (/^(<\?xml[^>]*>\s*)?(<!--[\s\S]*?-->\s*)*<svg[\s>]/i.test(head)) return 'image/svg+xml';
  return null;
};

/** Check a file and put it in the site media folder. Throws a clear 4xx for anything not allowed. */
export const storeMedia = async ({ buffer, name, declaredType }) => {
  const type = sniffMediaType(buffer);
  if (!type || !STUDIO_MEDIA_LIMITS[type]) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Only JPG, PNG, WEBP or SVG images and MP4 or WEBM videos are supported',
    );
  }
  if (declaredType && declaredType !== type) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      `This file says it is ${declaredType} but its contents are ${type}`,
    );
  }
  if (buffer.length > STUDIO_MEDIA_LIMITS[type]) {
    throw new ApiError(
      StatusCodes.REQUEST_TOO_LONG,
      `Too large: the limit is ${STUDIO_MEDIA_LIMITS[type] / MB}MB for this type`,
    );
  }
  let body = buffer;
  if (type === 'image/svg+xml') {
    const safe = sanitizeSvg(buffer.toString('utf8'));
    if (!safe)
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'This SVG contains scripts, links or embedded content and was refused',
      );
    body = Buffer.from(safe, 'utf8');
  }
  const base = String(name || 'file').replace(/\.[a-z0-9]{1,5}$/i, '');
  const asset = await uploadBufferToImageKit({
    buffer: body,
    originalName: `${base}.${EXT[type]}`,
    folder: SITE_FOLDER,
  });
  return { url: asset.url, fileId: asset.fileId, name: asset.name, type, size: body.length };
};

// --- Media ------------------------------------------------------------------

export const uploadMedia = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(StatusCodes.BAD_REQUEST, 'Choose a file to upload');
  const data = await storeMedia({
    buffer: req.file.buffer,
    name: req.file.originalname,
    declaredType: req.file.mimetype,
  });
  res.status(StatusCodes.CREATED).json({ success: true, data });
});

const driveBody = z
  .object({
    fileId: z.string().regex(/^[A-Za-z0-9_-]{10,200}$/, 'Invalid Drive file'),
    accessToken: z.string().min(20).max(4096),
  })
  .strict();

/**
 * Copy a file the editor picked in Google Drive onto our own storage. The site
 * never links to Drive: sharing settings change and Drive is not a CDN.
 */
export const importFromDrive = asyncHandler(async (req, res) => {
  const parsed = driveBody.safeParse(req.body);
  if (!parsed.success)
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Pick a file in Google Drive first');
  const { fileId, accessToken } = parsed.data;
  const auth = { Authorization: `Bearer ${accessToken}` };
  const base = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`;

  const metaRes = await fetch(`${base}?fields=name,mimeType,size&supportsAllDrives=true`, {
    headers: auth,
    signal: AbortSignal.timeout(15000),
  });
  if (!metaRes.ok)
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Could not open that Drive file. Pick it again.');
  const meta = await metaRes.json();
  const limit = STUDIO_MEDIA_LIMITS[meta.mimeType];
  if (!limit)
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      `Files of type ${meta.mimeType || 'unknown'} can't be used on the site`,
    );
  if (Number(meta.size) > limit)
    throw new ApiError(
      StatusCodes.REQUEST_TOO_LONG,
      `Too large: the limit is ${limit / MB}MB for this type`,
    );

  const fileRes = await fetch(`${base}?alt=media&supportsAllDrives=true`, {
    headers: auth,
    signal: AbortSignal.timeout(120000),
  });
  if (!fileRes.ok)
    throw new ApiError(StatusCodes.BAD_GATEWAY, 'Google Drive did not send the file. Try again.');
  const buffer = Buffer.from(await fileRes.arrayBuffer());
  const data = await storeMedia({ buffer, name: meta.name, declaredType: meta.mimeType });
  res.status(StatusCodes.CREATED).json({ success: true, data });
});

export const listMedia = asyncHandler(async (_req, res) => {
  const lists = await Promise.all([
    listImageKitFiles({ folder: SITE_FOLDER, fileType: 'image', limit: 200 }).then((f) =>
      f.map((x) => ({ ...x, kind: 'image', folder: 'site' })),
    ),
    listImageKitFiles({ folder: SITE_FOLDER, fileType: 'non-image', limit: 100 }).then((f) =>
      f.map((x) => ({ ...x, kind: 'video', folder: 'site' })),
    ),
    listImageKitFiles({ folder: TEAM_FOLDER, fileType: 'image', limit: 200 }).then((f) =>
      f.map((x) => ({ ...x, kind: 'image', folder: 'team' })),
    ),
    listImageKitFiles({ folder: TEAM_FOLDER, fileType: 'non-image', limit: 100 }).then((f) =>
      f.map((x) => ({ ...x, kind: 'video', folder: 'team' })),
    ),
  ]);
  res.json({ success: true, data: lists.flat() });
});

// --- Team -------------------------------------------------------------------

const link = z.union([
  z.literal(''),
  z
    .string()
    .trim()
    .max(2048)
    .regex(/^https?:\/\/\S+$/i, 'must be an http(s) link'),
]);
const memberBody = z
  .object({
    name: z.string().trim().min(1, 'Name is required').max(80),
    role: z.string().trim().max(80),
    summary: z.string().trim().max(600),
    image: link,
    video: link,
    linkedin: link,
    email: z.union([z.literal(''), z.string().trim().toLowerCase().max(120).email()]),
  })
  .strict();

const parseMember = (body, partial) => {
  const parsed = (
    partial ? memberBody.partial() : memberBody.partial().required({ name: true })
  ).safeParse(body ?? {});
  if (!parsed.success) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Some fields are not valid',
      parsed.error.issues.map((i) => `${i.path.join('.') || 'body'}: ${i.message}`),
    );
  }
  return parsed.data;
};

/**
 * The CRM and the public /api/team read different field names for the same
 * thing, so every write sets all of them. Nothing is ever renamed or removed.
 */
export const toTeamFields = (m) => {
  const out = {};
  if (m.name !== undefined) Object.assign(out, { fullName: m.name, name: m.name });
  if (m.role !== undefined) Object.assign(out, { role: m.role, position: m.role });
  if (m.summary !== undefined) out.shortDescription = m.summary;
  if (m.image !== undefined) out.profileImage = m.image;
  if (m.video !== undefined)
    Object.assign(out, { profileVideo: m.video, videoUrl: m.video, introVideo: m.video });
  if (m.linkedin !== undefined) out.linkedInUrl = m.linkedin;
  if (m.email !== undefined) out.email = m.email;
  return out;
};

const toStudioMember = (doc) => ({
  id: String(doc._id),
  name: doc.fullName || doc.name || '',
  role: doc.role || doc.position || '',
  summary: doc.shortDescription || '',
  image: toAbsoluteAssetUrl(doc.profileImage),
  video: toAbsoluteAssetUrl(doc.profileVideo || doc.videoUrl || doc.introVideo),
  linkedin: doc.linkedInUrl || '',
  email: doc.email || '',
  displayOrder: doc.displayOrder ?? 0,
  active: doc.active !== false && doc.isActive !== false,
});

const objectId = (id) => {
  if (!/^[a-f0-9]{24}$/i.test(String(id)))
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid team member');
  return id;
};

export const listTeam = asyncHandler(async (_req, res) => {
  const docs = await Team.find({})
    .sort({ displayOrder: 1, fullName: 1, name: 1 })
    .limit(500)
    .lean();
  res.json({ success: true, data: docs.map(toStudioMember) });
});

export const createMember = asyncHandler(async (req, res) => {
  const fields = toTeamFields(parseMember(req.body, false));
  const last = await Team.findOne({}).sort({ displayOrder: -1 }).select('displayOrder').lean();
  const doc = await Team.create({
    ...fields,
    displayOrder: (last?.displayOrder || 0) + 1,
    active: true,
    isActive: true,
  });
  clearTeamCache();
  res
    .status(StatusCodes.CREATED)
    .json({ success: true, data: toStudioMember(doc.toObject ? doc.toObject() : doc) });
});

export const updateMember = asyncHandler(async (req, res) => {
  const id = objectId(req.params.id);
  const fields = toTeamFields(parseMember(req.body, true));
  const doc = await Team.findByIdAndUpdate(id, { $set: fields }, { new: true }).lean();
  if (!doc) throw new ApiError(StatusCodes.NOT_FOUND, 'Team member not found');
  clearTeamCache();
  res.json({ success: true, data: toStudioMember(doc) });
});

/** Hide or show. Members are never deleted: the CRM may still point at them. */
export const setMemberActive = asyncHandler(async (req, res) => {
  const id = objectId(req.params.id);
  if (typeof req.body?.active !== 'boolean')
    throw new ApiError(StatusCodes.BAD_REQUEST, 'active must be true or false');
  const doc = await Team.findByIdAndUpdate(
    id,
    { $set: { active: req.body.active, isActive: req.body.active } },
    { new: true },
  ).lean();
  if (!doc) throw new ApiError(StatusCodes.NOT_FOUND, 'Team member not found');
  clearTeamCache();
  res.json({ success: true, data: toStudioMember(doc) });
});

export const reorderTeam = asyncHandler(async (req, res) => {
  const ids = req.body?.ids;
  if (!Array.isArray(ids) || !ids.length || ids.length > 500 || new Set(ids).size !== ids.length) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Send the members in their new order');
  }
  ids.forEach(objectId);
  await Team.bulkWrite(
    ids.map((id, i) => ({
      updateOne: { filter: { _id: id }, update: { $set: { displayOrder: i + 1 } } },
    })),
  );
  clearTeamCache();
  res.json({ success: true, data: { count: ids.length } });
});
