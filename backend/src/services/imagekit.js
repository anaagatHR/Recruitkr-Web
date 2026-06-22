import crypto from 'node:crypto';
import path from 'node:path';

import { imagekit } from '../config/imagekit.js';

const DEFAULT_UPLOAD_FOLDER = '/recruitkr';

const sanitizeSegment = (value = '') =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'file';

const normalizeFolder = (value = DEFAULT_UPLOAD_FOLDER) => {
  const trimmed = String(value || DEFAULT_UPLOAD_FOLDER).trim();
  const normalized = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return normalized.replace(/\/{2,}/g, '/').replace(/\/$/, '') || DEFAULT_UPLOAD_FOLDER;
};

const isDnsError = (error) =>
  error?.code === 'ENOTFOUND' || error?.code === 'EAI_AGAIN' || error?.code === 'ETIMEDOUT';

const withRetry = async (operation, label, retries = 1) => {
  let lastError;
  for (let attempt = 1; attempt <= retries + 1; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const shouldRetry = isDnsError(error) && attempt <= retries;
      console.warn('[imagekit]', label, {
        attempt,
        message: error instanceof Error ? error.message : String(error),
        code: error?.code,
        retrying: shouldRetry,
      });
      if (!shouldRetry) break;
    }
  }

  throw lastError;
};

export const buildUniqueUploadName = (originalName = 'file') => {
  const parsed = path.parse(String(originalName || 'file'));
  const baseName = sanitizeSegment(parsed.name || 'file');
  const extension = sanitizeSegment(parsed.ext.replace(/^\./, ''));
  const uniqueSuffix = `${Date.now()}-${crypto.randomUUID()}`;

  return extension ? `${baseName}-${uniqueSuffix}.${extension}` : `${baseName}-${uniqueSuffix}`;
};

export const uploadBufferToImageKit = async ({
  buffer,
  originalName,
  folder = DEFAULT_UPLOAD_FOLDER,
}) => {
  const fileName = buildUniqueUploadName(originalName);
  const response = await withRetry(
    () =>
      imagekit.upload({
        file: buffer,
        fileName,
        folder: normalizeFolder(folder),
        useUniqueFileName: false,
      }),
    'upload',
  );

  return {
    url: response.url,
    fileId: response.fileId,
    name: response.name || fileName,
  };
};

export const listImageKitFiles = async ({
  folder = DEFAULT_UPLOAD_FOLDER,
  limit = 100,
  fileType = 'image',
} = {}) => {
  const path = normalizeFolder(folder);
  const files = await withRetry(
    () =>
      imagekit.listFiles({
        path,
        fileType,
        limit,
        sort: 'ASC_NAME',
      }),
    'listFiles',
  );

  return (files || [])
    .filter((file) => file.type === 'file')
    .map((file) => ({
      name: file.name,
      url: file.url,
      fileId: file.fileId,
    }));
};

export const deleteImageKitFile = async (fileId) => {
  const safeFileId = String(fileId || '').trim();
  if (!safeFileId) return;

  await withRetry(() => imagekit.deleteFile(safeFileId), 'deleteFile');
};
