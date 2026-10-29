/**
 * Unit tests for the public job normaliser and the stats aggregation.
 * Run with: npm test   (node --test, no extra dependencies)
 *
 * These cover the audit fixes: tolerant company/description/salary pickers
 * for legacy CRM documents, the "Company" placeholder, deadline handling,
 * the isComplete flag, and the public-cache header.
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

const { normalizePublicJob, PUBLIC_CACHE_HEADER } = await import('../src/controllers/job.controller.js');
const { sanitizeRedirectPath } = await import('../src/utils/security.js');

const OWNER = '64b7f0c2e4b0a1a2b3c4d5e6';
const LONG_DESC = 'About the role: build and ship features for our hiring platform, working with recruiters daily.';

describe('normalizePublicJob — company name', () => {
  it('reads the canonical `company` field', () => {
    const job = normalizePublicJob({ _id: 'x', jobTitle: 'Dev', company: 'Acme Ltd', jobDescription: LONG_DESC, clientId: OWNER });
    assert.equal(job.companyName, 'Acme Ltd');
    assert.equal(job.isComplete, true);
  });

  it('falls back to legacy CRM spellings (companyName, company_name, clientName, nested)', () => {
    for (const doc of [
      { companyName: 'Beta Co' },
      { company_name: 'Beta Co' },
      { clientName: 'Beta Co' },
      { employer_name: 'Beta Co' },
      { client: { companyName: 'Beta Co' } },
    ]) {
      const job = normalizePublicJob({ _id: 'x', title: 'Dev', ...doc }, { sourceCollection: 'jobs' });
      assert.equal(job.companyName, 'Beta Co', JSON.stringify(doc));
    }
  });

  it('treats the literal placeholder "Company" as missing', () => {
    const job = normalizePublicJob({ _id: 'x', title: 'Dev', company: 'Company' }, { sourceCollection: 'jobs' });
    assert.equal(job.companyName, '');
    assert.equal(job.isComplete, false);
  });
});

describe('normalizePublicJob — completeness', () => {
  it('is incomplete without a description of at least 40 chars', () => {
    const job = normalizePublicJob({ _id: 'x', jobTitle: 'Dev', company: 'Acme', jobDescription: 'Short.' , clientId: OWNER });
    assert.equal(job.isComplete, false);
  });

  it('builds a description from responsibilities when the text field is empty', () => {
    const job = normalizePublicJob(
      { _id: 'x', title: 'Dev', company: 'Acme', responsibilities: ['Write code every day', 'Review pull requests weekly'] },
      { sourceCollection: 'jobs' },
    );
    assert.match(job.description, /• Write code every day/);
    assert.equal(job.isComplete, true);
  });

  it('reads salary and experience from alternate keys', () => {
    const job = normalizePublicJob(
      { _id: 'x', title: 'Dev', salary_min: '3', salary_max: '5.5', experience_required: '2-4 years' },
      { sourceCollection: 'jobs' },
    );
    assert.equal(job.minCtcLpa, 3);
    assert.equal(job.maxCtcLpa, 5.5);
    assert.equal(job.experienceRequired, '2-4 years');
  });
});

describe('normalizePublicJob — deadlines', () => {
  it('disables Apply and flags isExpired once the deadline has passed', () => {
    const job = normalizePublicJob({
      _id: 'x', jobTitle: 'Dev', company: 'Acme', jobDescription: LONG_DESC, clientId: OWNER,
      status: 'active', applicationDeadline: new Date(Date.now() - 86_400_000),
    });
    assert.equal(job.isExpired, true);
    assert.equal(job.canApply, false);
    assert.match(job.applyDisabledReason, /deadline/i);
  });

  it('keeps Apply live for a future deadline', () => {
    const job = normalizePublicJob({
      _id: 'x', jobTitle: 'Dev', company: 'Acme', jobDescription: LONG_DESC, clientId: OWNER,
      status: 'active', applicationDeadline: new Date(Date.now() + 5 * 86_400_000),
    });
    assert.equal(job.isExpired, false);
    assert.equal(job.canApply, true);
  });
});

describe('public cache header', () => {
  it('is a CDN-cacheable, stale-while-revalidate policy', () => {
    assert.match(PUBLIC_CACHE_HEADER, /public/);
    assert.match(PUBLIC_CACHE_HEADER, /s-maxage=300/);
    assert.match(PUBLIC_CACHE_HEADER, /stale-while-revalidate=600/);
  });
});

describe('sanitizeRedirectPath (open-redirect guard)', () => {
  it('accepts same-origin paths', () => {
    assert.equal(sanitizeRedirectPath('/jobs/123?x=1#apply'), '/jobs/123?x=1#apply');
    assert.equal(sanitizeRedirectPath(' /dashboard '), '/dashboard');
  });
  it('rejects anything that could leave the site', () => {
    for (const bad of ['//evil.com', 'https://evil.com', '/\\evil.com', 'javascript:alert(1)', '/jobs/..//evil.com', '', null, undefined, 42]) {
      assert.equal(sanitizeRedirectPath(bad), '', String(bad));
    }
  });
});
