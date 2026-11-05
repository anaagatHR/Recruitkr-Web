import { Router } from 'express';

import {
  createMember,
  importFromDrive,
  listMedia,
  listTeam,
  reorderTeam,
  setMemberActive,
  updateMember,
  uploadMedia,
} from '../controllers/studio.controller.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import { studioMediaUpload } from '../middlewares/upload.js';

/** Site Studio: media library and team manager. Every route is admin-only. */
const router = Router();
router.use(requireAuth, requireRole('admin'));

router.get('/media', listMedia);
router.post('/media', studioMediaUpload.single('file'), uploadMedia);
router.post('/media/from-drive', importFromDrive);

router.get('/team', listTeam);
router.post('/team', createMember);
router.put('/team/reorder', reorderTeam);
router.put('/team/:id', updateMember);
router.patch('/team/:id/active', setMemberActive);

export default router;
