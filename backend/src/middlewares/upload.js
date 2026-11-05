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

// Chat attachments: documents/images (as secure uploads) plus short voice
// notes recorded in the browser (MediaRecorder emits webm/ogg on Chromium and
// mp4/m4a on Safari).
const allowedMessageMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'audio/webm',
  'audio/ogg',
  'audio/mpeg',
  'audio/mp4',
  'audio/wav',
  'audio/x-m4a',
  'audio/aac',
]);

export const messageFileUpload = createMemoryUpload({
  allowedMimeTypes: allowedMessageMimeTypes,
  maxFileSizeBytes: 10 * 1024 * 1024,
  invalidFileMessage: 'Only images, PDFs, or voice notes can be sent in chat',
});

const allowedVideoMimeTypes = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-matroska',
]);

// Candidate intro videos can be large; allow up to 50MB.
export const videoUpload = createMemoryUpload({
  allowedMimeTypes: allowedVideoMimeTypes,
  maxFileSizeBytes: 50 * 1024 * 1024,
  invalidFileMessage: 'Only MP4, WEBM, MOV, or MKV videos are supported',
});

// Site Studio media: website images (incl. SVG logos) and short videos. The
// multer cap is the video cap; the controller re-checks the real file type
// from its bytes and applies the per-type limit (5MB images, 50MB video).
export const STUDIO_MEDIA_LIMITS = {
  'image/jpeg': 5 * 1024 * 1024,
  'image/png': 5 * 1024 * 1024,
  'image/webp': 5 * 1024 * 1024,
  'image/svg+xml': 5 * 1024 * 1024,
  'video/mp4': 50 * 1024 * 1024,
  'video/webm': 50 * 1024 * 1024,
};

export const studioMediaUpload = createMemoryUpload({
  allowedMimeTypes: new Set(Object.keys(STUDIO_MEDIA_LIMITS)),
  maxFileSizeBytes: 50 * 1024 * 1024,
  invalidFileMessage: 'Only JPG, PNG, WEBP or SVG images and MP4 or WEBM videos are supported',
});

