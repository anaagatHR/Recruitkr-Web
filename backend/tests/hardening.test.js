/**
 * Phase 8 (audit P1-4, P1-6, hardening): CSRF origin guard, If-Match parsing,
 * per-user rate limits on apply and profile writes. Run with: npm test
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

const { isTrustedCookieWrite } = await import('../src/middlewares/auth.js');
const { parseIfMatchRevision } = await import('../src/controllers/user.controller.js');
const { default: jobsRouter } = await import('../src/routes/jobs.routes.js');
const { default: userRouter } = await import('../src/routes/user.routes.js');
const { applyLimiter, profileWriteLimiter } = await import('../src/middlewares/rateLimiter.js');

const fakeReq = (method, headers = {}) => ({
  method,
  get: (name) => headers[name.toLowerCase()],
});
const origins = new Set(['https://www.recruitkr.com']);

describe('isTrustedCookieWrite (CSRF origin guard)', () => {
  it('allows safe methods from anywhere', () => {
    assert.equal(isTrustedCookieWrite(fakeReq('GET', { origin: 'https://evil.example' }), origins), true);
  });

  it('allows writes from our own origin (Origin header, or Referer fallback)', () => {
    assert.equal(isTrustedCookieWrite(fakeReq('POST', { origin: 'https://www.recruitkr.com' }), origins), true);
    assert.equal(
      isTrustedCookieWrite(fakeReq('PATCH', { referer: 'https://www.recruitkr.com/dashboard/candidate?tab=profile' }), origins),
      true,
    );
  });

  it('blocks cross-site, opaque ("null") and origin-less writes', () => {
    assert.equal(isTrustedCookieWrite(fakeReq('POST', { origin: 'https://evil.example' }), origins), false);
    assert.equal(isTrustedCookieWrite(fakeReq('DELETE', { origin: 'null' }), origins), false);
    assert.equal(isTrustedCookieWrite(fakeReq('POST', {}), origins), false);
    // A look-alike host is not our origin.
    assert.equal(isTrustedCookieWrite(fakeReq('POST', { origin: 'https://www.recruitkr.com.evil.example' }), origins), false);
  });
});

describe('parseIfMatchRevision', () => {
  it('reads strong, weak and bare revisions', () => {
    assert.equal(parseIfMatchRevision('"3"'), 3);
    assert.equal(parseIfMatchRevision('W/"12"'), 12);
    assert.equal(parseIfMatchRevision('0'), 0);
  });

  it('treats absent or malformed headers as "no precondition"', () => {
    assert.equal(parseIfMatchRevision(undefined), null);
    assert.equal(parseIfMatchRevision('*'), null);
    assert.equal(parseIfMatchRevision('"abc"'), null);
    assert.equal(parseIfMatchRevision('"-1"'), null);
  });
});

describe('per-user rate limits are mounted after auth', () => {
  const stackFor = (router, method, path) =>
    router.stack.find((layer) => layer.route?.path === path && layer.route.methods[method])?.route.stack.map((s) => s.handle);

  it('POST /jobs/apply runs applyLimiter after requireAuth', () => {
    const handlers = stackFor(jobsRouter, 'post', '/apply');
    assert.ok(handlers.includes(applyLimiter));
    assert.ok(handlers.indexOf(applyLimiter) > 0);
  });

  it('PATCH /users/candidate/me runs profileWriteLimiter after requireAuth', () => {
    const handlers = stackFor(userRouter, 'patch', '/candidate/me');
    assert.ok(handlers.includes(profileWriteLimiter));
    assert.ok(handlers.indexOf(profileWriteLimiter) > 0);
  });
});
