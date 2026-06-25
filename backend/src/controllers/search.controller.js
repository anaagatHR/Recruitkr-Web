import { StatusCodes } from 'http-status-codes';

import { CandidateProfile } from '../models/CandidateProfile.js';
import {
  buildCandidateSolrDoc,
  isSolrConfigured,
  pingSolr,
  searchCandidatesViaSolr,
  suggest,
} from '../services/solr.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const toInt = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
};

const escapeRegex = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** PII-safe candidate payload, reusing the exact shape we index into Solr. */
const toCandidatePayload = (profile) => {
  const plain = typeof profile.toObject === 'function' ? profile.toObject() : profile;
  try {
    return JSON.parse(buildCandidateSolrDoc(plain).payload_s);
  } catch {
    return null;
  }
};

/**
 * MongoDB fallback for candidate search — used when Solr is unconfigured or
 * temporarily down, so the recruiter experience degrades gracefully instead of
 * erroring. Mirrors the Solr filters (text, skills, experience, location).
 */
const searchCandidatesViaMongo = async ({ q, skills, experience, location, page, limit }) => {
  const filter = {};
  const and = [];

  if (q && String(q).trim()) {
    const rx = new RegExp(escapeRegex(String(q).trim()), 'i');
    and.push({ $or: [{ fullName: rx }, { skills: rx }, { highestQualification: rx }] });
  }
  const skillList = Array.isArray(skills)
    ? skills
    : String(skills || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
  if (skillList.length) and.push({ skills: { $in: skillList.map((s) => new RegExp(`^${escapeRegex(s)}$`, 'i')) } });
  if (experience && String(experience).trim()) filter.experienceStatus = String(experience).trim();
  if (location && String(location).trim()) {
    const lrx = new RegExp(escapeRegex(String(location).trim()), 'i');
    and.push({
      $or: [{ 'preferences.preferredLocation': lrx }, { preferredLocation: lrx }, { currentCity: lrx }],
    });
  }
  if (and.length) filter.$and = and;

  const skip = (page - 1) * limit;
  const [profiles, total] = await Promise.all([
    CandidateProfile.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean().exec(),
    CandidateProfile.countDocuments(filter).exec(),
  ]);

  return { candidates: profiles.map(toCandidatePayload).filter(Boolean), total, facets: { skills: [], experience: [] } };
};

/**
 * GET /api/v1/search/candidates  (client/admin only)
 * Full-text + skill/experience/location filters, Solr-first with Mongo fallback.
 */
export const searchCandidates = asyncHandler(async (req, res) => {
  const { q, skills, experience, location } = req.query;
  const page = toInt(req.query.page, 1);
  const limit = Math.min(toInt(req.query.limit, 12), 50);

  let result = null;
  let usedSolr = false;
  if (isSolrConfigured() && (await pingSolr())) {
    try {
      result = await searchCandidatesViaSolr({ q, skills, experience, location, page, limit });
      usedSolr = true;
    } catch (error) {
      console.warn('[search] candidate Solr search failed, falling back to Mongo:', error.message);
    }
  }
  if (!result) {
    result = await searchCandidatesViaMongo({ q, skills, experience, location, page, limit });
  }

  res.json({
    success: true,
    data: result.candidates,
    facets: result.facets,
    meta: {
      page,
      limit,
      total: result.total,
      totalPages: Math.ceil(result.total / limit) || 1,
      engine: usedSolr ? 'solr' : 'mongo',
    },
  });
});

/** GET /api/v1/search/suggestions  (public) — job autocomplete while typing. */
export const searchSuggestions = asyncHandler(async (req, res) => {
  const prefix = String(req.query.q || '').trim();
  const limit = Math.min(toInt(req.query.limit, 8), 15);
  if (prefix.length < 2) {
    return res.json({ success: true, data: [] });
  }
  let suggestions = [];
  try {
    suggestions = await suggest({ core: 'jobs', prefix, limit });
  } catch (error) {
    console.warn('[search] job suggestions failed:', error.message);
  }
  res.json({ success: true, data: suggestions });
});

/** GET /api/v1/search/candidates/suggestions  (client/admin only). */
export const candidateSuggestions = asyncHandler(async (req, res) => {
  const prefix = String(req.query.q || '').trim();
  const limit = Math.min(toInt(req.query.limit, 8), 15);
  if (prefix.length < 2) {
    return res.json({ success: true, data: [] });
  }
  let suggestions = [];
  try {
    suggestions = await suggest({ core: 'candidates', prefix, limit });
  } catch (error) {
    console.warn('[search] candidate suggestions failed:', error.message);
  }
  res.status(StatusCodes.OK).json({ success: true, data: suggestions });
});
