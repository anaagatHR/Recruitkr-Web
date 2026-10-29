/**
 * Backfill missing company names on public job listings, and report every
 * listing that is still incomplete afterwards.
 *
 * Background (site audit, Oct 2026): 49 of the 50 jobs on the first page of
 * /api/v1/jobs had an empty companyName, so cards showed "Company" and the
 * job page <title> read "… at Company". Most of those documents live in the
 * legacy `jobs` / `openings` collections written by the Business OS CRM, and
 * the owner account's ClientProfile usually does know the company.
 *
 * What this does, per collection (jobRequirements, jobs, openings):
 *   1. Finds active docs with no usable company field.
 *   2. Resolves the owning client (clientId / ownerId / createdBy / postedBy /
 *      created_by / posted_by) and reads ClientProfile.companyName.
 *   3. Writes it to `company` (the field normalizePublicJob reads first).
 *   4. Prints a table of listings that remain incomplete (no company and/or
 *      a description shorter than 40 chars) so an admin can finish or
 *      unpublish them.
 *
 * Usage:
 *   node scripts/backfillJobCompanies.js            # dry run — prints the plan
 *   node scripts/backfillJobCompanies.js --apply    # writes the changes
 *   node scripts/backfillJobCompanies.js --apply --fallback="Confidential Employer"
 *       # also stamps a fallback name on docs whose owner has no profile name
 *
 * Safe to run repeatedly: it only touches documents that have no company.
 */
import mongoose from 'mongoose';

import { connectDb } from '../src/config/db.js';
import { ClientProfile } from '../src/models/ClientProfile.js';
import { JobRequirement } from '../src/models/JobRequirement.js';
import { invalidateJobsCache } from '../src/services/jobSearch.service.js';

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const fallbackArg = args.find((a) => a.startsWith('--fallback='));
const FALLBACK_NAME = fallbackArg ? fallbackArg.split('=').slice(1).join('=').replace(/^"|"$/g, '') : '';

const MIN_DESCRIPTION = 40;

const COMPANY_FIELDS = [
  'company',
  'companyName',
  'company_name',
  'employer',
  'employerName',
  'employer_name',
  'clientName',
  'client_name',
  'hiringCompany',
];
const OWNER_FIELDS = ['clientId', 'ownerId', 'createdBy', 'postedBy', 'created_by', 'posted_by'];

const str = (v) => (typeof v === 'string' ? v.trim() : v == null ? '' : String(v).trim());

const existingCompany = (doc) => {
  for (const field of COMPANY_FIELDS) {
    const value = str(doc[field]);
    if (value && !/^company$/i.test(value)) return value;
  }
  const nested = str(doc.company?.name) || str(doc.client?.companyName) || str(doc.employer?.name);
  return nested && !/^company$/i.test(nested) ? nested : '';
};

const ownerIdOf = (doc) => {
  for (const field of OWNER_FIELDS) {
    const value = str(doc[field]);
    if (value && mongoose.isValidObjectId(value)) return value;
  }
  return '';
};

const descriptionOf = (doc) =>
  str(doc.jobDescription) || str(doc.description) || str(doc.job_description) || str(doc.details) || '';

const isActive = (doc) => str(doc.status || 'active').toLowerCase() === 'active';

const run = async () => {
  await connectDb();
  const db = mongoose.connection.db;

  const profileCache = new Map();
  const companyForOwner = async (ownerId) => {
    if (!ownerId) return '';
    if (profileCache.has(ownerId)) return profileCache.get(ownerId);
    const profile = await ClientProfile.findOne({ userId: ownerId })
      .select('companyName company name')
      .lean();
    const name = str(profile?.companyName) || str(profile?.company) || str(profile?.name);
    profileCache.set(ownerId, name);
    return name;
  };

  const collections = ['jobrequirements', 'jobs', 'openings'];
  const plan = [];
  const stillIncomplete = [];

  for (const collectionName of collections) {
    const docs = await db.collection(collectionName).find({}).toArray();
    const active = docs.filter(isActive);
    let missing = 0;

    for (const doc of active) {
      let company = existingCompany(doc);
      const description = descriptionOf(doc);

      if (!company) {
        missing += 1;
        const fromProfile = await companyForOwner(ownerIdOf(doc));
        const resolved = fromProfile || FALLBACK_NAME;
        if (resolved) {
          plan.push({ collectionName, _id: doc._id, title: str(doc.jobTitle || doc.title), company: resolved, source: fromProfile ? 'ClientProfile' : 'fallback' });
          company = resolved;
        }
      }

      if (!company || description.length < MIN_DESCRIPTION) {
        stillIncomplete.push({
          collection: collectionName,
          id: String(doc._id),
          title: str(doc.jobTitle || doc.title) || '(untitled)',
          company: company || '—',
          descriptionChars: description.length,
        });
      }
    }

    console.log(`${collectionName}: ${docs.length} docs, ${active.length} active, ${missing} without a company name`);
  }

  console.log('');
  console.log(`${APPLY ? 'Applying' : 'Dry run —'} ${plan.length} company backfill(s):`);
  for (const item of plan) {
    console.log(`  [${item.collectionName}] ${item._id}  "${item.title}"  →  ${item.company}  (${item.source})`);
  }

  if (APPLY && plan.length) {
    for (const item of plan) {
      await db.collection(item.collectionName).updateOne(
        { _id: item._id },
        { $set: { company: item.company, companyBackfilledAt: new Date() } },
      );
    }
    invalidateJobsCache();
    console.log(`Updated ${plan.length} document(s).`);
  } else if (!APPLY && plan.length) {
    console.log('Re-run with --apply to write these.');
  }

  console.log('');
  console.log(`${stillIncomplete.length} listing(s) remain incomplete (hidden from homepage strips until fixed):`);
  if (stillIncomplete.length) console.table(stillIncomplete);

  await mongoose.disconnect();
  process.exit(0);
};

run().catch(async (error) => {
  console.error('Backfill failed:', error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});

// Referenced so the model is registered before raw-collection reads run.
void JobRequirement;
