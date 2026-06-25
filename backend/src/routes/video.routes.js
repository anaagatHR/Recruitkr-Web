import { Router } from 'express';

import { getHomeStories, getShorts, getShowcaseVideos } from '../controllers/video.controller.js';

const router = Router();

// Public — real candidate videos for the home page showcase.
router.get('/showcase', getShowcaseVideos);
// Public — YouTube Shorts for the candidate/employer carousels (from the DB).
router.get('/shorts', getShorts);
// Public — home "Success Stories" cards managed from the CRM Web Panel.
router.get('/stories', getHomeStories);

export default router;
