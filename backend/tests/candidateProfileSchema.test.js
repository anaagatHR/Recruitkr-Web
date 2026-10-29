/**
 * Phase 1 (audit P0-1): the candidate PATCH schema accepts name, phone, city,
 * college and a work-history array. Run with: npm test
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { updateCandidateProfileSchema } from '../src/schemas/user.schema.js';

const parse = (body) => updateCandidateProfileSchema.safeParse(body);

describe('updateCandidateProfileSchema — mobile', () => {
  it('normalises common Indian formats to 10 digits', () => {
    for (const input of ['9876543210', '98765 43210', '+91 98765-43210', '919876543210', '09876543210']) {
      const result = parse({ mobile: input });
      assert.equal(result.success, true, input);
      assert.equal(result.data.mobile, '9876543210', input);
    }
  });

  it('rejects numbers that are not valid Indian mobiles', () => {
    for (const input of ['12345', '5876543210', 'abcdefghij', '', '98765432101']) {
      assert.equal(parse({ mobile: input }).success, false, input);
    }
  });
});

describe('updateCandidateProfileSchema — new profile fields', () => {
  it('accepts city, college, fullName and work history', () => {
    const result = parse({
      fullName: 'Priya Sharma',
      city: 'Jaipur',
      college: 'University of Rajasthan',
      experience: [
        { company: 'Acme', role: 'Sales Executive', startDate: '2022-04', endDate: '', current: true },
        { company: 'Beta', role: 'Intern', startDate: '2021-01', endDate: '2021-06', current: false },
      ],
    });
    assert.equal(result.success, true, JSON.stringify(result.error?.issues));
  });

  it('rejects malformed months and unknown experience keys', () => {
    assert.equal(parse({ experience: [{ company: 'Acme', startDate: '04/2022' }] }).success, false);
    assert.equal(parse({ experience: [{ company: 'Acme', startDate: '2022-13' }] }).success, false);
    assert.equal(parse({ experience: [{ company: 'Acme', salary: 5 }] }).success, false);
  });

  it('still rejects unknown top-level keys', () => {
    assert.equal(parse({ phone: '9876543210' }).success, false);
  });
});
