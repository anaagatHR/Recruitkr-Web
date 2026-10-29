/**
 * Phase 5 (audit §4.4, P0-4/P0-5): apply idempotency and duplicate mapping.
 * Run with: npm test
 *
 * The end-to-end concurrency gate (N concurrent applies → 1×201, rest 409/replay,
 * 0×500, one row) needs a real MongoDB; run scripts/verifyApplyConcurrency.js
 * against staging for that.
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

const { IDEMPOTENCY_REPLAY_WINDOW_MS, isDuplicateKeyError, resolveDuplicateApply } = await import(
  '../src/controllers/job.controller.js'
);
const { errorHandler } = await import('../src/middlewares/errorHandler.js');
const { Application } = await import('../src/models/Application.js');

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

describe('resolveDuplicateApply', () => {
  const now = Date.parse('2026-10-30T12:00:00Z');
  const existing = { idempotencyKey: 'apply:abc', createdAt: new Date(now - 60_000) };

  it('same key inside the window → replay the original 201', () => {
    assert.equal(resolveDuplicateApply({ existing, idempotencyKey: 'apply:abc', now }), 'replay');
  });

  it('no key → conflict (a plain second apply is a 409)', () => {
    assert.equal(resolveDuplicateApply({ existing, idempotencyKey: null, now }), 'conflict');
  });

  it('different key → conflict', () => {
    assert.equal(resolveDuplicateApply({ existing, idempotencyKey: 'apply:other', now }), 'conflict');
  });

  it('existing application created without a key → conflict', () => {
    assert.equal(resolveDuplicateApply({ existing: { createdAt: existing.createdAt }, idempotencyKey: 'apply:abc', now }), 'conflict');
  });

  it('after the 24h replay window the key is treated as a new request → conflict', () => {
    const old = { idempotencyKey: 'apply:abc', createdAt: new Date(now - IDEMPOTENCY_REPLAY_WINDOW_MS - 1) };
    assert.equal(resolveDuplicateApply({ existing: old, idempotencyKey: 'apply:abc', now }), 'conflict');
    assert.equal(IDEMPOTENCY_REPLAY_WINDOW_MS, 24 * 60 * 60 * 1000);
  });
});

describe('duplicate-key errors', () => {
  it('recognises driver and wrapped E11000 errors', () => {
    assert.equal(isDuplicateKeyError({ code: 11000 }), true);
    assert.equal(isDuplicateKeyError({ cause: { code: 11000 } }), true);
    assert.equal(isDuplicateKeyError({ code: 'ECONNRESET' }), false);
    assert.equal(isDuplicateKeyError(null), false);
  });

  it('an unmapped E11000 becomes a 409 with no collection/index text', () => {
    const res = mockRes();
    const driverError = Object.assign(
      new Error('E11000 duplicate key error collection: recruitkr.applications index: candidateId_1_jobId_1'),
      { code: 11000, keyPattern: { candidateId: 1, jobId: 1 } },
    );
    const originalWarn = console.warn;
    console.warn = () => {};
    try {
      errorHandler(driverError, {}, res, () => {});
    } finally {
      console.warn = originalWarn;
    }
    assert.equal(res.statusCode, 409);
    assert.equal(res.body.code, 'DUPLICATE');
    assert.doesNotMatch(JSON.stringify(res.body), /E11000|applications|candidateId|index/i);
  });
});

describe('applyJobSchema (review sheet fields)', async () => {
  const { applyJobSchema } = await import('../src/schemas/application.schema.js');
  const jobId = 'a'.repeat(24);

  it('accepts a bare jobId (older clients) and the optional note + consent', () => {
    assert.equal(applyJobSchema.safeParse({ jobId }).success, true);
    assert.equal(applyJobSchema.safeParse({ jobId, note: 'Available immediately', declarationAccepted: true }).success, true);
  });

  it('rejects a note over 300 chars, consent other than true, and unknown keys', () => {
    assert.equal(applyJobSchema.safeParse({ jobId, note: 'x'.repeat(301) }).success, false);
    assert.equal(applyJobSchema.safeParse({ jobId, declarationAccepted: false }).success, false);
    assert.equal(applyJobSchema.safeParse({ jobId, score: 99 }).success, false);
  });
});

describe('Application indexes', () => {
  const indexes = Application.schema.indexes();
  const find = (keys) => indexes.find(([fields]) => JSON.stringify(fields) === JSON.stringify(keys));

  it('one application per candidate per job (both job sources) is enforced by unique indexes', () => {
    assert.equal(find({ candidateId: 1, jobId: 1 })?.[1].unique, true);
    assert.equal(find({ candidateId: 1, sourceCollection: 1, sourceJobId: 1 })?.[1].unique, true);
  });

  it('idempotency keys are unique per candidate, and absent keys are not indexed', () => {
    const [, options] = find({ candidateId: 1, idempotencyKey: 1 });
    assert.equal(options.unique, true);
    assert.deepEqual(options.partialFilterExpression, { idempotencyKey: { $type: 'string' } });
  });
});
