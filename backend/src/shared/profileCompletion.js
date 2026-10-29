/**
 * Candidate profile completion — the single scoring rule (audit §4.1, P0-2).
 *
 * Pure and dependency-free (except the mobile helper) so the API and, later,
 * the UI can run the exact same function. The server's result is the only one
 * that gates applying; a client copy is for live display only.
 *
 * Weights sum to 100. Required fields sum to 63, so a candidate who fills only
 * the mandatory set lands below the 70 threshold and must add something about
 * themselves (photo, summary, industry, certification, project, video).
 */
import { isIndianMobile } from '../utils/mobile.js';

export const PROFILE_COMPLETION_VERSION = 2;
export const APPLY_GATE_MIN_SCORE = 70;

// Placeholder strings older code wrote instead of leaving a field empty.
const SENTINELS = new Set(['not specified', 'not provided', 'candidate', 'n/a', 'na', '-', '000000']);

export const meaningful = (value) => {
  const text = typeof value === 'string' ? value.trim() : '';
  return text && !SENTINELS.has(text.toLowerCase()) ? text : '';
};

const filled = (value, min = 1) => meaningful(value).length >= min;

// Trim, compare case/punctuation-insensitively (keeping + and # so C++ != C),
// drop duplicates and one-character entries.
export const dedupeSkills = (skills) => {
  const seen = new Set();
  const out = [];
  for (const raw of Array.isArray(skills) ? skills : []) {
    const skill = meaningful(raw);
    if (skill.length < 2) continue;
    const key = skill.toLowerCase().replace(/[^\p{L}\p{N}+#]/gu, '');
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(skill);
  }
  return out;
};

const uniqueWordCount = (text) =>
  new Set(
    meaningful(text)
      .toLowerCase()
      .split(/\s+/)
      .map((word) => word.replace(/[^\p{L}\p{N}+#]/gu, ''))
      .filter(Boolean),
  ).size;

// Fewer than 15 distinct words (e.g. the preferred role repeated) earns nothing.
const summaryPoints = (summary) => {
  const length = meaningful(summary).length;
  if (length < 120 || uniqueWordCount(summary) < 15) return 0;
  return length >= 240 ? 8 : 4;
};

const skillsPoints = (count) => (count >= 5 ? 8 : count >= 3 ? 5 : 0);

const isRealName = (value) => {
  const name = meaningful(value);
  return name.length >= 3 && !name.includes('@') && name.split(/\s+/).length >= 2;
};

const hasWorkHistory = (experience) =>
  (Array.isArray(experience) ? experience : []).some(
    (entry) => filled(entry?.company, 2) && filled(entry?.role, 2) && /^\d{4}-\d{2}$/.test(meaningful(entry?.startDate)),
  );

/**
 * @param {object} input
 * @param {object} input.profile  CandidateProfile (plain object, canonical fields)
 * @param {object} [input.user]   User: { email, mobile }
 * @param {object} [input.resume] Resume: { resumeType, resumeFileId } — none means "generated"
 * @param {number} [input.certificateFileCount] uploaded certificate files
 */
export const computeProfileCompletion = ({ profile = {}, user = {}, resume = null, certificateFileCount = 0 } = {}) => {
  const prefs = profile.preferences || {};
  const skillCount = dedupeSkills(profile.skills).length;
  const projects = Array.isArray(profile.projects) ? profile.projects : [];
  const hasProject = projects.some((project) => filled(project?.name, 3) && filled(project?.description, 40));

  // A generated resume only counts when it would contain something real.
  const generatedResumeIsSubstantive =
    filled(profile.highestQualification, 2) &&
    skillCount >= 3 &&
    filled(prefs.preferredRole, 2) &&
    (meaningful(profile.summary).length >= 120 ||
      hasWorkHistory(profile.experience) ||
      projects.some((project) => filled(project?.name, 3)));

  const field = (key, label, weight, required, group, points) => ({
    key,
    label,
    weight,
    required,
    group,
    points,
    satisfied: points > 0,
  });
  const all = (condition, weight) => (condition ? weight : 0);

  const fields = [
    // identity (22)
    field('fullName', 'Full name', 7, true, 'identity', all(isRealName(profile.fullName), 7)),
    field('phone', 'Mobile number', 7, true, 'identity', all(isIndianMobile(user.mobile), 7)),
    // shortcut: no email-verification flow exists yet, so any account email
    // counts (Google sign-ins are verified by Google). Switch to
    // user.emailVerified === true once verification ships.
    field('email', 'Email address', 3, true, 'identity', all(filled(user.email || profile.email), 3)),
    field('photo', 'Profile photo', 5, false, 'identity', all(filled(profile.profilePhotoUrl), 5)),

    // professional (23)
    field('qualification', 'Highest qualification', 6, true, 'professional', all(filled(profile.highestQualification, 2), 6)),
    field(
      'experienceStatus',
      'Fresher or experienced',
      3,
      true,
      'professional',
      all(profile.experienceStatus === 'fresher' || profile.experienceStatus === 'experienced', 3),
    ),
    field(
      'experienceDetail',
      'Work history',
      6,
      true,
      'professional',
      all(
        profile.experienceStatus === 'fresher' ||
          (profile.experienceStatus === 'experienced' && hasWorkHistory(profile.experience)),
        6,
      ),
    ),
    field('summary', 'Professional summary', 8, false, 'professional', summaryPoints(profile.summary)),

    // preferences (24)
    field('skills', 'At least 3 skills', 8, true, 'preferences', skillsPoints(skillCount)),
    field('preferredRole', 'Preferred role', 5, true, 'preferences', all(filled(prefs.preferredRole, 2), 5)),
    field('preferredLocation', 'Preferred location', 4, true, 'preferences', all(filled(prefs.preferredLocation, 2), 4)),
    field('preferredIndustry', 'Preferred industry', 4, false, 'preferences', all(filled(prefs.preferredIndustry, 2), 4)),
    field('workModes', 'Work mode', 3, true, 'preferences', all(Array.isArray(prefs.workModes) && prefs.workModes.length > 0, 3)),

    // proof (31)
    field(
      'resume',
      'Resume',
      11,
      true,
      'proof',
      all(resume?.resumeType === 'uploaded' ? filled(resume.resumeFileId) : generatedResumeIsSubstantive, 11),
    ),
    field(
      'certifications',
      'Certification or certificate',
      7,
      false,
      'proof',
      all(
        (Array.isArray(profile.certifications) && profile.certifications.some((c) => filled(c?.name, 2))) ||
          certificateFileCount > 0,
        7,
      ),
    ),
    field('projects', 'Project', 8, false, 'proof', all(hasProject, 8)),
    field('introVideo', 'Intro video', 5, false, 'proof', all(Array.isArray(profile.videos) && profile.videos.length > 0, 5)),
  ];

  const score = fields.reduce((sum, item) => sum + item.points, 0);
  const missing = fields.filter((item) => !item.satisfied);
  const missingRequired = missing.filter((item) => item.required).map(({ key, label, weight }) => ({ key, label, weight }));
  const missingOptional = missing.filter((item) => !item.required).map(({ key, label, weight }) => ({ key, label, weight }));

  return {
    version: PROFILE_COMPLETION_VERSION,
    score,
    threshold: APPLY_GATE_MIN_SCORE,
    canApply: missingRequired.length === 0 && score >= APPLY_GATE_MIN_SCORE,
    fields,
    missingRequired,
    missingOptional,
  };
};
