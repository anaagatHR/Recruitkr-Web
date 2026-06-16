import { Router } from 'express';

import { listCompanyLogos, listJobVideos, uploadFile } from '../controllers/upload.controller.js';
import { requireAuth } from '../middlewares/auth.js';
import { secureFileUpload } from '../middlewares/upload.js';

const router = Router();

router.get('/logos', listCompanyLogos);
router.get('/videos', listJobVideos);
router.post('/file', requireAuth, secureFileUpload.single('file'), uploadFile);

export default router;
