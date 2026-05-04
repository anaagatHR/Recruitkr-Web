import { Router } from 'express';

import { uploadFile } from '../controllers/upload.controller.js';
import { requireAuth } from '../middlewares/auth.js';
import { secureFileUpload } from '../middlewares/upload.js';

const router = Router();

router.post('/file', requireAuth, secureFileUpload.single('file'), uploadFile);

export default router;
