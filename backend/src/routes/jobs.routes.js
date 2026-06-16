import { Router } from 'express';

import {
  applyToJob,
  createJob,
  deleteMyJob,
  downloadClientApplicationResume,
  updateMyJob,
  getClientApplicationDetails,
  getPublicJob,
  listCandidateApplications,
  listClientApplications,
  listMyJobs,
  listPublicJobs,
  updateApplicationStatus,
  updateMyJobStatus,
} from '../controllers/job.controller.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import {
  applyJobSchema,
  updateApplicationStatusSchema,
} from '../schemas/application.schema.js';
import { createJobSchema, listJobsQuerySchema, updateJobSchema, updateJobStatusSchema } from '../schemas/job.schema.js';

const router = Router();

router.get('/', validate(listJobsQuerySchema, 'query'), listPublicJobs);

router.post('/', requireAuth, requireRole('client'), validate(createJobSchema), createJob);
router.get('/mine', requireAuth, requireRole('client'), listMyJobs);
router.patch('/:jobId', requireAuth, requireRole('client'), validate(updateJobSchema), updateMyJob);
router.delete('/:jobId', requireAuth, requireRole('client'), deleteMyJob);
router.patch(
  '/:jobId/status',
  requireAuth,
  requireRole('client'),
  validate(updateJobStatusSchema),
  updateMyJobStatus,
);

router.post('/apply', requireAuth, requireRole('candidate'), validate(applyJobSchema), applyToJob);
router.get(
  '/applications/mine',
  requireAuth,
  requireRole('candidate'),
  listCandidateApplications,
);
router.get('/applications', requireAuth, requireRole('client', 'admin'), listClientApplications);
router.get(
  '/applications/:applicationId',
  requireAuth,
  requireRole('client', 'admin'),
  getClientApplicationDetails,
);
router.get(
  '/applications/:applicationId/resume',
  requireAuth,
  requireRole('client', 'admin'),
  downloadClientApplicationResume,
);
router.patch(
  '/applications/:applicationId/status',
  requireAuth,
  requireRole('client', 'admin'),
  validate(updateApplicationStatusSchema),
  updateApplicationStatus,
);

// Public single-job lookup — keep last so it doesn't shadow the routes above.
router.get('/:jobId', getPublicJob);

export default router;
