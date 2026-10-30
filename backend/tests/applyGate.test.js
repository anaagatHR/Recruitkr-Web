/**
 * Phase 4 (audit P0-3, P1-2): the server-side apply gate and the candidate feed.
 * Run with: npm test
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

process.env.MONGODB_URI ||= 'mongodb://localhost/test';
process.env.JWT_ACCESS_SECRET ||= 'a'.repeat(40);
process.env.JWT_REFRESH_SECRET ||= 'b'.repeat(40);
process.env.IMAGEKIT_PUBLIC_KEY ||= 'public_test_key';
process.env.IMAGEKIT_PRIVATE_KEY ||= 'private_test_key';
process.env.IMAGEKIT_URL_ENDPOINT ||= 'https://ik.imagekit.io/test';
process.env.BCRYPT_OR_ARGON2_PEPPER ||= 'pepper'.repeat(4);

const { annotateJobsForCandidate, BLOCK_REASONS } = await import('../src/controllers/job.controller.js');
const { errorHandler } = await import('../src/middlewares/errorHandler.js');
const { ApiError } = await import('../src/utils/ApiError.js');
const { filterSortPaginateJobs } = await import('../src/services/jobSearch.service.js');
const { listCandidateJobsQuerySchema } = await import('../src/schemas/job.schema.js');

const mockRes = () => {
  const res = { statusCode: 0, body: null };
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (body) => {
    res.body = body;
    return res;
  };
  return res;
};

describe('annotateJobsForCandidate', () => {
  const jobs = [
    { _id: 'open', canApply: true },
    { _id: 'closed', canApply: false },
    { _id: 'applied', canApply: true },
  ];

  it('ranks JOB_CLOSED > ALREADY_APPLIED > PROFILE_INCOMPLETE', () => {
    const rows = annotateJobsForCandidate(jobs, {
      appliedIds: new Set(['applied', 'closed']),
      completion: { canApply: false },
    });
    assert.deepEqual(
      rows.map((r) => [r._id, r.canApply, r.blockReason]),
      [
        ['open', false, BLOCK_REASONS.PROFILE_INCOMPLETE],
        ['closed', false, BLOCK_REASONS.JOB_CLOSED],
        ['applied', false, BLOCK_REASONS.ALREADY_APPLIED],
      ],
    );
  });

  it('gate disabled (completion null) → open jobs are applyable', () => {
    const [open] = annotateJobsForCandidate(jobs, { appliedIds: new Set(), completion: null });
    assert.equal(open.canApply, true);
    assert.equal(open.blockReason, null);
  });

  it('a complete profile is not blocked', () => {
    const [open] = annotateJobsForCandidate(jobs, { appliedIds: new Set(), completion: { canApply: true } });
    assert.equal(open.blockReason, null);
  });
});

describe('applied-job exclusion happens before pagination', () => {
  it('a full page of applied jobs no longer yields an empty page', () => {
    const all = Array.from({ length: 25 }, (_, i) => ({ _id: `j${i}`, jobTitle: `Job ${i}` }));
    const applied = new Set(all.slice(0, 20).map((j) => j._id));
    const { data, meta } = filterSortPaginateJobs(
      all.filter((j) => !applied.has(j._id)),
      { page: 1, limit: 20 },
    );
    assert.equal(data.length, 5);
    assert.equal(meta.total, 5);
    assert.equal(meta.totalPages, 1);
  });

  it('the query schema accepts excludeApplied and rejects unknown keys', () => {
    assert.equal(listCandidateJobsQuerySchema.safeParse({ page: '1', limit: '20', excludeApplied: 'true' }).success, true);
    assert.equal(listCandidateJobsQuerySchema.safeParse({ excludeApplied: 'yes' }).success, false);
    assert.equal(listCandidateJobsQuerySchema.safeParse({ complete: '1' }).success, false);
  });
});

describe('error responses', () => {
  it('422 PROFILE_INCOMPLETE carries code + data to the client', () => {
    const res = mockRes();
    const data = { score: 48, threshold: 70, missingRequired: [{ key: 'phone', label: 'Mobile number', weight: 7 }] };
    errorHandler(new ApiError(422, 'Complete your profile to apply', null, { code: 'PROFILE_INCOMPLETE', data }), {}, res, () => {});
    assert.equal(res.statusCode, 422);
    assert.deepEqual(res.body, { success: false, message: 'Complete your profile to apply', code: 'PROFILE_INCOMPLETE', data });
  });

  it('a 5xx never forwards code/data (no infrastructure detail leaks)', () => {
    const res = mockRes();
    const driverError = Object.assign(new Error('connection reset by mongodb-atlas-shard-00'), {
      code: 'ECONNRESET',
      data: { secret: true },
    });
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const originalError = console.error;
    console.error = () => {};
    try {
      errorHandler(driverError, {}, res, () => {});
    } finally {
      console.error = originalError;
      process.env.NODE_ENV = prev;
    }
    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.body, { success: false, message: 'Internal server error' });
  });
});

describe('FEATURE_APPLY_GATE flag', () => {
  it('is off unless explicitly enabled', async () => {
    const { env } = await import('../src/config/env.js');
    assert.equal(env.FEATURE_APPLY_GATE, ['true', '1', 'yes'].includes(String(process.env.FEATURE_APPLY_GATE).toLowerCase()));
  });
});
