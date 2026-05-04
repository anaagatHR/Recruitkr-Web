import crypto from 'node:crypto';
import path from 'node:path';

import mongoose from 'mongoose';

import { env } from '../src/config/env.js';
import { imagekit } from '../src/config/imagekit.js';

const RUN_ID = new Date().toISOString().replace(/[:.]/g, '-');
const IMAGEKIT_FOLDER = '/recruitkr';
const MIGRATION_NAME = 'imagekit_migration_v1';
const MIGRATION_LOGS_COLLECTION = 'migration_logs';
const BATCH_SIZE = Number(process.env.MIGRATION_BATCH_SIZE || 50);
const DRY_RUN = process.env.MIGRATION_DRY_RUN === 'true';
const CREATE_BACKUPS = process.env.MIGRATION_SKIP_BACKUP !== 'true';
const REMOTE_FETCH_TIMEOUT_MS = Number(process.env.MIGRATION_FETCH_TIMEOUT_MS || 30000);

const KNOWN_COLLECTIONS = [
  'candidatefiles',
  'applications',
  'resumes',
  'candidateprofiles',
  'blogposts',
  'clientprofiles',
  'blogimageassets',
];

const HINT_QUERY = {
  $or: [
    { data: { $exists: true } },
    { resumeData: { $exists: true } },
    { buffer: { $exists: true } },
    { base64: { $exists: true } },
    { profilePhotoDataUrl: { $exists: true } },
    { 'profileImage.data': { $exists: true } },
    { coverImage: { $regex: '^data:' } },
  ],
};

const report = {
  runId: RUN_ID,
  dryRun: DRY_RUN,
  backupsCreated: [],
  migrated: 0,
  skipped: 0,
  failed: 0,
  invalid: 0,
  collections: {},
};

const imageKitUrlHost = new URL(env.IMAGEKIT_URL_ENDPOINT).host;
const relativeAssetBaseUrl = (env.BACKEND_PUBLIC_URL || env.FRONTEND_URL || '').replace(/\/$/, '');

const ensureCollectionReport = (name) => {
  if (!report.collections[name]) {
    report.collections[name] = {
      migrated: 0,
      skipped: 0,
      failed: 0,
      invalid: 0,
      notes: [],
    };
  }

  return report.collections[name];
};

const logCollectionNote = (name, note) => {
  ensureCollectionReport(name).notes.push(note);
};

const increment = (collectionName, key) => {
  report[key] += 1;
  ensureCollectionReport(collectionName)[key] += 1;
};

const sanitizeSegment = (value = '') =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'file';

const extensionFromMime = (mimeType = '') => {
  const normalized = String(mimeType || '').split(';')[0].trim().toLowerCase();
  if (normalized === 'image/jpeg') return 'jpg';
  if (normalized === 'image/png') return 'png';
  if (normalized === 'image/webp') return 'webp';
  if (normalized === 'image/gif') return 'gif';
  if (normalized === 'application/pdf') return 'pdf';
  if (normalized === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return 'docx';
  }
  return '';
};

const mimeFromExtension = (fileName = '') => {
  const extension = path.extname(String(fileName || '')).replace(/^\./, '').toLowerCase();
  if (extension === 'jpg' || extension === 'jpeg') return 'image/jpeg';
  if (extension === 'png') return 'image/png';
  if (extension === 'webp') return 'image/webp';
  if (extension === 'gif') return 'image/gif';
  if (extension === 'pdf') return 'application/pdf';
  if (extension === 'docx') {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }
  return '';
};

const guessMimeTypeFromBuffer = (buffer, fallback = 'application/octet-stream') => {
  if (!Buffer.isBuffer(buffer) || buffer.length < 4) return fallback;

  if (buffer.subarray(0, 4).toString('utf8') === '%PDF') return 'application/pdf';
  if (buffer[0] === 0xff && buffer[1] === 0xd8) return 'image/jpeg';
  if (buffer[0] === 0x89 && buffer.subarray(1, 4).toString('utf8') === 'PNG') return 'image/png';
  if (buffer.subarray(0, 4).toString('utf8') === 'RIFF' && buffer.subarray(8, 12).toString('utf8') === 'WEBP') {
    return 'image/webp';
  }
  if (buffer.subarray(0, 6).toString('utf8') === 'GIF87a' || buffer.subarray(0, 6).toString('utf8') === 'GIF89a') {
    return 'image/gif';
  }
  if (buffer.subarray(0, 2).toString('hex') === '504b') {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }

  return fallback;
};

const buildUniqueFileName = ({ baseName, fileName, mimeType, documentId, label }) => {
  const parsed = path.parse(String(fileName || ''));
  const safeBase =
    sanitizeSegment(parsed.name || baseName || label || 'asset') || sanitizeSegment(label || 'asset');
  const extension = parsed.ext.replace(/^\./, '') || extensionFromMime(mimeType) || 'bin';
  const uniqueSuffix = `${Date.now()}-${documentId || crypto.randomUUID()}`;
  return `${safeBase}-${uniqueSuffix}.${extension}`;
};

const isImageKitUrl = (value) => {
  if (typeof value !== 'string' || !value.trim()) return false;

  try {
    return new URL(value).host === imageKitUrlHost;
  } catch {
    return false;
  }
};

const isDataUri = (value) => typeof value === 'string' && value.trim().startsWith('data:');

const extractDataUri = (value) => {
  if (!isDataUri(value)) return null;

  const match = String(value).match(/^data:([^;,]+)?(?:;charset=[^;,]+)?(;base64)?,([\s\S]+)$/i);
  if (!match) return null;

  const mimeType = match[1] || 'application/octet-stream';
  const isBase64 = Boolean(match[2]);
  const payload = match[3] || '';

  try {
    const buffer = isBase64
      ? Buffer.from(payload, 'base64')
      : Buffer.from(decodeURIComponent(payload), 'utf8');
    return { buffer, mimeType };
  } catch {
    return null;
  }
};

const isMongoBinary = (value) =>
  Boolean(
    value &&
      typeof value === 'object' &&
      (value._bsontype === 'Binary' || value.constructor?.name === 'Binary'),
  );

const extractBuffer = (value) => {
  if (!value) return null;
  if (Buffer.isBuffer(value)) return value;
  if (value instanceof Uint8Array) return Buffer.from(value);

  if (isMongoBinary(value)) {
    if (typeof value.buffer === 'function') return Buffer.from(value.buffer());
    if (Buffer.isBuffer(value.buffer)) return value.buffer;
  }

  if (value?.buffer && Buffer.isBuffer(value.buffer)) return value.buffer;
  if (value?.$binary?.base64) return Buffer.from(value.$binary.base64, 'base64');
  if (typeof value?.base64 === 'string' && value.base64.trim()) {
    return Buffer.from(value.base64.trim(), 'base64');
  }

  return null;
};

const resolveUrl = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith('//')) return `https:${raw}`;
  if (raw.startsWith('/') && relativeAssetBaseUrl) return `${relativeAssetBaseUrl}${raw}`;
  return raw;
};

const fetchRemoteFile = async (url) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REMOTE_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(resolveUrl(url), {
      method: 'GET',
      signal: controller.signal,
      redirect: 'follow',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return {
      buffer: Buffer.from(arrayBuffer),
      mimeType: response.headers.get('content-type') || '',
      size: Number(response.headers.get('content-length') || 0) || Buffer.byteLength(Buffer.from(arrayBuffer)),
    };
  } finally {
    clearTimeout(timeoutId);
  }
};

const uploadAssetToImageKit = async ({
  collectionName,
  documentId,
  sourceLabel,
  buffer,
  mimeType,
  fileName,
  fallbackBaseName,
}) => {
  const resolvedMimeType =
    mimeType || mimeFromExtension(fileName) || guessMimeTypeFromBuffer(buffer, 'application/octet-stream');
  const resolvedName = buildUniqueFileName({
    baseName: fallbackBaseName,
    fileName,
    mimeType: resolvedMimeType,
    documentId: String(documentId || ''),
    label: sourceLabel,
  });

  if (DRY_RUN) {
    return {
      url: `${env.IMAGEKIT_URL_ENDPOINT.replace(/\/$/, '')}${IMAGEKIT_FOLDER}/${resolvedName}`,
      fileId: `dry-run-${collectionName}-${documentId}`,
      name: resolvedName,
      size: buffer.length,
      type: resolvedMimeType,
    };
  }

  const uploaded = await imagekit.upload({
    file: buffer,
    fileName: resolvedName,
    folder: IMAGEKIT_FOLDER,
    useUniqueFileName: true,
  });

  return {
    url: uploaded.url,
    fileId: uploaded.fileId,
    name: uploaded.name || resolvedName,
    size: buffer.length,
    type: resolvedMimeType,
  };
};

const resolveLegacyAsset = async ({
  candidateValue,
  candidateUrl,
  fileName,
  mimeType,
}) => {
  const fromDataUri = extractDataUri(candidateValue) || extractDataUri(candidateUrl);
  if (fromDataUri?.buffer) {
    return {
      buffer: fromDataUri.buffer,
      mimeType: mimeType || fromDataUri.mimeType || mimeFromExtension(fileName),
    };
  }

  const directBuffer = extractBuffer(candidateValue);
  if (directBuffer) {
    return {
      buffer: directBuffer,
      mimeType: mimeType || mimeFromExtension(fileName) || guessMimeTypeFromBuffer(directBuffer),
    };
  }

  const remoteUrl = resolveUrl(candidateUrl || candidateValue);
  if (remoteUrl && /^https?:\/\//i.test(remoteUrl) && !isImageKitUrl(remoteUrl)) {
    const downloaded = await fetchRemoteFile(remoteUrl);
    return {
      buffer: downloaded.buffer,
      mimeType: mimeType || downloaded.mimeType || mimeFromExtension(fileName) || guessMimeTypeFromBuffer(downloaded.buffer),
    };
  }

  return null;
};

const chunkedInsertBackup = async (db, sourceName, backupName) => {
  const sourceCollection = db.collection(sourceName);
  const backupCollection = db.collection(backupName);
  const cursor = sourceCollection.find({});
  let batch = [];

  for await (const document of cursor) {
    batch.push(document);

    if (batch.length >= BATCH_SIZE) {
      await backupCollection.insertMany(batch, { ordered: false });
      batch = [];
    }
  }

  if (batch.length > 0) {
    await backupCollection.insertMany(batch, { ordered: false });
  }
};

const backupCollection = async (db, sourceName) => {
  if (!CREATE_BACKUPS || DRY_RUN) {
    logCollectionNote(sourceName, 'Backup skipped by configuration or dry-run mode.');
    return;
  }

  const exists = await db.listCollections({ name: sourceName }, { nameOnly: true }).hasNext();
  if (!exists) return;

  const backupName = `${sourceName}_backup_${RUN_ID}`;
  const backupExists = await db.listCollections({ name: backupName }, { nameOnly: true }).hasNext();
  if (backupExists) {
    logCollectionNote(sourceName, `Backup collection already exists: ${backupName}`);
    return;
  }

  await chunkedInsertBackup(db, sourceName, backupName);
  report.backupsCreated.push(backupName);
  logCollectionNote(sourceName, `Backup created: ${backupName}`);
};

const findLegacyPaths = (value, currentPath = '', found = []) => {
  if (value === null || value === undefined) return found;

  if (Buffer.isBuffer(value) || isMongoBinary(value) || value?.$binary?.base64) {
    found.push(currentPath || '<root>');
    return found;
  }

  if (typeof value === 'string') {
    if (isDataUri(value)) {
      found.push(currentPath || '<root>');
    }
    return found;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      findLegacyPaths(item, `${currentPath}[${index}]`, found);
    });
    return found;
  }

  if (typeof value === 'object') {
    Object.entries(value).forEach(([key, child]) => {
      const nextPath = currentPath ? `${currentPath}.${key}` : key;
      findLegacyPaths(child, nextPath, found);
    });
  }

  return found;
};

const hasMetadataAsset = (value) =>
  Boolean(
    value &&
      typeof value === 'object' &&
      String(value.url || '').trim() &&
      String(value.fileId || '').trim(),
  );

const migrateCandidateFiles = async (db) => {
  const collectionName = 'candidatefiles';
  const collection = db.collection(collectionName);
  const cursor = collection.find({});

  for await (const document of cursor) {
    try {
      if (document.url && document.fileId) {
        increment(collectionName, 'skipped');
        continue;
      }

      const legacyAsset = await resolveLegacyAsset({
        candidateValue: document.data || document.base64 || document.buffer,
        candidateUrl: document.url,
        fileName: document.fileName || document.name,
        mimeType: document.mimeType || document.type,
      });

      if (!legacyAsset) {
        if (document.url && document.fileId) {
          increment(collectionName, 'skipped');
          continue;
        }

        increment(collectionName, 'invalid');
        logCollectionNote(collectionName, `Unresolved legacy file for document ${document._id}`);
        continue;
      }

      const uploaded = await uploadAssetToImageKit({
        collectionName,
        documentId: document._id,
        sourceLabel: document.kind || 'candidate-file',
        buffer: legacyAsset.buffer,
        mimeType: legacyAsset.mimeType,
        fileName: document.fileName || document.name,
        fallbackBaseName: document.title || document.kind || 'candidate-file',
      });

      if (!DRY_RUN) {
        await collection.updateOne(
          { _id: document._id },
          {
            $set: {
              url: uploaded.url,
              fileId: uploaded.fileId,
              name: uploaded.name,
              size: uploaded.size,
              type: uploaded.type,
            },
            $unset: {
              data: '',
              base64: '',
              buffer: '',
              fileName: '',
              mimeType: '',
            },
          },
        );
      }

      increment(collectionName, 'migrated');
    } catch (error) {
      increment(collectionName, 'failed');
      logCollectionNote(collectionName, `Failed document ${document._id}: ${error.message}`);
    }
  }
};

const migrateApplications = async (db) => {
  const collectionName = 'applications';
  const collection = db.collection(collectionName);
  const cursor = collection.find({});

  for await (const document of cursor) {
    try {
      if (hasMetadataAsset(document.resumeAsset)) {
        increment(collectionName, 'skipped');
        continue;
      }

      const legacyAsset = await resolveLegacyAsset({
        candidateValue: document.resumeData,
        candidateUrl: document.resumePath,
        fileName: document.resumeFileName || `${sanitizeSegment(document.fullName || 'candidate')}-resume.pdf`,
        mimeType: document.resumeMimeType || document.resumeType,
      });

      if (!legacyAsset) {
        if (document.resumePath && !isDataUri(document.resumePath) && isImageKitUrl(document.resumePath)) {
          increment(collectionName, 'skipped');
          continue;
        }

        if (document.resumeData) {
          increment(collectionName, 'invalid');
          logCollectionNote(collectionName, `Unresolved resume payload for application ${document._id}`);
        } else {
          increment(collectionName, 'skipped');
        }
        continue;
      }

      const uploaded = await uploadAssetToImageKit({
        collectionName,
        documentId: document._id,
        sourceLabel: 'application-resume',
        buffer: legacyAsset.buffer,
        mimeType: legacyAsset.mimeType,
        fileName:
          document.resumeFileName ||
          path.basename(String(document.resumePath || '')) ||
          `${sanitizeSegment(document.fullName || 'candidate')}-resume.pdf`,
        fallbackBaseName: `${sanitizeSegment(document.fullName || 'candidate')}-resume`,
      });

      if (!DRY_RUN) {
        await collection.updateOne(
          { _id: document._id },
          {
            $set: {
              resumePath: uploaded.url,
              hasCustomResume: true,
              resumeAsset: uploaded,
              updatedAt: new Date(),
            },
            $unset: {
              resumeData: '',
              buffer: '',
              base64: '',
            },
          },
        );
      }

      increment(collectionName, 'migrated');
    } catch (error) {
      increment(collectionName, 'failed');
      logCollectionNote(collectionName, `Failed document ${document._id}: ${error.message}`);
    }
  }
};

const migrateResumes = async (db) => {
  const collectionName = 'resumes';
  const collection = db.collection(collectionName);
  const cursor = collection.find({});

  for await (const document of cursor) {
    try {
      if (document.resumeUrl && document.resumeFileId) {
        increment(collectionName, 'skipped');
        continue;
      }

      const resumeDataHasBinary = Boolean(extractBuffer(document.resumeData) || extractDataUri(document.resumeData));
      const resumeUrlNeedsMigration =
        typeof document.resumeUrl === 'string' &&
        document.resumeUrl.trim() &&
        !isImageKitUrl(document.resumeUrl.trim());

      if (!resumeDataHasBinary && !resumeUrlNeedsMigration) {
        increment(collectionName, 'skipped');
        continue;
      }

      const legacyAsset = await resolveLegacyAsset({
        candidateValue: document.resumeData,
        candidateUrl: document.resumeUrl,
        fileName: document.resumeFileName || `${document.candidateUserId || document._id}-resume.pdf`,
        mimeType: document.resumeMimeType,
      });

      if (!legacyAsset) {
        increment(collectionName, 'invalid');
        logCollectionNote(collectionName, `Unresolved resume payload for resume document ${document._id}`);
        continue;
      }

      const uploaded = await uploadAssetToImageKit({
        collectionName,
        documentId: document._id,
        sourceLabel: 'resume',
        buffer: legacyAsset.buffer,
        mimeType: legacyAsset.mimeType,
        fileName: document.resumeFileName || `${document.candidateUserId || document._id}-resume.pdf`,
        fallbackBaseName: `${document.candidateUserId || document._id}-resume`,
      });

      if (!DRY_RUN) {
        await collection.updateOne(
          { _id: document._id },
          {
            $set: {
              resumeType: 'uploaded',
              resumeUrl: uploaded.url,
              resumeFileId: uploaded.fileId,
              resumeFileName: uploaded.name,
              resumeAsset: uploaded,
              updatedAt: new Date(),
            },
            $unset: {
              resumeData: '',
              base64: '',
              buffer: '',
            },
          },
        );
      }

      increment(collectionName, 'migrated');
    } catch (error) {
      increment(collectionName, 'failed');
      logCollectionNote(collectionName, `Failed document ${document._id}: ${error.message}`);
    }
  }
};

const migrateCandidateProfiles = async (db) => {
  const collectionName = 'candidateprofiles';
  const collection = db.collection(collectionName);
  const cursor = collection.find({});

  for await (const document of cursor) {
    try {
      if (document.profilePhotoUrl && document.profilePhotoFileId) {
        increment(collectionName, 'skipped');
        continue;
      }

      const sourceValue = document.profilePhotoDataUrl || document.profilePhotoUrl || document.profilePhotoBase64;
      const needsMigration =
        Boolean(sourceValue && (isDataUri(sourceValue) || !isImageKitUrl(resolveUrl(sourceValue)))) ||
        Boolean(document.profilePhotoDataUrl);

      if (!needsMigration) {
        increment(collectionName, 'skipped');
        continue;
      }

      const legacyAsset = await resolveLegacyAsset({
        candidateValue: sourceValue,
        candidateUrl: sourceValue,
        fileName: document.profilePhotoName || `${sanitizeSegment(document.fullName || 'candidate')}-profile-photo.jpg`,
        mimeType: document.profilePhotoType || '',
      });

      if (!legacyAsset) {
        increment(collectionName, 'invalid');
        logCollectionNote(collectionName, `Unresolved profile photo for candidate profile ${document._id}`);
        continue;
      }

      const uploaded = await uploadAssetToImageKit({
        collectionName,
        documentId: document._id,
        sourceLabel: 'profile-photo',
        buffer: legacyAsset.buffer,
        mimeType: legacyAsset.mimeType,
        fileName: document.profilePhotoName || `${sanitizeSegment(document.fullName || 'candidate')}-profile-photo.jpg`,
        fallbackBaseName: `${sanitizeSegment(document.fullName || 'candidate')}-profile-photo`,
      });

      if (!DRY_RUN) {
        await collection.updateOne(
          { _id: document._id },
          {
            $set: {
              profilePhotoUrl: uploaded.url,
              profilePhotoFileId: uploaded.fileId,
              profilePhotoAsset: uploaded,
              updatedAt: new Date(),
            },
            $unset: {
              profilePhotoDataUrl: '',
              profilePhotoBase64: '',
              data: '',
              buffer: '',
              base64: '',
            },
          },
        );
      }

      increment(collectionName, 'migrated');
    } catch (error) {
      increment(collectionName, 'failed');
      logCollectionNote(collectionName, `Failed document ${document._id}: ${error.message}`);
    }
  }
};

const replaceDataUriImages = async ({ collectionName, documentId, html }) => {
  const matches = [...String(html || '').matchAll(/<img[^>]+src=["'](data:image\/[^"']+)["'][^>]*>/gi)];
  if (matches.length === 0) {
    return { updatedHtml: html, migratedCount: 0 };
  }

  let updatedHtml = String(html || '');
  let migratedCount = 0;

  for (let index = 0; index < matches.length; index += 1) {
    const dataUri = matches[index][1];
    const extracted = extractDataUri(dataUri);
    if (!extracted?.buffer) continue;

    const uploaded = await uploadAssetToImageKit({
      collectionName,
      documentId: `${documentId}-${index}`,
      sourceLabel: 'blog-inline-image',
      buffer: extracted.buffer,
      mimeType: extracted.mimeType,
      fileName: `blog-inline-image-${index}.${extensionFromMime(extracted.mimeType) || 'png'}`,
      fallbackBaseName: `blog-inline-image-${index}`,
    });

    updatedHtml = updatedHtml.replace(dataUri, uploaded.url);
    migratedCount += 1;
  }

  return { updatedHtml, migratedCount };
};

const migrateBlogPosts = async (db) => {
  const collectionName = 'blogposts';
  const collection = db.collection(collectionName);
  const cursor = collection.find({});

  for await (const document of cursor) {
    try {
      const setPayload = {};
      const unsetPayload = {};
      let didChange = false;
      const hasCoverMetadata = hasMetadataAsset(document.coverImageAsset);

      if (!hasCoverMetadata && document.coverImage && (isDataUri(document.coverImage) || !isImageKitUrl(resolveUrl(document.coverImage)))) {
        const legacyAsset = await resolveLegacyAsset({
          candidateValue: document.coverImage,
          candidateUrl: document.coverImage,
          fileName: `${sanitizeSegment(document.slug || document.title || 'blog-cover')}-cover.jpg`,
          mimeType: '',
        });

        if (legacyAsset) {
          const uploaded = await uploadAssetToImageKit({
            collectionName,
            documentId: `${document._id}-cover`,
            sourceLabel: 'blog-cover',
            buffer: legacyAsset.buffer,
            mimeType: legacyAsset.mimeType,
            fileName: `${sanitizeSegment(document.slug || document.title || 'blog-cover')}-cover.jpg`,
            fallbackBaseName: `${sanitizeSegment(document.slug || document.title || 'blog-cover')}-cover`,
          });

          setPayload.coverImage = uploaded.url;
          setPayload.coverImageAsset = uploaded;
          didChange = true;
        }
      }

      if (document.contentHtml && String(document.contentHtml).includes('data:image/')) {
        const { updatedHtml, migratedCount } = await replaceDataUriImages({
          collectionName,
          documentId: document._id,
          html: document.contentHtml,
        });

        if (migratedCount > 0) {
          setPayload.contentHtml = updatedHtml;
          didChange = true;
        }
      }

      if (hasCoverMetadata && !String(document.contentHtml || '').includes('data:image/')) {
        increment(collectionName, 'skipped');
        continue;
      }

      unsetPayload.base64 = '';
      unsetPayload.buffer = '';
      unsetPayload.data = '';

      if (!didChange) {
        increment(collectionName, 'skipped');
        continue;
      }

      if (!DRY_RUN) {
        await collection.updateOne(
          { _id: document._id },
          {
            $set: {
              ...setPayload,
              updatedAt: new Date(),
            },
            $unset: unsetPayload,
          },
        );
      }

      increment(collectionName, 'migrated');
    } catch (error) {
      increment(collectionName, 'failed');
      logCollectionNote(collectionName, `Failed document ${document._id}: ${error.message}`);
    }
  }
};

const migrateClientProfiles = async (db) => {
  const collectionName = 'clientprofiles';
  const collection = db.collection(collectionName);
  const cursor = collection.find({});

  for await (const document of cursor) {
    try {
      const profileImage = document.profileImage || {};
      if (profileImage.url && profileImage.fileId) {
        increment(collectionName, 'skipped');
        continue;
      }

      const needsMigration =
        Boolean(profileImage.data || profileImage.base64 || profileImage.buffer) ||
        Boolean(profileImage.url && !isImageKitUrl(resolveUrl(profileImage.url)));

      if (!needsMigration) {
        increment(collectionName, 'skipped');
        continue;
      }

      const legacyAsset = await resolveLegacyAsset({
        candidateValue: profileImage.data || profileImage.base64 || profileImage.buffer,
        candidateUrl: profileImage.url,
        fileName: profileImage.fileName || profileImage.name || `${sanitizeSegment(document.companyName || 'client')}-profile-image.jpg`,
        mimeType: profileImage.mimeType || profileImage.type,
      });

      if (!legacyAsset) {
        increment(collectionName, 'invalid');
        logCollectionNote(collectionName, `Unresolved profile image for client profile ${document._id}`);
        continue;
      }

      const uploaded = await uploadAssetToImageKit({
        collectionName,
        documentId: document._id,
        sourceLabel: 'client-profile-image',
        buffer: legacyAsset.buffer,
        mimeType: legacyAsset.mimeType,
        fileName: profileImage.fileName || profileImage.name || `${sanitizeSegment(document.companyName || 'client')}-profile-image.jpg`,
        fallbackBaseName: `${sanitizeSegment(document.companyName || 'client')}-profile-image`,
      });

      if (!DRY_RUN) {
        await collection.updateOne(
          { _id: document._id },
          {
            $set: {
              'profileImage.url': uploaded.url,
              'profileImage.fileId': uploaded.fileId,
              'profileImage.name': uploaded.name,
              'profileImage.size': uploaded.size,
              'profileImage.type': uploaded.type,
              updatedAt: new Date(),
            },
            $unset: {
              'profileImage.data': '',
              'profileImage.base64': '',
              'profileImage.buffer': '',
              'profileImage.fileName': '',
              'profileImage.mimeType': '',
            },
          },
        );
      }

      increment(collectionName, 'migrated');
    } catch (error) {
      increment(collectionName, 'failed');
      logCollectionNote(collectionName, `Failed document ${document._id}: ${error.message}`);
    }
  }
};

const migrateBlogImageAssets = async (db) => {
  const collectionName = 'blogimageassets';
  const collection = db.collection(collectionName);
  const cursor = collection.find({});

  for await (const document of cursor) {
    try {
      if (document.url && document.fileId) {
        increment(collectionName, 'skipped');
        continue;
      }

      const legacyAsset = await resolveLegacyAsset({
        candidateValue: document.data || document.base64 || document.buffer,
        candidateUrl: document.url,
        fileName: document.fileName || document.name || `blog-image-${document._id}.png`,
        mimeType: document.mimeType || document.type,
      });

      if (!legacyAsset) {
        if (document.url && document.fileId) {
          increment(collectionName, 'skipped');
          continue;
        }

        increment(collectionName, 'invalid');
        logCollectionNote(collectionName, `Unresolved blog image asset for document ${document._id}`);
        continue;
      }

      const uploaded = await uploadAssetToImageKit({
        collectionName,
        documentId: document._id,
        sourceLabel: 'blog-image-asset',
        buffer: legacyAsset.buffer,
        mimeType: legacyAsset.mimeType,
        fileName: document.fileName || document.name || `blog-image-${document._id}.png`,
        fallbackBaseName: `blog-image-${document._id}`,
      });

      if (!DRY_RUN) {
        await collection.updateOne(
          { _id: document._id },
          {
            $set: uploaded,
            $unset: {
              data: '',
              base64: '',
              buffer: '',
              fileName: '',
              mimeType: '',
            },
          },
        );
      }

      increment(collectionName, 'migrated');
    } catch (error) {
      increment(collectionName, 'failed');
      logCollectionNote(collectionName, `Failed document ${document._id}: ${error.message}`);
    }
  }
};

const cleanupLegacyFields = async (db) => {
  if (DRY_RUN) return;

  const cleanupOperations = [
    {
      collectionName: 'candidatefiles',
      unset: {
        data: '',
        base64: '',
        buffer: '',
        fileName: '',
        mimeType: '',
      },
    },
    {
      collectionName: 'applications',
      unset: {
        buffer: '',
        base64: '',
      },
    },
    {
      collectionName: 'candidateprofiles',
      unset: {
        data: '',
        base64: '',
        buffer: '',
        profilePhotoDataUrl: '',
        profilePhotoBase64: '',
      },
    },
    {
      collectionName: 'clientprofiles',
      unset: {
        'profileImage.data': '',
        'profileImage.base64': '',
        'profileImage.buffer': '',
        'profileImage.fileName': '',
        'profileImage.mimeType': '',
      },
    },
    {
      collectionName: 'blogimageassets',
      unset: {
        data: '',
        base64: '',
        buffer: '',
        fileName: '',
        mimeType: '',
      },
    },
  ];

  for (const operation of cleanupOperations) {
    const exists = await db.listCollections({ name: operation.collectionName }, { nameOnly: true }).hasNext();
    if (!exists) continue;
    await db.collection(operation.collectionName).updateMany({}, { $unset: operation.unset });
  }
};

const discoverCollectionsWithLegacyHints = async (db) => {
  const names = await db.listCollections({}, { nameOnly: true }).toArray();
  const discovered = new Set();

  for (const item of names) {
    const collectionName = item.name;
    const count = await db.collection(collectionName).countDocuments(HINT_QUERY, { limit: 1 });
    if (count > 0) {
      discovered.add(collectionName);
    }
  }

  return [...discovered];
};

const validateCollections = async (db, collectionNames) => {
  for (const collectionName of collectionNames) {
    const exists = await db.listCollections({ name: collectionName }, { nameOnly: true }).hasNext();
    if (!exists) continue;

    const collection = db.collection(collectionName);
    const cursor = collection.find({});

    for await (const document of cursor) {
      const paths = findLegacyPaths(document);
      if (paths.length === 0) continue;

      increment(collectionName, 'invalid');
      logCollectionNote(
        collectionName,
        `Validation found legacy payloads in ${document._id}: ${paths.slice(0, 10).join(', ')}`,
      );
    }
  }
};

const printSummary = () => {
  console.log('\nMigration Summary');
  console.log('=================');
  console.log(`Run ID: ${report.runId}`);
  console.log(`Dry run: ${report.dryRun}`);
  console.log(`Backups created: ${report.backupsCreated.length}`);
  console.log(`Migrated: ${report.migrated}`);
  console.log(`Skipped: ${report.skipped}`);
  console.log(`Failed: ${report.failed}`);
  console.log(`Invalid: ${report.invalid}`);
  console.log('');

  Object.entries(report.collections).forEach(([collectionName, info]) => {
    console.log(
      `${collectionName}: migrated=${info.migrated} skipped=${info.skipped} failed=${info.failed} invalid=${info.invalid}`,
    );
    info.notes.slice(0, 20).forEach((note) => {
      console.log(`  - ${note}`);
    });
    if (info.notes.length > 20) {
      console.log(`  - ... ${info.notes.length - 20} more notes`);
    }
  });
};

const ensureMigrationLockIndex = async (db) => {
  if (DRY_RUN) return;

  await db.collection(MIGRATION_LOGS_COLLECTION).createIndex(
    { name: 1 },
    { unique: true, name: 'migration_name_unique' },
  );
};

const getExistingMigrationLog = async (db) =>
  db.collection(MIGRATION_LOGS_COLLECTION).findOne({ name: MIGRATION_NAME });

const markMigrationCompleted = async (db) => {
  if (DRY_RUN) {
    console.log('Dry run enabled. Skipping migration_logs completion write.');
    return;
  }

  await db.collection(MIGRATION_LOGS_COLLECTION).updateOne(
    { name: MIGRATION_NAME },
    {
      $set: {
        name: MIGRATION_NAME,
        status: 'completed',
        executedAt: new Date(),
      },
    },
    { upsert: true },
  );
};

const main = async () => {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.MONGODB_URI, {
    autoIndex: false,
    serverSelectionTimeoutMS: 10000,
  });

  const db = mongoose.connection.db;
  await ensureMigrationLockIndex(db);

  const existingMigrationLog = await getExistingMigrationLog(db);
  if (existingMigrationLog) {
    console.log(
      `Migration already executed: ${MIGRATION_NAME} at ${existingMigrationLog.executedAt || 'unknown time'}`,
    );
    return;
  }

  const discoveredCollections = await discoverCollectionsWithLegacyHints(db);
  const collectionsToBackup = [...new Set([...KNOWN_COLLECTIONS, ...discoveredCollections])];

  console.log(`Discovered collections with legacy hints: ${discoveredCollections.join(', ') || 'none'}`);

  for (const collectionName of collectionsToBackup) {
    await backupCollection(db, collectionName);
  }

  await migrateCandidateFiles(db);
  await migrateApplications(db);
  await migrateResumes(db);
  await migrateCandidateProfiles(db);
  await migrateBlogPosts(db);
  await migrateClientProfiles(db);
  await migrateBlogImageAssets(db);
  await cleanupLegacyFields(db);

  await validateCollections(db, [...new Set([...KNOWN_COLLECTIONS, ...discoveredCollections])]);
  if (report.failed === 0 && report.invalid === 0) {
    await markMigrationCompleted(db);
  } else {
    console.log(
      `Migration lock not written because failed=${report.failed} invalid=${report.invalid}.`,
    );
  }
  printSummary();

  if (report.failed > 0 || report.invalid > 0) {
    process.exitCode = 1;
  }
};

main()
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => undefined);
  });
