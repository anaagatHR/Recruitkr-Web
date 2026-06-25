import { Router } from 'express';

import { handleAssistantMessage } from '../controllers/assistant.controller.js';
import { assistantLimiter } from '../middlewares/rateLimiter.js';

const router = Router();

// Native RecruitKrBot — no external AI. Rate-limited to bound abuse.
router.post('/message', assistantLimiter, handleAssistantMessage);

export default router;
