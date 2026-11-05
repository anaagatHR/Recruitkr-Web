import { Router } from 'express';

import {
  createPreviewToken,
  discardDraft,
  getPreview,
  getPublished,
  listContent,
  listRevisions,
  publishAll,
  publishKey,
  rollback,
  saveDraft,
} from '../controllers/siteContent.controller.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';

const router = Router();
const admin = [requireAuth, requireRole('admin')];

// Public: the website reads these.
router.get('/published', getPublished);
router.get('/preview', getPreview); // gated by a signed, short-lived preview token

// Site Studio (admins only).
router.get('/', ...admin, listContent);
router.post('/preview-token', ...admin, createPreviewToken);
router.post('/publish-all', ...admin, publishAll);
router.put('/:key', ...admin, saveDraft);
router.post('/:key/publish', ...admin, publishKey);
router.post('/:key/discard', ...admin, discardDraft);
router.get('/:key/revisions', ...admin, listRevisions);
router.post('/:key/rollback/:revisionId', ...admin, rollback);

export default router;
