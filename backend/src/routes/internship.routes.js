import { Router } from 'express';

import { applyForInternship, getInternshipStatus } from '../controllers/intern.controller.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';

const router = Router();

router.use(requireAuth, requireRole('candidate'));
router.post('/apply', applyForInternship);
router.get('/my-status', getInternshipStatus);

export default router;
