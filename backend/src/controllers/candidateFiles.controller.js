import { StatusCodes } from 'http-status-codes';

import { CandidateFile } from '../models/CandidateFile.js';
import { CandidateProfile } from '../models/CandidateProfile.js';
import { deleteImageKitFile, uploadBufferToImageKit } from '../services/imagekit.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const uploadMyProfilePhoto = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Profile photo file is required');
  }

  const profile = await CandidateProfile.findOne({ userId: req.user.id }).exec();
  if (!profile) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Candidate profile not found');
  }

  const previousFileId = String(profile.profilePhotoFileId || '').trim();
  const asset = await uploadBufferToImageKit({
    buffer: req.file.buffer,
    originalName: req.file.originalname,
    folder: '/recruitkr/profiles',
  });

  if (previousFileId && previousFileId !== asset.fileId) {
    try {
      await deleteImageKitFile(previousFileId);
    } catch (error) {
      console.error('[candidate-profile-photo] failed to delete previous file', error);
    }
  }

  profile.profilePhotoUrl = asset.url;
  profile.profilePhotoFileId = asset.fileId;
  await profile.save();

  res.status(StatusCodes.CREATED).json({
    success: true,
    data: {
      url: asset.url,
      fileId: asset.fileId,
      name: asset.name,
      size: req.file.size,
      type: req.file.mimetype,
    },
  });
});

export const getMyProfilePhoto = asyncHandler(async (req, res) => {
  const profile = await CandidateProfile.findOne({ userId: req.user.id })
    .select('profilePhotoUrl')
    .lean()
    .exec();

  if (!profile?.profilePhotoUrl) {
    return res.status(StatusCodes.NO_CONTENT).send();
  }

  return res.redirect(profile.profilePhotoUrl);
});

export const deleteMyProfilePhoto = asyncHandler(async (req, res) => {
  const profile = await CandidateProfile.findOne({ userId: req.user.id }).exec();
  if (!profile) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Candidate profile not found');
  }

  const previousFileId = String(profile.profilePhotoFileId || '').trim();
  if (previousFileId) {
    try {
      await deleteImageKitFile(previousFileId);
    } catch (error) {
      console.error('[candidate-profile-photo] failed to delete file', error);
    }
  }

  profile.profilePhotoUrl = '';
  profile.profilePhotoFileId = '';
  await profile.save();
  res.json({ success: true, message: 'Profile photo removed' });
});

export const uploadMyCertificate = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Certificate file is required');
  }

  const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';

  const asset = await uploadBufferToImageKit({
    buffer: req.file.buffer,
    originalName: req.file.originalname,
    folder: '/recruitkr/certificates',
  });

  const doc = await CandidateFile.create({
    candidateUserId: req.user.id,
    kind: 'certificate',
    title,
    name: asset.name,
    url: asset.url,
    fileId: asset.fileId,
    size: req.file.size,
    type: req.file.mimetype,
  });

  res.status(StatusCodes.CREATED).json({
    success: true,
    data: {
      id: doc.id,
      title: doc.title,
      fileName: doc.name,
      url: doc.url,
      fileId: doc.fileId,
      mimeType: doc.type,
      size: doc.size,
      createdAt: doc.createdAt,
    },
  });
});

export const listMyCertificates = asyncHandler(async (req, res) => {
  const items = await CandidateFile.find({ candidateUserId: req.user.id, kind: 'certificate' })
    .select('_id title name url fileId type size createdAt')
    .sort({ createdAt: -1 })
    .exec();

  res.json({
    success: true,
    data: items.map((i) => ({
      id: i.id,
      title: i.title,
      fileName: i.name,
      url: i.url,
      fileId: i.fileId,
      mimeType: i.type,
      size: i.size,
      createdAt: i.createdAt,
    })),
  });
});

export const downloadMyCertificate = asyncHandler(async (req, res) => {
  const file = await CandidateFile.findOne({
    _id: req.params.certificateId,
    candidateUserId: req.user.id,
    kind: 'certificate',
  }).exec();

  if (!file) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Certificate not found');
  }

  return res.redirect(file.url);
});

export const deleteMyCertificate = asyncHandler(async (req, res) => {
  const file = await CandidateFile.findOne({
    _id: req.params.certificateId,
    candidateUserId: req.user.id,
    kind: 'certificate',
  }).exec();

  if (!file) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Certificate not found');
  }

  try {
    await deleteImageKitFile(file.fileId);
  } catch (error) {
    console.error('[candidate-certificate] failed to delete file', error);
  }

  await CandidateFile.deleteOne({ _id: file._id }).exec();
  res.json({ success: true, message: 'Certificate deleted' });
});
