import multer from 'multer';

import { ApiError } from '../utils/ApiError.js';

const createMemoryUpload = ({ allowedMimeTypes, maxFileSizeBytes, invalidFileMessage }) =>
  multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxFileSizeBytes, files: 1 },
    fileFilter: (_req, file, cb) => {
      if (!allowedMimeTypes.has(file.mimetype)) {
        return cb(new ApiError(400, invalidFileMessage));
      }
      return cb(null, true);
    },
  });

const allowedResumeMimeTypes = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

export const resumeUpload = createMemoryUpload({
  allowedMimeTypes: allowedResumeMimeTypes,
  maxFileSizeBytes: 2 * 1024 * 1024,
  invalidFileMessage: 'Only PDF and DOCX resumes are supported',
});

const allowedPhotoMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

export const profilePhotoUpload = createMemoryUpload({
  allowedMimeTypes: allowedPhotoMimeTypes,
  maxFileSizeBytes: 5 * 1024 * 1024,
  invalidFileMessage: 'Only JPG, PNG, or WEBP images are supported',
});

const allowedCertificateMimeTypes = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const allowedBlogImageMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export const certificateUpload = createMemoryUpload({
  allowedMimeTypes: allowedCertificateMimeTypes,
  maxFileSizeBytes: 5 * 1024 * 1024,
  invalidFileMessage: 'Only PDF or image certificates are supported',
});

export const blogImageUpload = createMemoryUpload({
  allowedMimeTypes: allowedBlogImageMimeTypes,
  maxFileSizeBytes: 5 * 1024 * 1024,
  invalidFileMessage: 'Only JPG, PNG, WEBP, or GIF blog images are supported',
});

const allowedSecureUploadMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]);

export const secureFileUpload = createMemoryUpload({
  allowedMimeTypes: allowedSecureUploadMimeTypes,
  maxFileSizeBytes: 5 * 1024 * 1024,
  invalidFileMessage: 'Only JPEG, PNG, WEBP, or PDF files are supported',
});

