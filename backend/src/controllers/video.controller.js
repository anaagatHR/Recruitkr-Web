import mongoose from 'mongoose';

import { CandidateProfile } from '../models/CandidateProfile.js';
import { ShortVideo } from '../models/ShortVideo.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * GET /api/v1/videos/stories  (public)
 *
 * Home "Success Stories" cards (image/video + text + link) managed from the
 * RecruitKr CRM Web Panel and stored in the shared `home_stories` collection.
 */
export const getHomeStories = asyncHandler(async (req, res) => {
  const col = mongoose.connection.db.collection('home_stories');
  const docs = await col
    .find({ active: { $ne: false } })
    .sort({ createdAt: -1 })
    .limit(24)
    .toArray();
  const data = docs.map((d) => ({
    id: String(d._id),
    text: d.text || '',
    link: d.link || '',
    name: d.name || '',
    role: d.role || '',
    image: d.image || '',
    video: d.video || '',
  }));
  res.json({ success: true, data });
});

/**
 * GET /api/v1/videos/shorts?audience=candidate|employer|both  (public)
 * Returns the active Shorts for the carousel, newest/ordered first.
 * Audience is matched EXACTLY so each home section (success="both", candidate,
 * employer) shows a distinct set of videos with no overlap. No audience = all.
 */
export const getShorts = asyncHandler(async (req, res) => {
  const audience = ['candidate', 'employer', 'both'].includes(req.query.audience) ? req.query.audience : null;
  const filter = { isActive: true };
  if (audience) filter.audience = audience;

  const shorts = await ShortVideo.find(filter)
    .select('videoId title source url posterUrl')
    .sort({ order: 1, createdAt: -1 })
    .limit(100)
    .lean()
    .exec();

  res.json({
    success: true,
    data: shorts.map((s) => ({
      id: s.videoId || String(s._id),
      title: s.title || '',
      source: s.source || 'youtube',
      url: s.url || '',
      posterUrl: s.posterUrl || '',
    })),
  });
});

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
