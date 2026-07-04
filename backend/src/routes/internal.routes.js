import { Router } from 'express';

import { provisionIntern } from '../controllers/internal.controller.js';

const router = Router();

// Server-to-server endpoints for the RecruitKr CRM. No user session — each
// handler validates the shared INTERNAL_PROVISION_KEY header itself.
router.post('/interns/provision', provisionIntern);

export default router;
