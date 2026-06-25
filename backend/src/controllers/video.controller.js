import { CandidateProfile } from '../models/CandidateProfile.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * GET /api/v1/videos/showcase  (public)
 *
 * Aggregates real candidate intro videos from across the platform for the home
 * page showcase, so the site shows genuine people — not stock/AI clips. Returns
 * the candidate's display name, role and photo alongside each video. Structured
 * with `kind` so employer/company videos can be folded in later.
 */
export const getShowcaseVideos = asyncHandler(async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 12, 1), 48);

  const profiles = await CandidateProfile.find({ 'videos.0': { $exists: true } })
    .select('fullName profilePhotoUrl preferences.preferredRole preferredRole experienceStatus videos updatedAt')
    .sort({ updatedAt: -1 })
    .limit(limit * 3) // a profile may hold several videos; flatten then cap
    .lean()
    .exec();

  const items = [];
  for (const profile of profiles) {
    const role =
      profile.preferences?.preferredRole ||
      profile.preferredRole ||
      (profile.experienceStatus === 'fresher' ? 'Fresher' : 'Candidate');

    for (const video of profile.videos || []) {
      if (!video?.url) continue;
      items.push({
        id: String(video._id || video.fileId || video.url),
        url: video.url,
        name: video.name || 'Intro video',
        candidateName: profile.fullName || 'Candidate',
        role,
        photoUrl: profile.profilePhotoUrl || '',
        kind: 'candidate',
      });
      if (items.length >= limit) break;
    }
    if (items.length >= limit) break;
  }

  res.json({ success: true, data: items });
});
