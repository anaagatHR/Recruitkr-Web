import { StatusCodes } from 'http-status-codes';

import { CandidateProfile } from '../models/CandidateProfile.js';
import { User } from '../models/User.js';
import { isDriveConfigured, resumeDriveFileName, uploadResumeToDrive } from '../services/googleDrive.service.js';
import { listImageKitFiles, uploadBufferToImageKit } from '../services/imagekit.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const isImageKitDnsError = (error) =>
  error?.code === 'ENOTFOUND' || error?.code === 'EAI_AGAIN' || error?.code === 'ETIMEDOUT';

const allowedFolders = new Map([
  ['recruitkr', '/recruitkr'],
  ['resumes', '/recruitkr/resumes'],
  ['profiles', '/recruitkr/profiles'],
  ['team', '/recruitkr/team'],
  ['site', '/recruitkr/site'],
  ['blogs', '/recruitkr_blog'],
  ['certificates', '/recruitkr/certificates'],
]);

const resolveUploadFolder = (value) => {
  const key = String(value || 'recruitkr').trim().toLowerCase();
  const folder = allowedFolders.get(key);
  if (!folder) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid upload folder');
  }

  return folder;
};

export const listCompanyLogos = asyncHandler(async (_req, res) => {
  try {
    const logos = await listImageKitFiles({ folder: '/ocmpany logo', limit: 100 });

    res.status(StatusCodes.OK).json({
      success: true,
      data: logos,
    });
  } catch (error) {
    if (isImageKitDnsError(error)) {
      console.warn('[upload] listCompanyLogos failed due to DNS', { message: error.message });
      throw new ApiError(StatusCodes.SERVICE_UNAVAILABLE, 'Image storage is temporarily unavailable.');
    }

    throw error;
  }
});

export const listJobVideos = asyncHandler(async (_req, res) => {
  try {
    const videos = await listImageKitFiles({
      folder: '/ocmpany logo/Home-Video',
      fileType: 'non-image',
      limit: 100,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      data: videos,
    });
  } catch (error) {
    if (isImageKitDnsError(error)) {
      console.warn('[upload] listJobVideos failed due to DNS', { message: error.message });
      throw new ApiError(StatusCodes.SERVICE_UNAVAILABLE, 'Image storage is temporarily unavailable.');
    }

    throw error;
  }
});

/** Copy a candidate's freshly uploaded resume into the Google Drive folder. */
const copyResumeToDrive = async (userId, file) => {
  const [user, profile] = await Promise.all([
    User.findById(userId).select('email mobile').lean(),
    CandidateProfile.findOne({ userId }).select('fullName').lean(),
  ]);
  await uploadResumeToDrive({
    buffer: file.buffer,
    mimeType: file.mimetype,
    fileName: resumeDriveFileName({
      name: profile?.fullName || user?.email,
      mobile: user?.mobile,
      originalName: file.originalname,
    }),
  });
};

export const uploadFile = asyncHandler(async (req, res) => {
  if (typeof req.body?.file === 'string' && req.body.file.trim().startsWith('data:')) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Base64 uploads are not allowed. Send the file as multipart/form-data.',
    );
  }

  if (!req.file) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'File is required');
  }

  let asset;
  try {
    asset = await uploadBufferToImageKit({
      buffer: req.file.buffer,
      originalName: req.file.originalname,
      folder: resolveUploadFolder(req.body?.folder),
    });
  } catch (error) {
    if (isImageKitDnsError(error)) {
      console.warn('[upload] uploadFile failed due to DNS', { message: error.message });
      throw new ApiError(StatusCodes.SERVICE_UNAVAILABLE, 'Image upload is temporarily unavailable.');
    }

    throw error;
  }

  // Background copy: Drive being slow or misconfigured must never fail or
  // delay the candidate's upload. Failures are logged for the team to see.
  const isCandidateResume =
    String(req.body?.folder || '').trim().toLowerCase() === 'resumes' && req.user?.role === 'candidate';
  if (isCandidateResume && isDriveConfigured()) {
    copyResumeToDrive(req.user.id, req.file).catch((error) =>
      console.error('[drive] resume copy failed', { userId: req.user.id, message: error.message }),
    );
  }

  const payload = {
    url: asset.url,
    fileId: asset.fileId,
    name: asset.name,
    size: req.file.size,
    type: req.file.mimetype,
  };

  res.status(StatusCodes.CREATED).json({
    success: true,
    ...payload,
    data: payload,
  });
});
