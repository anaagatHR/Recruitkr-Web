/**
 * Collapse duplicated candidate-profile fields into their canonical copy
 * (audit P1-3, Phase 2). See src/services/candidateProfile.service.js for the
 * canonical map.
 *
 * Per profile:
 *   1. Coalesces each pair (canonical wins; the legacy copy only fills a gap):
 *      fullName<-name, summary<-about, preferences.<field><-top-level preferredRole,
 *      preferredLocation, preferredIndustry and workModes,
 *      User.mobile<-profile.phone/mobile (when the user has no valid mobile).
 *   2. Clears placeholder values older code wrote ("Not specified",
 *      "Not provided", "000000", the 2000-01-01 default DOB, an email-prefix name).
 *   3. Re-writes the legacy mirror fields from the canonical values.
 * Every pair whose two copies disagreed is printed so an admin can review it.
 *
 * Usage:
 *   node scripts/migrateCandidateProfiles.js           # dry run — prints the plan
 *   node scripts/migrateCandidateProfiles.js --apply   # writes the changes
 *
 * Safe to run repeatedly: a second run finds nothing to change.
 * Afterwards run `npm run solr:reindex:candidates` if Solr is configured.
 */
import mongoose from 'mongoose';

import { connectDb } from '../src/config/db.js';
import { CandidateProfile } from '../src/models/CandidateProfile.js';
import { User } from '../src/models/User.js';
import {
  planCandidateProfileMigration,
  syncCandidateLegacyFields,
} from '../src/services/candidateProfile.service.js';

const APPLY = process.argv.slice(2).includes('--apply');

const run = async () => {
  await connectDb();
  console.log(`[migrate-candidates] ${APPLY ? 'APPLY' : 'DRY RUN'}`);

  let scanned = 0;
  let changed = 0;
  let mobilesFilled = 0;
  const conflicts = [];

  const cursor = CandidateProfile.find({}).lean().cursor();
  for await (const profile of cursor) {
    scanned += 1;
    const user = (await User.findById(profile.userId).select('email mobile').lean()) || {};
    const plan = planCandidateProfileMigration(profile, user);
    const label = profile.recruitkrId || String(profile._id);

    plan.conflicts.forEach((conflict) => conflicts.push({ profile: label, ...conflict }));
    const hasProfileChanges = Object.keys(plan.set).length > 0 || plan.unset.length > 0;
    if (!hasProfileChanges && !plan.userMobile) continue;

    changed += 1;
    if (plan.userMobile) mobilesFilled += 1;
    console.log(`  ${label}`, JSON.stringify({ set: plan.set, unset: plan.unset, userMobile: plan.userMobile }));

    if (!APPLY) continue;

    if (plan.userMobile) {
      await User.updateOne({ _id: profile.userId }, { $set: { mobile: plan.userMobile } });
      user.mobile = plan.userMobile;
    }
    if (hasProfileChanges) {
      await CandidateProfile.updateOne(
        { _id: profile._id },
        {
          ...(Object.keys(plan.set).length ? { $set: plan.set } : {}),
          ...(plan.unset.length ? { $unset: Object.fromEntries(plan.unset.map((key) => [key, ''])) } : {}),
        },
      );
    }

    // Mirrors are re-derived from the now-canonical values (external CRM reads them).
    const doc = await CandidateProfile.findById(profile._id);
    syncCandidateLegacyFields({ profile: doc, user });
    await doc.save();
  }

  console.log(`\n[migrate-candidates] scanned=${scanned} changed=${changed} userMobilesFilled=${mobilesFilled}`);
  if (conflicts.length) {
    console.log(`[migrate-candidates] ${conflicts.length} conflict(s) — canonical value kept, legacy value dropped:`);
    console.table(conflicts);
  }
  if (!APPLY && changed) console.log('Re-run with --apply to write these changes.');

  await mongoose.disconnect();
  process.exit(0);
};

run().catch(async (error) => {
  console.error('[migrate-candidates] failed:', error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
