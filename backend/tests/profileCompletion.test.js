/**
 * Phase 3 (audit §4.1 / P0-2): the profile completion engine.
 * Cases follow the audit's test matrix. Run with: npm test
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  APPLY_GATE_MIN_SCORE,
  computeProfileCompletion,
  dedupeSkills,
} from '../src/shared/profileCompletion.js';

const user = { email: 'priya@example.com', mobile: '9876543210' };
const SUMMARY_240 =
  'Retail sales professional with hands-on experience running store floors, training new staff, managing ' +
  'daily cash reconciliation and stock audits, and building repeat customers through attentive service, ' +
  'clear product knowledge and quick follow-up on every enquiry.';
const SUMMARY_150 =
  'Retail sales professional who trains new staff, reconciles daily cash, runs stock audits and builds ' +
  'repeat customers through attentive service.';

// Every required field satisfied and nothing optional: 63 points.
const requiredOnly = () => ({
  profile: {
    fullName: 'Priya Sharma',
    highestQualification: 'MBA',
    experienceStatus: 'fresher',
    skills: ['Sales', 'Excel', 'Billing', 'Inventory', 'Hindi'],
    preferences: { preferredRole: 'Sales Executive', preferredLocation: 'Jaipur', workModes: ['On-site'] },
  },
  user,
  resume: { resumeType: 'uploaded', resumeFileId: 'file_123' },
});

const score = (input) => computeProfileCompletion(input);

describe('computeProfileCompletion — weights', () => {
  it('weights sum to 100 and required weights to 63', () => {
    const { fields } = score({});
    assert.equal(fields.reduce((s, f) => s + f.weight, 0), 100);
    assert.equal(fields.filter((f) => f.required).reduce((s, f) => s + f.weight, 0), 63);
    assert.equal(APPLY_GATE_MIN_SCORE, 70);
  });
});

describe('computeProfileCompletion — audit test matrix', () => {
  it('empty profile, no account email → 0 and all 11 required missing', () => {
    const result = score({});
    assert.equal(result.score, 0);
    assert.equal(result.canApply, false);
    assert.equal(result.missingRequired.length, 11);
  });

  it('empty profile with an account email → 3 (email counts until verification ships)', () => {
    const result = score({ profile: {}, user: { email: 'x@example.com' } });
    assert.equal(result.score, 3);
    assert.equal(result.missingRequired.length, 10);
  });

  it('the audited live profile (every field "" / []) is no longer 72', () => {
    const result = score({
      profile: {
        preferences: { workModes: [] },
        summary: '',
        skills: [],
        profilePhotoUrl: '',
        city: '',
        projects: [],
        certifications: [],
        videos: [],
        declarationAccepted: false,
      },
      user: { email: 'pekkarockz1@gmail.com' },
    });
    assert.equal(result.score, 3);
    assert.equal(result.canApply, false);
  });

  it('required-only → 63, cannot apply (below 70)', () => {
    const result = score(requiredOnly());
    assert.equal(result.score, 63);
    assert.equal(result.missingRequired.length, 0);
    assert.equal(result.canApply, false);
  });

  it('required + photo only → 68, cannot apply', () => {
    const input = requiredOnly();
    input.profile.profilePhotoUrl = 'https://ik.imagekit.io/x/p.jpg';
    assert.equal(score(input).score, 68);
    assert.equal(score(input).canApply, false);
  });

  it('boundary 69 → cannot apply', () => {
    const input = requiredOnly();
    input.profile.skills = ['Sales', 'Excel', 'Billing']; // 3 skills → 5 of 8
    input.profile.profilePhotoUrl = 'https://ik.imagekit.io/x/p.jpg';
    input.profile.preferences.preferredIndustry = 'Retail';
    const result = score(input);
    assert.equal(result.score, 69);
    assert.equal(result.canApply, false);
  });

  it('boundary 70 → can apply', () => {
    const input = requiredOnly();
    input.profile.certifications = [{ name: 'Retail Management', institute: 'NSDC' }];
    const result = score(input);
    assert.equal(result.score, 70);
    assert.equal(result.canApply, true);
  });

  it('required + 240-char summary → 71, can apply', () => {
    const input = requiredOnly();
    input.profile.summary = SUMMARY_240;
    assert.ok(SUMMARY_240.length >= 240);
    const result = score(input);
    assert.equal(result.score, 71);
    assert.equal(result.canApply, true);
  });

  it('score ≥ 70 with a required field missing → cannot apply', () => {
    const input = requiredOnly();
    input.profile.summary = SUMMARY_240;
    input.profile.projects = [{ name: 'Store revamp', description: 'Redesigned the floor plan and lifted weekend sales by 20%.' }];
    input.user = { email: user.email }; // no mobile
    const result = score(input);
    assert.ok(result.score >= 70, String(result.score));
    assert.equal(result.canApply, false);
    assert.deepEqual(result.missingRequired.map((f) => f.key), ['phone']);
  });
});

describe('computeProfileCompletion — graded fields', () => {
  it('skills: <3 → 0, 3–4 → 5, 5+ → 8', () => {
    const points = (skills) => score({ profile: { skills } }).fields.find((f) => f.key === 'skills').points;
    assert.equal(points(['Sales', 'Excel']), 0);
    assert.equal(points(['Sales', 'Excel', 'Billing']), 5);
    assert.equal(points(['Sales', 'Excel', 'Billing', 'Hindi']), 5);
    assert.equal(points(['Sales', 'Excel', 'Billing', 'Hindi', 'Tally']), 8);
  });

  it('summary: <120 chars → 0, 120–239 → 4, 240+ → 8', () => {
    const points = (summary) => score({ profile: { summary } }).fields.find((f) => f.key === 'summary').points;
    assert.equal(points('Hard working.'), 0);
    assert.equal(points(SUMMARY_150), 4);
    assert.equal(points(SUMMARY_240), 8);
  });
});

describe('computeProfileCompletion — anti-gaming', () => {
  it('skills ["js","js","JS "] count as one → required unsatisfied', () => {
    assert.deepEqual(dedupeSkills(['js', 'js', 'JS ']), ['js']);
    const skills = score({ profile: { skills: ['js', 'js', 'JS '] } }).fields.find((f) => f.key === 'skills');
    assert.equal(skills.satisfied, false);
  });

  it('dedupe ignores punctuation but keeps C++ distinct from C#, drops 1-char skills', () => {
    assert.deepEqual(dedupeSkills(['Node.js', 'nodejs', 'C++', 'C#', 'C', ' ']), ['Node.js', 'C++', 'C#']);
  });

  it('summary that is the preferred role repeated earns nothing', () => {
    const summary = Array(20).fill('Sales Executive').join(' ');
    const result = score({ profile: { summary, preferences: { preferredRole: 'Sales Executive' } } });
    assert.equal(result.fields.find((f) => f.key === 'summary').satisfied, false);
  });

  it('full name must be two words, 3+ chars and not an email', () => {
    const ok = (fullName) => score({ profile: { fullName } }).fields.find((f) => f.key === 'fullName').satisfied;
    assert.equal(ok('Priya Sharma'), true);
    assert.equal(ok('Priya'), false);
    assert.equal(ok('priya@example.com'), false);
    assert.equal(ok('Candidate'), false);
  });

  it('phone must be a valid Indian mobile', () => {
    const ok = (mobile) => score({ user: { mobile } }).fields.find((f) => f.key === 'phone').satisfied;
    assert.equal(ok('9876543210'), true);
    assert.equal(ok('+91 98765 43210'), true);
    assert.equal(ok('1234567890'), false);
    assert.equal(ok(''), false);
  });

  it('placeholder strings ("Not specified") do not count', () => {
    const result = score({
      profile: { highestQualification: 'Not specified', preferences: { preferredRole: 'Not specified', preferredLocation: 'Not specified' } },
    });
    const missing = result.missingRequired.map((f) => f.key);
    assert.ok(missing.includes('qualification'));
    assert.ok(missing.includes('preferredRole'));
    assert.ok(missing.includes('preferredLocation'));
  });

  it('experienced candidates need a work-history entry with company, role and start month', () => {
    const ok = (experience) =>
      score({ profile: { experienceStatus: 'experienced', experience } }).fields.find((f) => f.key === 'experienceDetail').satisfied;
    assert.equal(ok([]), false);
    assert.equal(ok([{ company: 'Acme', role: 'Sales Lead' }]), false);
    assert.equal(ok([{ company: 'Acme', role: 'Sales Lead', startDate: '2022-04', current: true }]), true);
  });

  it('a generated resume counts only when it would contain something real', () => {
    const resumePoints = (profile) => score({ profile }).fields.find((f) => f.key === 'resume').points;
    const base = {
      highestQualification: 'MBA',
      skills: ['Sales', 'Excel', 'Billing'],
      preferences: { preferredRole: 'Sales Executive' },
    };
    assert.equal(resumePoints({}), 0);
    assert.equal(resumePoints(base), 0);
    assert.equal(resumePoints({ ...base, summary: SUMMARY_150 }), 11);
    assert.equal(resumePoints({ ...base, projects: [{ name: 'Store revamp' }] }), 11);
  });

  it('uploaded certificate files count as certification proof', () => {
    const result = score({ profile: {}, certificateFileCount: 1 });
    assert.equal(result.fields.find((f) => f.key === 'certifications').satisfied, true);
  });
});
