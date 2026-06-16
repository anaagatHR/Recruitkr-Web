/**
 * Backfill the Apache Solr `jobs` core from MongoDB.
 *
 * Usage:
 *   node scripts/reindexSolr.js
 *
 * Requires SOLR_URL (and optionally SOLR_JOBS_CORE) in the environment. Reads
 * every active public job from MongoDB, clears the Solr index, and re-indexes
 * in batches. Safe to run repeatedly.
 */
import mongoose from 'mongoose';

import { connectDb } from '../src/config/db.js';
import { env } from '../src/config/env.js';
import { loadActiveNormalizedJobs } from '../src/controllers/job.controller.js';
import {
  clearJobsIndex,
  commitSolr,
  indexJobs,
  isSolrConfigured,
  pingSolr,
} from '../src/services/solr.service.js';

const BATCH_SIZE = 200;

const run = async () => {
  if (!isSolrConfigured()) {
    console.error('SOLR_URL is not set. Add it to backend/.env before reindexing.');
    process.exit(1);
  }

  await connectDb();

  const reachable = await pingSolr({ force: true });
  if (!reachable) {
    console.error(`Cannot reach Solr core "${env.SOLR_JOBS_CORE}" at ${env.SOLR_URL}.`);
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log('Loading active jobs from MongoDB...');
  const jobs = await loadActiveNormalizedJobs();
  console.log(`Found ${jobs.length} active jobs.`);

  console.log('Clearing existing Solr index...');
  await clearJobsIndex();

  for (let i = 0; i < jobs.length; i += BATCH_SIZE) {
    const batch = jobs.slice(i, i + BATCH_SIZE);
    await indexJobs(batch);
    console.log(`Indexed ${Math.min(i + BATCH_SIZE, jobs.length)}/${jobs.length}`);
  }

  await commitSolr();
  console.log('Reindex complete.');

  await mongoose.disconnect();
  process.exit(0);
};

run().catch(async (error) => {
  console.error('Reindex failed:', error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
