import Team from '../models/OurTeam.js';

const TEAM_CACHE_TTL_MS = 5 * 60 * 1000;

let cachedTeam = null;
let cacheExpiresAt = 0;

// CRM-panel uploads are stored as relative paths ("/uploads/..."). Those only
// resolve on the CRM host, so prefix them with TEAM_ASSET_BASE_URL when set
// (e.g. https://crm.recruitkr.com). Absolute URLs pass through untouched.
const TEAM_ASSET_BASE = String(process.env.TEAM_ASSET_BASE_URL || '').replace(/\/$/, '');
const toAbsoluteAssetUrl = (value = '') => {
  const path = String(value || '').trim();
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return TEAM_ASSET_BASE ? `${TEAM_ASSET_BASE}${path.startsWith('/') ? '' : '/'}${path}` : path;
};

const serializeTeamMember = (member = {}) => ({
  _id: member._id,
  name: member.fullName || member.name || '',
  role: member.role || member.position || '',
  summary: member.shortDescription || '',
  image: toAbsoluteAssetUrl(member.profileImage),
  video: toAbsoluteAssetUrl(member.profileVideo || member.videoUrl || member.introVideo),
  linkedin: member.linkedInUrl || member.linkedin || '',
  email: member.email || '',
});

/**
 * Collapse duplicate records for the same person (e.g. a photo upload and a
 * video upload saved as two rows) into ONE card, merging whichever media each
 * record carries. Keyed by email first, then normalized name.
 */
const dedupeTeamMembers = (members = []) => {
  const byKey = new Map();
  for (const member of members) {
    const key =
      String(member.email || '').trim().toLowerCase() ||
      String(member.name || '').trim().toLowerCase() ||
      String(member._id);
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, member);
      continue;
    }
    byKey.set(key, {
      ...existing,
      image: existing.image || member.image,
      video: existing.video || member.video,
      linkedin: existing.linkedin || member.linkedin,
      summary: existing.summary || member.summary,
      role: existing.role || member.role,
      email: existing.email || member.email,
    });
  }
  return Array.from(byKey.values());
};

export const getTeam = async (req, res) => {
  try {
    if (cachedTeam && Date.now() < cacheExpiresAt) {
      res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300');
      return res.status(200).json(cachedTeam);
    }

    const team = await Team.find({
      $and: [{ active: { $ne: false } }, { isActive: { $ne: false } }],
    })
      .select(
        'fullName name role position shortDescription profileImage profileVideo videoUrl introVideo linkedInUrl linkedin email displayOrder',
      )
      .sort({ displayOrder: 1, fullName: 1, name: 1 })
      .limit(200)
      .lean();

    const serializedTeam = dedupeTeamMembers(team.map(serializeTeamMember));
    cachedTeam = serializedTeam;
    cacheExpiresAt = Date.now() + TEAM_CACHE_TTL_MS;

    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300');
    res.status(200).json(serializedTeam);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
