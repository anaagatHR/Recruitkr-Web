import { Router } from 'express';

import { listPublicJobs } from '../controllers/job.controller.js';
import {
  candidateSuggestions,
  searchCandidates,
  searchSuggestions,
} from '../controllers/search.controller.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { listJobsQuerySchema } from '../schemas/job.schema.js';

const router = Router();

// Public job search — reuses the public listing handler (Solr fast-path + Mongo
// fallback + normalization already built in), so results match /jobs exactly.
router.get('/jobs', validate(listJobsQuerySchema, 'query'), listPublicJobs);

// Public job autocomplete (no PII).
router.get('/suggestions', searchSuggestions);

// Recruiter-only candidate search + autocomplete. PII (email/phone) is never
// returned here — it is reachable only through an authorized application/chat.
router.get('/candidates', requireAuth, requireRole('client', 'admin'), searchCandidates);
router.get(
  '/candidates/suggestions',
  requireAuth,
  requireRole('client', 'admin'),
  candidateSuggestions,
);

export default router;
