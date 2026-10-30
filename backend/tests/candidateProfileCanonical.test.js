/**
 * Phase 2 (audit P1-3): duplicated profile fields collapse into one canonical
 * copy, API responses carry no mirror keys, and the generated resume is a
 * projection of the profile. Run with: npm test
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

const {
  LEGACY_MIRROR_FIELDS,
  planCandidateProfileMigration,
  syncCandidateLegacyFields,
  toCandidateProfileResponse,
} = await import('../src/services/candidateProfile.service.js');
const { buildGeneratedResumeData, buildResumeProfile } = await import('../src/services/resume.service.js');

describe('planCandidateProfileMigration', () => {
  it('fills canonical gaps from legacy copies', () => {
    const plan = planCandidateProfileMigration(
      { name: 'Priya Sharma', about: 'Sales lead', preferredRole: 'Sales', workModes: ['Remote'], phone: '+91 98765 43210' },
      { email: 'priya@example.com' },
    );
    assert.equal(plan.set.fullName, 'Priya Sharma');
    assert.equal(plan.set.summary, 'Sales lead');
    assert.equal(plan.set['preferences.preferredRole'], 'Sales');
    assert.deepEqual(plan.set['preferences.workModes'], ['Remote']);
    assert.equal(plan.userMobile, '9876543210');
    assert.equal(plan.conflicts.length, 0);
  });

  it('keeps the canonical value and reports a conflict when both copies differ', () => {
    const plan = planCandidateProfileMigration({ fullName: 'Priya Sharma', name: 'P Sharma' }, {});
    assert.equal(plan.set.fullName, undefined);
    assert.deepEqual(plan.conflicts, [{ field: 'fullName', kept: 'Priya Sharma', dropped: 'P Sharma', droppedFrom: 'name' }]);
  });

  it('clears placeholders, the default DOB and an email-prefix name', () => {
    const plan = planCandidateProfileMigration(
      {
        fullName: 'pekkarockz1',
        name: 'pekkarockz1',
        highestQualification: 'Not specified',
        address: 'Not provided',
        pincode: '000000',
        dateOfBirth: new Date('2000-01-01T00:00:00.000Z'),
        preferences: { preferredRole: 'Not specified' },
      },
      { email: 'pekkarockz1@gmail.com' },
    );
    assert.equal(plan.set.fullName, '');
    assert.equal(plan.set.highestQualification, '');
    assert.equal(plan.set.address, '');
    assert.equal(plan.set.pincode, '');
    assert.equal(plan.set['preferences.preferredRole'], '');
    assert.deepEqual(plan.unset, ['dateOfBirth']);
  });

  it('keeps a city that equals preferredLocation (it may be what the candidate typed)', () => {
    const plan = planCandidateProfileMigration({ city: 'Jaipur', preferences: { preferredLocation: 'Jaipur' } }, {});
    assert.equal(plan.set.city, undefined);
  });

  it('does not overwrite a valid user mobile', () => {
    const plan = planCandidateProfileMigration({ phone: '9123456789' }, { mobile: '9876543210' });
    assert.equal(plan.userMobile, null);
  });

  it('is a no-op on an already-canonical profile (idempotent)', () => {
    const profile = {
      fullName: 'Priya Sharma',
      summary: 'Sales lead',
      city: 'Jaipur',
      highestQualification: 'MBA',
      preferences: { preferredRole: 'Sales', preferredLocation: 'Delhi', preferredIndustry: 'Retail', workModes: ['Remote'] },
    };
    syncCandidateLegacyFields({ profile, user: { email: 'priya@example.com', mobile: '9876543210' } });
    const plan = planCandidateProfileMigration(profile, { email: 'priya@example.com', mobile: '9876543210' });
    assert.deepEqual(plan, { set: {}, unset: [], userMobile: null, conflicts: [] });
  });
});

describe('toCandidateProfileResponse', () => {
  it('drops every legacy mirror key and takes phone from the user', () => {
    const profile = { fullName: 'Priya Sharma', city: 'Jaipur', phone: 'stale' };
    syncCandidateLegacyFields({ profile, user: { mobile: '9876543210' } });
    const data = toCandidateProfileResponse(profile, { mobile: '9876543210' });
    for (const key of LEGACY_MIRROR_FIELDS) assert.equal(key in data, false, key);
    assert.equal(data.phone, '9876543210');
    assert.equal(data.city, 'Jaipur');
  });
});

describe('resume projection', () => {
  const profile = {
    fullName: 'Priya Sharma',
    highestQualification: 'MBA',
    college: 'University of Rajasthan',
    skills: ['Sales', 'sales', 'Excel'],
    experienceStatus: 'experienced',
    experienceDetails: { currentCompany: 'Old Co', designation: 'Old role' },
    experience: [
      { company: 'Acme', role: 'Sales Lead', startDate: '2022-04', endDate: '', current: true },
      { company: 'Beta', role: 'Intern', startDate: '2021-01', endDate: '2021-06', current: false },
    ],
  };

  it('builds experience from the work-history entries, not the legacy single job', () => {
    const data = buildGeneratedResumeData(profile);
    assert.deepEqual(
      data.experience.map((e) => [e.title, e.company]),
      [
        ['Sales Lead', 'Acme'],
        ['Intern', 'Beta'],
      ],
    );
    assert.match(data.experience[0].duration, /Apr 2022 - Present/);
    assert.deepEqual(data.education, [
      { degree: 'MBA', institution: 'University of Rajasthan', year: '', description: '' },
    ]);
    assert.deepEqual(data.skills, ['Sales', 'sales', 'Excel']);
  });

  it('ignores the legacy single job for freshers', () => {
    assert.deepEqual(buildGeneratedResumeData({ ...profile, experienceStatus: 'fresher' }).experience, []);
  });

  it('merges typed and uploaded certifications and takes contact from the user', () => {
    const out = buildResumeProfile({
      profile: { ...profile, certifications: [{ name: 'AWS', institute: 'Amazon' }] },
      user: { email: 'priya@example.com', mobile: '9876543210' },
      certificateFiles: [{ title: 'First Aid' }],
    });
    assert.equal(out.mobile, '9876543210');
    assert.deepEqual(
      out.certifications.map((c) => c.name),
      ['AWS', 'First Aid'],
    );
    assert.equal(out.experienceEntries.length, 2);
  });
});
