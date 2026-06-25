/**
 * Backfill the Apache Solr `candidates` core from MongoDB.
 *
 * Usage:
 *   node scripts/reindexCandidatesSolr.js
 *
 * Requires SOLR_URL (and optionally SOLR_CANDIDATES_CORE) in the environment.
 * Reads every candidate profile, clears the candidates index, and re-indexes in
 * batches. PII (email/phone) is never indexed. Safe to run repeatedly.
 */
import mongoose from 'mongoose';

import { connectDb } from '../src/config/db.js';
import { env } from '../src/config/env.js';
import { CandidateProfile } from '../src/models/CandidateProfile.js';
import {
  clearCandidatesIndex,
  commitCandidates,
  indexCandidates,
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
    console.error(`Cannot reach Solr at ${env.SOLR_URL}. Is the candidates core "${env.SOLR_CANDIDATES_CORE}" created?`);
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log('Loading candidate profiles from MongoDB...');
  const profiles = await CandidateProfile.find({}).lean().exec();
  console.log(`Found ${profiles.length} candidate profiles.`);

  console.log('Clearing existing candidates index...');
  await clearCandidatesIndex();

  for (let i = 0; i < profiles.length; i += BATCH_SIZE) {
    const batch = profiles.slice(i, i + BATCH_SIZE);
    await indexCandidates(batch);
    console.log(`Indexed ${Math.min(i + BATCH_SIZE, profiles.length)}/${profiles.length}`);
  }

  await commitCandidates();
  console.log('Candidate reindex complete.');

  await mongoose.disconnect();
  process.exit(0);
};

run().catch(async (error) => {
  console.error('Candidate reindex failed:', error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
