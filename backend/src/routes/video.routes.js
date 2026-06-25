import { Router } from 'express';

import { getShowcaseVideos } from '../controllers/video.controller.js';

const router = Router();

// Public — real candidate videos for the home page showcase.
router.get('/showcase', getShowcaseVideos);

export default router;
