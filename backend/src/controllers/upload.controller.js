import { StatusCodes } from 'http-status-codes';

import { listImageKitFiles, uploadBufferToImageKit } from '../services/imagekit.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const allowedFolders = new Map([
  ['recruitkr', '/recruitkr'],
  ['resumes', '/recruitkr/resumes'],
  ['profiles', '/recruitkr/profiles'],
  ['team', '/recruitkr/team'],
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
  const logos = await listImageKitFiles({ folder: '/ocmpany logo', limit: 100 });

  res.status(StatusCodes.OK).json({
    success: true,
    data: logos,
  });
});

export const listJobVideos = asyncHandler(async (_req, res) => {
  const videos = await listImageKitFiles({
    folder: '/ocmpany logo/Home-Video',
    fileType: 'non-image',
    limit: 100,
  });

  res.status(StatusCodes.OK).json({
    success: true,
    data: videos,
  });
});

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

  const asset = await uploadBufferToImageKit({
    buffer: req.file.buffer,
    originalName: req.file.originalname,
    folder: resolveUploadFolder(req.body?.folder),
  });

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
