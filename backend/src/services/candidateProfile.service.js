/**
 * Canonical candidate-profile fields (audit P1-3).
 *
 *   name      -> fullName                 phone   -> User.mobile
 *   summary   -> summary                  city    -> city (real current city)
 *   role/location/industry/workModes -> preferences.*
 *   skills    -> skills (resume PDFs are projected from the profile at render time)
 *
 * The legacy top-level copies (name, about, currentCity, mobile, phone,
 * preferredRole, preferredLocation, preferredIndustry, workModes, resumePath)
 * are still WRITTEN on every save because the external Business OS CRM shares
 * this database and may read them. Nothing in this repo reads them, and they
 * are stripped from API responses.
 */
import { isIndianMobile, normalizeIndianMobile } from '../utils/mobile.js';

export const LEGACY_MIRROR_FIELDS = [
  'name',
  'about',
  'currentCity',
  'mobile',
  'preferredRole',
  'preferredLocation',
  'preferredIndustry',
  'workModes',
  'resumePath',
];

export const syncCandidateLegacyFields = ({ profile, user, resumeLocation = '' }) => {
  profile.about = profile.summary || '';
  profile.currentCity = profile.city || '';
  profile.email = user?.email || profile.email || '';
  profile.isActive = true;
  profile.mobile = user?.mobile || profile.mobile || '';
  profile.name = profile.fullName || '';
  profile.phone = user?.mobile || profile.phone || '';
  profile.preferredIndustry = profile.preferences?.preferredIndustry || '';
  profile.preferredLocation = profile.preferences?.preferredLocation || '';
  profile.preferredRole = profile.preferences?.preferredRole || '';
  profile.resumePath = resumeLocation || profile.resumePath || '';
  profile.workModes = profile.preferences?.workModes || [];
};

// API shape: canonical fields only; `phone` always comes from User.mobile.
export const toCandidateProfileResponse = (profile, user) => {
  if (!profile) return profile;
  const data = typeof profile.toObject === 'function' ? profile.toObject() : { ...profile };
  for (const key of LEGACY_MIRROR_FIELDS) delete data[key];
  data.phone = user?.mobile || data.phone || '';
  return data;
};

// Placeholder strings older code wrote instead of leaving a field empty.
const SENTINELS = new Set(['not specified', 'not provided', 'candidate', 'n/a', 'na', '-', '000000']);
const LEGACY_DEFAULT_DOB = Date.parse('2000-01-01T00:00:00.000Z');

export const meaningful = (value) => {
  const text = typeof value === 'string' ? value.trim() : '';
  return text && !SENTINELS.has(text.toLowerCase()) ? text : '';
};

/**
 * Pure migration plan for one profile: coalesces each duplicated pair into its
 * canonical field (canonical wins; legacy only fills a gap), clears placeholder
 * values, and reports every pair whose two copies disagreed.
 * Returns { set, unset, userMobile, conflicts } — empty set/unset means no-op.
 */
export const planCandidateProfileMigration = (profile = {}, user = {}) => {
  const set = {};
  const unset = [];
  const conflicts = [];

  const coalesce = (path, canonical, legacy, legacyPath) => {
    const kept = meaningful(canonical);
    const fallback = meaningful(legacy);
    if (kept && fallback && kept.toLowerCase() !== fallback.toLowerCase()) {
      conflicts.push({ field: path, kept, dropped: fallback, droppedFrom: legacyPath });
    }
    const next = kept || fallback;
    if (next !== (canonical ?? '')) set[path] = next;
  };

  // An auto-generated name (email local part) is not a name.
  const emailLocal = String(user.email || profile.email || '').split('@')[0].toLowerCase();
  const isGeneratedName = (value) => Boolean(emailLocal) && String(value || '').trim().toLowerCase() === emailLocal;
  coalesce(
    'fullName',
    isGeneratedName(profile.fullName) ? '' : profile.fullName,
    isGeneratedName(profile.name) ? '' : profile.name,
    'name',
  );
  if (isGeneratedName(profile.fullName) && !set.fullName) set.fullName = '';
  coalesce('summary', profile.summary, profile.about, 'about');

  const prefs = profile.preferences || {};
  coalesce('preferences.preferredRole', prefs.preferredRole, profile.preferredRole, 'preferredRole');
  coalesce('preferences.preferredLocation', prefs.preferredLocation, profile.preferredLocation, 'preferredLocation');
  coalesce('preferences.preferredIndustry', prefs.preferredIndustry, profile.preferredIndustry, 'preferredIndustry');
  if (!prefs.workModes?.length && profile.workModes?.length) {
    set['preferences.workModes'] = profile.workModes;
  }

  // Before the editor had a City input, city was a copy of preferredLocation.
  const city = meaningful(profile.city);
  if (city && city === meaningful(prefs.preferredLocation || profile.preferredLocation)) {
    set.city = '';
    conflicts.push({ field: 'city', kept: '', dropped: city, droppedFrom: 'city (copy of preferredLocation)' });
  } else if (city !== (profile.city ?? '')) {
    set.city = city;
  }

  for (const field of ['highestQualification', 'address', 'pincode']) {
    const value = meaningful(profile[field]);
    if (value !== (profile[field] ?? '')) set[field] = value;
  }
  if (profile.dateOfBirth && new Date(profile.dateOfBirth).getTime() === LEGACY_DEFAULT_DOB) {
    unset.push('dateOfBirth');
  }

  let userMobile = null;
  if (!isIndianMobile(user.mobile)) {
    const candidate = [profile.phone, profile.mobile].find((value) => isIndianMobile(value));
    if (candidate) userMobile = normalizeIndianMobile(candidate);
  }

  return { set, unset, userMobile, conflicts };
};
