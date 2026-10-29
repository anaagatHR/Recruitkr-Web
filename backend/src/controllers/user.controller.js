import { StatusCodes } from 'http-status-codes';

import { CandidateProfile } from '../models/CandidateProfile.js';
import { ClientProfile } from '../models/ClientProfile.js';
import { Resume } from '../models/Resume.js';
import { User } from '../models/User.js';
import {
  refreshProfileCompletion,
  syncCandidateLegacyFields,
  toCandidateProfileResponse,
} from '../services/candidateProfile.service.js';
import { deleteImageKitFile, uploadBufferToImageKit } from '../services/imagekit.js';
import { buildGeneratedResumeData } from '../services/resume.service.js';
import { indexCandidate, isSolrConfigured } from '../services/solr.service.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// If-Match: "3" (or W/"3", or 3) -> 3. Absent or malformed -> null (no precondition).
export const parseIfMatchRevision = (header) => {
  if (typeof header !== 'string') return null;
  const match = /^\s*(?:W\/)?"?(\d{1,9})"?\s*$/.exec(header);
  return match ? Number(match[1]) : null;
};

const ensureCandidateProfile = async ({ reqUserId, user, body = {} }) => {
  const existingProfile = await CandidateProfile.findOne({ userId: reqUserId });
  if (existingProfile) {
    // Backfill the unique RecruitKr id for profiles created before the field
    // existed (the pre-save hook assigns it). Non-fatal if the save fails.
    if (!existingProfile.recruitkrId) {
      try {
        await existingProfile.save();
      } catch (error) {
        console.warn('[candidate] could not backfill recruitkrId:', error.message);
      }
    }
    return existingProfile;
  }

  const preferences = body.preferences || {};

  // Unknown values stay empty: placeholder strings ("Not specified", an email
  // prefix as the name) made empty profiles look complete. Consent flags stay
  // false until the candidate actually gives them.
  const profile = await CandidateProfile.create({
    userId: reqUserId,
    fullName: body.fullName || '',
    dateOfBirth: body.dateOfBirth,
    gender: body.gender,
    address: body.address || '',
    pincode: body.pincode || '',
    linkedinUrl: body.linkedinUrl || '',
    portfolioUrl: body.portfolioUrl || '',
    highestQualification: body.highestQualification || '',
    experienceStatus: body.experienceStatus,
    experienceDetails: body.experienceDetails,
    preferences: {
      preferredLocation: preferences.preferredLocation || '',
      preferredIndustry: preferences.preferredIndustry || '',
      preferredRole: preferences.preferredRole || '',
      workModes: preferences.workModes || [],
    },
    summary: body.summary || '',
    skills: Array.isArray(body.skills) ? body.skills : [],
    projects: Array.isArray(body.projects) ? body.projects : [],
    certifications: Array.isArray(body.certifications) ? body.certifications : [],
    referral: body.referral || '',
    email: user?.email || '',
    declarationAccepted: false,
    representationAuthorized: false,
  });

  syncCandidateLegacyFields({ profile, user, resumeLocation: '' });
  await profile.save();
  return profile;
};

const upsertCandidateResume = async ({ profile, user, body }) => {
  const existingResume = await Resume.findOne({ candidateUserId: user._id });
  const hasExplicitResumePayload =
    body.resumeType !== undefined ||
    body.resumeUrl !== undefined ||
    body.resumeFileId !== undefined ||
    body.resumeData !== undefined;

  if (!hasExplicitResumePayload && existingResume?.resumeType === 'uploaded') {
    return {
      resumeLocation: existingResume.resumeUrl || '',
      resumeFileId: existingResume.resumeFileId || '',
    };
  }

  if (body.resumeType === 'uploaded') {
    const isReplacingUploadedResume =
      existingResume?.resumeType === 'uploaded' &&
      existingResume.resumeFileId &&
      existingResume.resumeFileId !== body.resumeFileId;
    if (isReplacingUploadedResume) {
      try {
        await deleteImageKitFile(existingResume.resumeFileId);
      } catch (error) {
        console.error('[resume] failed to delete previous uploaded resume', error);
      }
    }

    const savedResume = await Resume.findOneAndUpdate(
      { candidateUserId: user._id },
      {
        candidateUserId: user._id,
        resumeType: 'uploaded',
        resumeUrl: body.resumeUrl,
        resumeFileId: body.resumeFileId,
        resumeFileName: body.resumeFileName || '',
        resumeData: undefined,
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
        runValidators: true,
      },
    );

      return {
        resumeLocation: savedResume?.resumeUrl || '',
        resumeFileId: savedResume?.resumeFileId || '',
        resumeFileName: savedResume?.resumeFileName || '',
      };
  }

  if (existingResume?.resumeType === 'uploaded' && existingResume.resumeFileId) {
    try {
      await deleteImageKitFile(existingResume.resumeFileId);
    } catch (error) {
      console.error('[resume] failed to delete previous uploaded resume', error);
    }
  }

  // Generated resumes are a projection of the profile (audit P1-3); any
  // client-sent resumeData is ignored so the two can never drift apart.
  const resumeData = buildGeneratedResumeData(profile.toObject());

  const savedResume = await Resume.findOneAndUpdate(
    { candidateUserId: user._id },
      {
        candidateUserId: user._id,
        resumeType: 'generated',
        resumeUrl: '',
        resumeFileId: '',
        resumeFileName: '',
        resumeData,
      },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
      runValidators: true,
    },
  );

  return { resumeLocation: 'generated', resumeFileId: '', resumeFileName: '' };
};

export const getMe = asyncHandler(async (req, res) => {
  // Read-only: .lean() returns a plain object and skips Mongoose hydration.
  const user = await User.findById(req.user.id).select('_id email role mobile createdAt').lean();
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }
  res.json({ success: true, data: user });
});

export const getCandidateProfile = asyncHandler(async (req, res) => {
  // Read-only here: user is only read for email/mobile, never saved.
  const user = await User.findById(req.user.id).select('email mobile').lean();
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }
  const profile = await ensureCandidateProfile({ reqUserId: req.user.id, user, body: {} });
  res.json({ success: true, data: toCandidateProfileResponse(profile, user) });
});

export const updateCandidateProfile = asyncHandler(async (req, res) => {
  const body = req.body;

  // Read-only here: user is only read for email/mobile, never saved.
  const user = await User.findById(req.user.id).select('email mobile').lean();
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }
  const profile = await ensureCandidateProfile({ reqUserId: req.user.id, user, body });

  // Optimistic concurrency (audit P1-4): atomically claim the next revision.
  // With If-Match, only the revision the client last saw can claim it, so two
  // tabs (or a stale form) can't silently overwrite each other — the loser gets
  // 412. Without If-Match (older clients) the revision is still bumped so other
  // tabs notice. Claimed before any side effect below.
  const expectedRevision = parseIfMatchRevision(req.get('If-Match'));
  const claimed = await CandidateProfile.findOneAndUpdate(
    {
      _id: profile._id,
      ...(expectedRevision === null
        ? {}
        : { profileRevision: expectedRevision === 0 ? { $in: [0, null] } : expectedRevision }),
    },
    { $inc: { profileRevision: 1 } },
    { new: true, projection: { profileRevision: 1 }, timestamps: false },
  ).lean();
  if (!claimed) {
    throw new ApiError(
      StatusCodes.PRECONDITION_FAILED,
      'Your profile was changed in another tab or device. Reload to get the latest version, then make your edit again.',
      null,
      { code: 'PROFILE_VERSION_CONFLICT' },
    );
  }
  profile.profileRevision = claimed.profileRevision;

  // Phone lives on the User (signup, apply snapshot and resume all read User.mobile).
  if (body.mobile !== undefined && body.mobile !== user.mobile) {
    // Soft flag only (audit §4.1): families share numbers, so never block.
    if (await User.exists({ mobile: body.mobile, _id: { $ne: req.user.id } })) {
      console.warn('[profile] mobile number already used by another account — review', { userId: req.user.id });
    }
    await User.updateOne({ _id: req.user.id }, { $set: { mobile: body.mobile } });
    user.mobile = body.mobile;
  }

  const assignIfDefined = (key, value) => {
    if (value === undefined) return;
    profile[key] = value;
  };

  assignIfDefined('fullName', body.fullName);
  assignIfDefined('dateOfBirth', body.dateOfBirth);
  assignIfDefined('gender', body.gender);
  assignIfDefined('address', body.address);
  assignIfDefined('pincode', body.pincode);
  assignIfDefined('linkedinUrl', body.linkedinUrl);
  assignIfDefined('portfolioUrl', body.portfolioUrl);
  assignIfDefined('highestQualification', body.highestQualification);
  assignIfDefined('city', body.city);
  assignIfDefined('college', body.college);

  if (body.experienceStatus !== undefined) {
    profile.experienceStatus = body.experienceStatus;
    if (body.experienceStatus === 'fresher') {
      profile.experienceDetails = undefined;
      profile.experience = [];
    }
  }

  if (body.experienceDetails !== undefined) {
    profile.experienceDetails = {
      ...(profile.experienceDetails?.toObject ? profile.experienceDetails.toObject() : profile.experienceDetails),
      ...body.experienceDetails,
    };
  }

  if (body.experience !== undefined && profile.experienceStatus !== 'fresher') {
    profile.experience = body.experience.map((entry) => ({
      ...entry,
      endDate: entry.current ? '' : entry.endDate || '',
    }));
    const latest = profile.experience.find((entry) => entry.current) || profile.experience[0];
    if (latest) {
      profile.experienceDetails = {
        ...(profile.experienceDetails?.toObject ? profile.experienceDetails.toObject() : profile.experienceDetails),
        currentCompany: latest.company,
        designation: latest.role,
      };
    }
  }

  if (body.preferences !== undefined) {
    profile.preferences = {
      ...(profile.preferences?.toObject ? profile.preferences.toObject() : profile.preferences),
      ...body.preferences,
    };
  }

  assignIfDefined('summary', body.summary);
  if (body.skills !== undefined) profile.skills = body.skills;
  if (body.projects !== undefined) profile.projects = body.projects;
  if (body.certifications !== undefined) profile.certifications = body.certifications;
  assignIfDefined('referral', body.referral);
  if (body.profilePhotoUrl !== undefined) {
    const nextFileId = String(body.profilePhotoFileId || '').trim();
    const previousFileId = String(profile.profilePhotoFileId || '').trim();
    if (previousFileId && previousFileId !== nextFileId) {
      try {
        await deleteImageKitFile(previousFileId);
      } catch (error) {
        console.error('[profile-photo] failed to delete previous candidate profile photo', error);
      }
    }

    profile.profilePhotoUrl = body.profilePhotoUrl || '';
    profile.profilePhotoFileId = nextFileId;
  }

  const { resumeLocation } = await upsertCandidateResume({ profile, user, body });
  syncCandidateLegacyFields({ profile, user, resumeLocation });

  await profile.save();
  const completion = await refreshProfileCompletion(req.user.id);

  // Keep the recruiter-facing Solr candidate index in sync. Fire-and-forget:
  // Solr failures are swallowed inside the service so Mongo stays source of truth.
  if (isSolrConfigured()) {
    void indexCandidate(profile.toObject ? profile.toObject() : profile);
  }

  res.json({ success: true, data: toCandidateProfileResponse(profile, user), meta: { completion } });
});

export const getCandidateProfileCompletion = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await refreshProfileCompletion(req.user.id) });
});

export const getClientProfile = asyncHandler(async (req, res) => {
  // Read-only: .lean() skips document hydration for a faster profile load.
  const profile = await ClientProfile.findOne({ userId: req.user.id }).lean();
  if (!profile) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Client profile not found');
  }
  res.json({ success: true, data: profile });
});

export const uploadClientProfileImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Profile image file is required');
  }

  const profile = await ClientProfile.findOne({ userId: req.user.id });
  if (!profile) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Client profile not found');
  }

  const previousFileId = String(profile.profileImage?.fileId || '').trim();
  const asset = await uploadBufferToImageKit({
    buffer: req.file.buffer,
    originalName: req.file.originalname,
    folder: '/recruitkr/profiles',
  });

  if (previousFileId && previousFileId !== asset.fileId) {
    try {
      await deleteImageKitFile(previousFileId);
    } catch (error) {
      console.error('[client-profile-image] failed to delete previous file', error);
    }
  }

  profile.profileImage = {
    name: asset.name,
    url: asset.url,
    fileId: asset.fileId,
    size: req.file.size,
    type: req.file.mimetype,
  };

  await profile.save();

  res.status(StatusCodes.CREATED).json({
    success: true,
    data: {
      profileImage: profile.profileImage,
    },
  });
});

export const getClientProfileImage = asyncHandler(async (req, res) => {
  const profile = await ClientProfile.findOne({ userId: req.user.id }).select('profileImage');
  if (!profile?.profileImage?.url) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Profile image not found');
  }

  return res.redirect(profile.profileImage.url);
});

export const deleteClientProfileImage = asyncHandler(async (req, res) => {
  const profile = await ClientProfile.findOne({ userId: req.user.id });
  if (!profile) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Client profile not found');
  }

  const previousFileId = String(profile.profileImage?.fileId || '').trim();
  if (previousFileId) {
    try {
      await deleteImageKitFile(previousFileId);
    } catch (error) {
      console.error('[client-profile-image] failed to delete file', error);
    }
  }

  profile.profileImage = {
    name: '',
    url: '',
    fileId: '',
    size: 0,
    type: '',
  };

  await profile.save();

  res.json({ success: true, message: 'Profile image removed' });
});

const MAX_CANDIDATE_VIDEOS = 5;

const serializeVideo = (video) => ({
  id: video._id ? video._id.toString() : '',
  url: video.url,
  name: video.name || 'Video',
  type: video.type || '',
  size: video.size || 0,
  uploadedAt: video.uploadedAt,
});

export const listCandidateVideos = asyncHandler(async (req, res) => {
  const profile = await CandidateProfile.findOne({ userId: req.user.id }).select('videos');
  if (!profile) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Candidate profile not found');
  }
  res.json({ success: true, data: (profile.videos || []).map(serializeVideo) });
});

export const uploadCandidateVideo = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'A video file is required');
  }

  const profile = await CandidateProfile.findOne({ userId: req.user.id });
  if (!profile) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Candidate profile not found');
  }

  if ((profile.videos?.length || 0) >= MAX_CANDIDATE_VIDEOS) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      `You can upload up to ${MAX_CANDIDATE_VIDEOS} videos. Delete one to add a new video.`,
    );
  }

  const asset = await uploadBufferToImageKit({
    buffer: req.file.buffer,
    originalName: req.file.originalname,
    folder: '/recruitkr/videos',
  });

  const video = {
    url: asset.url,
    fileId: asset.fileId,
    name: asset.name || req.file.originalname,
    type: req.file.mimetype,
    size: req.file.size,
    uploadedAt: new Date(),
  };

  profile.videos.push(video);
  await profile.save();
  await refreshProfileCompletion(req.user.id);

  const created = profile.videos[profile.videos.length - 1];
  res.status(StatusCodes.CREATED).json({ success: true, data: serializeVideo(created) });
});

export const deleteCandidateVideo = asyncHandler(async (req, res) => {
  const profile = await CandidateProfile.findOne({ userId: req.user.id });
  if (!profile) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Candidate profile not found');
  }

  const { videoId } = req.params;
  const video = profile.videos.id(videoId);
  if (!video) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Video not found');
  }

  const fileId = String(video.fileId || '').trim();
  video.deleteOne();
  await profile.save();
  await refreshProfileCompletion(req.user.id);

  if (fileId) {
    try {
      await deleteImageKitFile(fileId);
    } catch (error) {
      console.error('[candidate-video] failed to delete file', error);
    }
  }

  res.json({ success: true, message: 'Video removed' });
});

