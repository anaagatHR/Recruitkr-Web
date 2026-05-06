import Team from '../models/OurTeam.js';

const TEAM_CACHE_TTL_MS = 5 * 60 * 1000;

let cachedTeam = null;
let cacheExpiresAt = 0;

const serializeTeamMember = (member = {}) => ({
  _id: member._id,
  name: member.fullName || member.name || '',
  role: member.role || member.position || '',
  summary: member.shortDescription || '',
  image: member.profileImage || '',
  linkedin: member.linkedInUrl || member.linkedin || '',
  email: member.email || '',
});

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
        'fullName name role position shortDescription profileImage linkedInUrl linkedin email displayOrder',
      )
      .sort({ displayOrder: 1, fullName: 1, name: 1 })
      .lean();

    const serializedTeam = team.map(serializeTeamMember);
    cachedTeam = serializedTeam;
    cacheExpiresAt = Date.now() + TEAM_CACHE_TTL_MS;

    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300');
    res.status(200).json(serializedTeam);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
